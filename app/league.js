import { useState, useMemo } from 'react';
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
import { computeStandings } from '../utils/league';
import ScoreModal from '../components/ScoreModal';

export default function LeagueScreen() {
  const { state, dispatch } = useTournament();
  const [activeTab, setActiveTab] = useState('fixture');
  const [activeModal, setActiveModal] = useState(null);

  const currentRound = state.leagueRounds[state.leagueCurrentRound];
  const totalRounds = state.leagueRounds.length;
  const isLastRound = state.leagueCurrentRound === totalRounds - 1;
  const roundComplete = currentRound?.matches.length > 0 && currentRound.matches.every(m => m.played);

  const allMatches = useMemo(
    () => state.leagueRounds.flatMap(r => r.matches),
    [state.leagueRounds]
  );

  const standings = useMemo(
    () => computeStandings(state.players, allMatches),
    [allMatches, state.players]
  );

  const playedCount = allMatches.filter(m => m.played).length;
  const totalCount = allMatches.length;
  const progressPct = totalCount > 0 ? Math.round((playedCount / totalCount) * 100) : 0;

  function openScoreModal(match) {
    setActiveModal({
      matchId: match.id,
      home: match.home,
      away: match.away,
      homeScore: match.played ? match.homeScore : null,
      awayScore: match.played ? match.awayScore : null,
    });
  }

  function handleScoreConfirm(homeScore, awayScore) {
    if (!activeModal) return;
    const matchId = activeModal.matchId;
    setActiveModal(null);
    dispatch({ type: 'UPDATE_LEAGUE_MATCH', id: matchId, homeScore, awayScore });
  }

  function handleAdvanceRound() {
    dispatch({ type: 'ADVANCE_LEAGUE_ROUND' });
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

  function renderFixtureItem({ item, index }) {
    const homeWon = item.played && item.homeScore > item.awayScore;
    const awayWon = item.played && item.awayScore > item.homeScore;

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => openScoreModal(item)}
        activeOpacity={0.75}
      >
        <Text style={styles.matchLabel}>Partido {index + 1}</Text>
        <View style={styles.matchRow}>
          <Text
            style={[styles.matchPlayer, homeWon && styles.matchPlayerWinner]}
            numberOfLines={1}
          >
            {item.home}
          </Text>
          <View style={[styles.scorePill, item.played && styles.scorePillPlayed]}>
            {item.played ? (
              <Text style={styles.scorePillText}>
                {item.homeScore} — {item.awayScore}
              </Text>
            ) : (
              <Text style={styles.scorePillVs}>vs</Text>
            )}
          </View>
          <Text
            style={[styles.matchPlayer, styles.matchPlayerRight, awayWon && styles.matchPlayerWinner]}
            numberOfLines={1}
          >
            {item.away}
          </Text>
        </View>
        {!item.played && (
          <Text style={styles.matchTapHint}>Tocá para ingresar resultado</Text>
        )}
      </TouchableOpacity>
    );
  }

  function renderStandingsItem({ item, index }) {
    const isLeader = index === 0 && item.played > 0;

    return (
      <View style={[styles.standingRow, isLeader && styles.standingRowLeader]}>
        <Text style={[styles.standingPos, isLeader && styles.standingPosLeader]}>
          {index + 1}
        </Text>
        <Text
          style={[styles.standingName, isLeader && styles.standingNameLeader]}
          numberOfLines={1}
        >
          {item.player}
        </Text>
        <Text style={styles.standingStat}>{item.played}</Text>
        <Text style={styles.standingStat}>{item.wins}</Text>
        <Text style={styles.standingStat}>{item.draws}</Text>
        <Text style={styles.standingStat}>{item.losses}</Text>
        <Text style={[styles.standingStat, styles.standingPts]}>{item.points}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Liga</Text>
            <Text style={styles.headerSub}>
              {state.players.length} jugadores  ·  Jornada {(state.leagueCurrentRound ?? 0) + 1} de {totalRounds}
            </Text>
          </View>
          <TouchableOpacity onPress={handleNewTournament} style={styles.exitBtn}>
            <Text style={styles.exitBtnText}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>
              {playedCount} de {totalCount} partidos jugados
            </Text>
            <Text style={styles.progressPct}>{progressPct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'fixture' && styles.tabActive]}
            onPress={() => setActiveTab('fixture')}
          >
            <Text style={[styles.tabText, activeTab === 'fixture' && styles.tabTextActive]}>
              Fixture
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'standings' && styles.tabActive]}
            onPress={() => setActiveTab('standings')}
          >
            <Text style={[styles.tabText, activeTab === 'standings' && styles.tabTextActive]}>
              Tabla
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'fixture' ? (
          <View style={styles.fixtureContainer}>
            <FlatList
              data={currentRound?.matches ?? []}
              keyExtractor={item => item.id}
              renderItem={renderFixtureItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
            {roundComplete && !isLastRound && (
              <TouchableOpacity
                style={styles.advanceBtn}
                onPress={handleAdvanceRound}
                activeOpacity={0.85}
              >
                <Text style={styles.advanceBtnText}>Siguiente jornada  →</Text>
              </TouchableOpacity>
            )}
            {roundComplete && isLastRound && (
              <TouchableOpacity
                style={[styles.advanceBtn, styles.advanceBtnFinal]}
                onPress={() => setActiveTab('standings')}
                activeOpacity={0.85}
              >
                <Text style={[styles.advanceBtnText, styles.advanceBtnTextFinal]}>🏆  Ver tabla final</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.standingsContainer}>
            <View style={styles.standingsHeader}>
              <Text style={styles.standingsHeaderPos}>#</Text>
              <Text style={styles.standingsHeaderName}>Jugador</Text>
              <Text style={styles.standingsHeaderStat}>PJ</Text>
              <Text style={styles.standingsHeaderStat}>G</Text>
              <Text style={styles.standingsHeaderStat}>E</Text>
              <Text style={styles.standingsHeaderStat}>P</Text>
              <Text style={[styles.standingsHeaderStat, styles.standingPts]}>PTS</Text>
            </View>
            <FlatList
              data={standings}
              keyExtractor={item => item.player}
              renderItem={renderStandingsItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        <ScoreModal
          visible={activeModal !== null}
          homePlayer={activeModal?.home ?? ''}
          awayPlayer={activeModal?.away ?? ''}
          label={currentRound?.name ?? 'Resultado'}
          initialHome={activeModal?.homeScore}
          initialAway={activeModal?.awayScore}
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
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#D4E8F7',
  },
  headerSub: {
    fontSize: 13,
    color: '#2E4255',
    marginTop: 2,
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
  // Progress
  progressSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#2E4255',
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3FD0C9',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#0F1923',
    borderRadius: 2,
  },
  progressFill: {
    height: 3,
    backgroundColor: '#3FD0C9',
    borderRadius: 2,
  },
  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1E3347',
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3FD0C9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E4255',
  },
  tabTextActive: {
    color: '#3FD0C9',
  },
  // Fixture
  fixtureContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  matchCard: {
    backgroundColor: '#0F1923',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E3347',
  },
  matchLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E4255',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchPlayer: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#D4E8F7',
  },
  matchPlayerRight: {
    textAlign: 'right',
  },
  matchPlayerWinner: {
    color: '#3FD0C9',
  },
  scorePill: {
    backgroundColor: '#152230',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginHorizontal: 10,
    minWidth: 64,
    alignItems: 'center',
  },
  scorePillPlayed: {
    backgroundColor: '#0B2535',
  },
  scorePillText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3FD0C9',
  },
  scorePillVs: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E4255',
  },
  matchTapHint: {
    fontSize: 11,
    color: '#1E3347',
    textAlign: 'center',
    marginTop: 8,
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
  advanceBtnFinal: {
    backgroundColor: '#0F2D1E',
    borderWidth: 1,
    borderColor: '#2DD4BF',
  },
  advanceBtnText: {
    color: '#0B1F2E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  advanceBtnTextFinal: {
    color: '#2DD4BF',
  },
  // Standings
  standingsContainer: {
    flex: 1,
  },
  standingsHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3347',
  },
  standingsHeaderPos: {
    width: 28,
    fontSize: 11,
    fontWeight: '700',
    color: '#2E4255',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  standingsHeaderName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#2E4255',
    paddingLeft: 8,
    textTransform: 'uppercase',
  },
  standingsHeaderStat: {
    width: 32,
    fontSize: 11,
    fontWeight: '700',
    color: '#2E4255',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#0F1923',
  },
  standingRowLeader: {
    backgroundColor: '#0B2535',
  },
  standingPos: {
    width: 28,
    fontSize: 14,
    fontWeight: '600',
    color: '#2E4255',
    textAlign: 'center',
  },
  standingPosLeader: {
    color: '#3FD0C9',
    fontWeight: 'bold',
  },
  standingName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#D4E8F7',
    paddingLeft: 8,
  },
  standingNameLeader: {
    fontWeight: 'bold',
    color: '#3FD0C9',
  },
  standingStat: {
    width: 32,
    fontSize: 14,
    color: '#5B7B96',
    textAlign: 'center',
  },
  standingPts: {
    fontWeight: 'bold',
    color: '#D4E8F7',
  },
});
