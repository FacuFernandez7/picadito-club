import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useTournament } from '../context/TournamentContext';
import {
  computeMatchupWinner,
  isRoundComplete,
  generateNextRound,
  getRoundName,
} from '../utils/bracket';
import ScoreModal from '../components/ScoreModal';

export default function CupScreen() {
  const { state, dispatch } = useTournament();
  const [activeModal, setActiveModal] = useState(null);
  // activeModal: { matchupId, legType: 'single'|'leg1'|'leg2', homePlayer, awayPlayer, initialHome, initialAway }

  const currentRound = state.cupRounds[state.cupCurrentRound];
  const isHomeAwayFormat = state.cupFormat === 'home-away';
  const isFinalRound = currentRound?.name === 'Final';
  const roundComplete = currentRound ? isRoundComplete(currentRound) : false;
  const totalRounds = Math.ceil(Math.log2(Math.max(state.players.length, 2)));

  function handleScoreConfirm(homeScore, awayScore) {
    // Guard against race condition
    if (!activeModal) return;
    const { matchupId, legType } = activeModal;
    const matchup = currentRound.matchups.find(m => m.id === matchupId);
    if (!matchup) return;

    let updates = {};
    if (legType === 'leg1') {
      updates = { leg1HomeGoals: homeScore, leg1AwayGoals: awayScore, leg1Played: true };
    } else if (legType === 'leg2') {
      updates = { leg2HomeGoals: homeScore, leg2AwayGoals: awayScore, leg2Played: true };
    } else {
      updates = { homeScore, awayScore };
    }

    const updatedMatchup = { ...matchup, ...updates };
    const winner = computeMatchupWinner(updatedMatchup, state.cupFormat, isFinalRound);

    setActiveModal(null);
    dispatch({
      type: 'UPDATE_CUP_MATCHUP',
      id: matchupId,
      updates: { ...updates, winner },
    });
  }

  function handlePenaltyWinner(matchupId, winner) {
    dispatch({
      type: 'UPDATE_CUP_MATCHUP',
      id: matchupId,
      updates: { penaltyWinner: winner, winner },
    });
  }

  function handleAdvanceRound() {
    if (isFinalRound) {
      const winner = currentRound.matchups[0]?.winner;
      dispatch({ type: 'FINISH_CUP', winner });
    } else {
      const nextIndex = state.cupCurrentRound + 1;
      const nextRound = generateNextRound(currentRound, state.cupFormat, nextIndex);
      dispatch({ type: 'ADVANCE_CUP_ROUND', nextRound });
    }
  }

  function handleNewTournament() {
    Alert.alert(
      'Nuevo torneo',
      '¿Seguro? Se perderá el progreso actual.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, nuevo torneo',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'RESET' });
            router.dismissAll();
          },
        },
      ]
    );
  }

  // ─── Champion screen ───────────────────────────────────────────────────────
  if (state.cupFinished) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.championContainer}>
          <Text style={styles.championTrophy}>🏆</Text>
          <Text style={styles.championLabel}>¡Campeón!</Text>
          <Text style={styles.championName}>{state.cupWinner}</Text>
          <Text style={styles.championSub}>
            Copa · {state.players.length} jugadores
          </Text>
          <TouchableOpacity
            style={styles.newTournamentBtn}
            onPress={() => {
              dispatch({ type: 'RESET' });
              router.dismissAll();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.newTournamentBtnText}>Nuevo torneo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Matchup renderers ─────────────────────────────────────────────────────

  function renderBye(matchup) {
    return (
      <View key={matchup.id} style={[styles.matchupCard, styles.matchupCardBye]}>
        <Text style={styles.byeText}>
          🎯  {matchup.home} pasa de ronda directamente
        </Text>
      </View>
    );
  }

  function renderHomeAwayMatchup(matchup) {
    const homeTotal = (matchup.leg1HomeGoals ?? 0) + (matchup.leg2AwayGoals ?? 0);
    const awayTotal = (matchup.leg1AwayGoals ?? 0) + (matchup.leg2HomeGoals ?? 0);
    const bothLegsPlayed = matchup.leg1Played && matchup.leg2Played;
    const aggregateTied = bothLegsPlayed && homeTotal === awayTotal && !matchup.penaltyWinner;

    return (
      <View key={matchup.id} style={styles.matchupCard}>
        <View style={styles.matchupCardHeader}>
          <Text style={styles.matchupCardTitle} numberOfLines={1}>
            {matchup.home}  ·  {matchup.away}
          </Text>
          {matchup.winner && (
            <View style={styles.winnerBadge}>
              <Text style={styles.winnerBadgeText}>✓ {matchup.winner}</Text>
            </View>
          )}
        </View>

        {/* Leg 1 */}
        <TouchableOpacity
          style={styles.legRow}
          onPress={() =>
            setActiveModal({
              matchupId: matchup.id,
              legType: 'leg1',
              homePlayer: matchup.home,
              awayPlayer: matchup.away,
              initialHome: matchup.leg1Played ? matchup.leg1HomeGoals : null,
              initialAway: matchup.leg1Played ? matchup.leg1AwayGoals : null,
            })
          }
          activeOpacity={0.7}
        >
          <Text style={styles.legLabel}>Ida</Text>
          <Text style={styles.legResult}>
            {matchup.leg1Played
              ? `${matchup.home}  ${matchup.leg1HomeGoals} — ${matchup.leg1AwayGoals}  ${matchup.away}`
              : 'Pendiente'}
          </Text>
          <Text style={styles.legEditIcon}>{matchup.leg1Played ? '✎' : '+'}</Text>
        </TouchableOpacity>

        {/* Leg 2 — away plays at home */}
        <TouchableOpacity
          style={styles.legRow}
          onPress={() =>
            setActiveModal({
              matchupId: matchup.id,
              legType: 'leg2',
              homePlayer: matchup.away,
              awayPlayer: matchup.home,
              initialHome: matchup.leg2Played ? matchup.leg2HomeGoals : null,
              initialAway: matchup.leg2Played ? matchup.leg2AwayGoals : null,
            })
          }
          activeOpacity={0.7}
        >
          <Text style={styles.legLabel}>Vuelta</Text>
          <Text style={styles.legResult}>
            {matchup.leg2Played
              ? `${matchup.away}  ${matchup.leg2HomeGoals} — ${matchup.leg2AwayGoals}  ${matchup.home}`
              : 'Pendiente'}
          </Text>
          <Text style={styles.legEditIcon}>{matchup.leg2Played ? '✎' : '+'}</Text>
        </TouchableOpacity>

        {/* Aggregate */}
        {(matchup.leg1Played || matchup.leg2Played) && (
          <View style={styles.aggregateRow}>
            <Text style={styles.aggregateLabel}>Global:</Text>
            <Text style={styles.aggregateValue}>
              {matchup.home} {homeTotal} — {awayTotal} {matchup.away}
            </Text>
          </View>
        )}

        {/* Penalty selection */}
        {aggregateTied && (
          <View style={styles.penaltyBox}>
            <Text style={styles.penaltyBoxTitle}>
              Empate en el global. ¿Quién ganó los penales?
            </Text>
            <View style={styles.penaltyBtns}>
              <TouchableOpacity
                style={styles.penaltyBtn}
                onPress={() => handlePenaltyWinner(matchup.id, matchup.home)}
              >
                <Text style={styles.penaltyBtnText}>{matchup.home}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.penaltyBtn}
                onPress={() => handlePenaltyWinner(matchup.id, matchup.away)}
              >
                <Text style={styles.penaltyBtnText}>{matchup.away}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  function renderSingleMatchup(matchup) {
    const scorePlayed = matchup.homeScore !== null && matchup.awayScore !== null;
    const drawNoPenalty =
      scorePlayed && matchup.homeScore === matchup.awayScore && !matchup.penaltyWinner;

    return (
      <View key={matchup.id} style={styles.matchupCard}>
        {matchup.winner && (
          <View style={[styles.winnerBadge, { alignSelf: 'flex-end', marginBottom: 10 }]}>
            <Text style={styles.winnerBadgeText}>✓ {matchup.winner}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() =>
            setActiveModal({
              matchupId: matchup.id,
              legType: 'single',
              homePlayer: matchup.home,
              awayPlayer: matchup.away,
              initialHome: scorePlayed ? matchup.homeScore : null,
              initialAway: scorePlayed ? matchup.awayScore : null,
            })
          }
          activeOpacity={0.75}
        >
          <View style={styles.singleRow}>
            <Text
              style={[
                styles.singlePlayer,
                matchup.winner === matchup.home && styles.singlePlayerWinner,
              ]}
              numberOfLines={1}
            >
              {matchup.home}
            </Text>
            <View style={[styles.singleScorePill, scorePlayed && styles.singleScorePillPlayed]}>
              {scorePlayed ? (
                <Text style={styles.singleScoreText}>
                  {matchup.homeScore} — {matchup.awayScore}
                </Text>
              ) : (
                <Text style={styles.singleVsText}>vs</Text>
              )}
            </View>
            <Text
              style={[
                styles.singlePlayer,
                styles.singlePlayerRight,
                matchup.winner === matchup.away && styles.singlePlayerWinner,
              ]}
              numberOfLines={1}
            >
              {matchup.away}
            </Text>
          </View>
          {!scorePlayed && (
            <Text style={styles.tapHint}>Tocá para ingresar resultado</Text>
          )}
        </TouchableOpacity>

        {drawNoPenalty && (
          <View style={styles.penaltyBox}>
            <Text style={styles.penaltyBoxTitle}>
              Empate. ¿Quién ganó los penales?
            </Text>
            <View style={styles.penaltyBtns}>
              <TouchableOpacity
                style={styles.penaltyBtn}
                onPress={() => handlePenaltyWinner(matchup.id, matchup.home)}
              >
                <Text style={styles.penaltyBtnText}>{matchup.home}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.penaltyBtn}
                onPress={() => handlePenaltyWinner(matchup.id, matchup.away)}
              >
                <Text style={styles.penaltyBtnText}>{matchup.away}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  function renderMatchup({ item }) {
    if (item.bye) return renderBye(item);
    if (isHomeAwayFormat && !isFinalRound) return renderHomeAwayMatchup(item);
    return renderSingleMatchup(item);
  }

  const numWinners = currentRound?.matchups.length ?? 0;
  const nextRoundName = getRoundName(numWinners, false);

  // ─── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{currentRound?.name}</Text>
            <Text style={styles.headerSub}>
              Ronda {state.cupCurrentRound + 1} de {totalRounds}
              {'  ·  '}
              {isHomeAwayFormat ? 'Ida y vuelta' : 'Solo ida'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleNewTournament} style={styles.exitBtn}>
            <Text style={styles.exitBtnText}>Salir</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={currentRound?.matchups}
          keyExtractor={item => item.id}
          renderItem={renderMatchup}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {roundComplete && (
          <TouchableOpacity
            style={styles.advanceBtn}
            onPress={handleAdvanceRound}
            activeOpacity={0.85}
          >
            <Text style={styles.advanceBtnText}>
              {isFinalRound ? '🏆  Ver campeón' : `Avanzar a ${nextRoundName}  →`}
            </Text>
          </TouchableOpacity>
        )}

        <ScoreModal
          visible={activeModal !== null}
          homePlayer={activeModal?.homePlayer ?? ''}
          awayPlayer={activeModal?.awayPlayer ?? ''}
          label={
            activeModal?.legType === 'leg1'
              ? 'Ida'
              : activeModal?.legType === 'leg2'
              ? 'Vuelta'
              : ''
          }
          initialHome={activeModal?.initialHome}
          initialAway={activeModal?.initialAway}
          onConfirm={handleScoreConfirm}
          onClose={() => setActiveModal(null)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0B1F2E',
  },
  container: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 76,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3347',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4E8F7',
  },
  headerSub: {
    fontSize: 12,
    color: '#2E4255',
    marginTop: 3,
  },
  exitBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E3347',
  },
  exitBtnText: {
    color: '#5B7B96',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
  },
  // Matchup cards
  matchupCard: {
    backgroundColor: '#0F1923',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E3347',
  },
  matchupCardBye: {
    borderStyle: 'dashed',
    backgroundColor: '#0B1F2E',
  },
  byeText: {
    fontSize: 14,
    color: '#2E4255',
    fontStyle: 'italic',
  },
  matchupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchupCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D4E8F7',
    flex: 1,
    marginRight: 8,
  },
  winnerBadge: {
    backgroundColor: '#0A2028',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#0E3D30',
  },
  winnerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2DD4BF',
  },
  // Two-leg rows
  legRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#152230',
  },
  legLabel: {
    width: 48,
    fontSize: 10,
    fontWeight: '700',
    color: '#2E4255',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legResult: {
    flex: 1,
    fontSize: 13,
    color: '#5B7B96',
    textAlign: 'center',
  },
  legEditIcon: {
    width: 24,
    fontSize: 16,
    color: '#3FD0C9',
    textAlign: 'right',
  },
  aggregateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#152230',
  },
  aggregateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E4255',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aggregateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4E8F7',
  },
  // Single-leg
  singleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  singlePlayer: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#D4E8F7',
  },
  singlePlayerRight: {
    textAlign: 'right',
  },
  singlePlayerWinner: {
    color: '#3FD0C9',
  },
  singleScorePill: {
    backgroundColor: '#152230',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 10,
    minWidth: 64,
    alignItems: 'center',
  },
  singleScorePillPlayed: {
    backgroundColor: '#0B2535',
  },
  singleScoreText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3FD0C9',
  },
  singleVsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E4255',
  },
  tapHint: {
    fontSize: 11,
    color: '#1E3347',
    textAlign: 'center',
    marginTop: 10,
  },
  // Penalty
  penaltyBox: {
    marginTop: 12,
    backgroundColor: '#1A1206',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3D2A06',
  },
  penaltyBoxTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FCD34D',
    textAlign: 'center',
    marginBottom: 10,
  },
  penaltyBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  penaltyBtn: {
    flex: 1,
    backgroundColor: '#0F1923',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D2A06',
  },
  penaltyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FCD34D',
  },
  // Advance button
  advanceBtn: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#3FD0C9',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
  },
  advanceBtnText: {
    color: '#0B1F2E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Champion
  championContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  championTrophy: {
    fontSize: 88,
    marginBottom: 24,
  },
  championLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3FD0C9',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  championName: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#D4E8F7',
    textAlign: 'center',
    marginBottom: 12,
  },
  championSub: {
    fontSize: 14,
    color: '#2E4255',
    marginBottom: 48,
  },
  newTournamentBtn: {
    backgroundColor: '#3FD0C9',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  newTournamentBtnText: {
    color: '#0B1F2E',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
