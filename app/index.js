import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useTournament } from '../context/TournamentContext';

const TYPE_LABEL = { league: 'Liga', cup: 'Copa' };

export default function HomeScreen() {
  const { state, dispatch } = useTournament();

  function handleNewTournament() {
    dispatch({ type: 'RESET' });
    router.push('/select-type');
  }

  function handleContinue() {
    router.push(state.type === 'league' ? '/league' : '/cup');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>⚽</Text>
          <Text style={styles.title}>Picadito Club</Text>
          <Text style={styles.tagline}>Organizá tu torneo entre amigos</Text>
        </View>

        <View style={styles.actions}>
          {state.active && (
            <TouchableOpacity style={styles.continueCard} onPress={handleContinue} activeOpacity={0.8}>
              <View style={styles.continueCardLeft}>
                <Text style={styles.continueCardPill}>TORNEO ACTIVO</Text>
                <Text style={styles.continueCardTitle}>
                  Continuar {TYPE_LABEL[state.type]}
                </Text>
                <Text style={styles.continueCardSub}>
                  {state.players.length} jugadores
                </Text>
              </View>
              <Text style={styles.continueArrow}>›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.newBtn, state.active && styles.newBtnSecondary]}
            onPress={handleNewTournament}
            activeOpacity={0.8}
          >
            <Text style={[styles.newBtnText, state.active && styles.newBtnTextSecondary]}>
              {state.active ? 'Nuevo torneo' : 'Crear torneo'}
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 60,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#D4E8F7',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: '#2E4255',
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  continueCard: {
    backgroundColor: '#0F1923',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E3347',
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueCardLeft: {
    flex: 1,
  },
  continueCardPill: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3FD0C9',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  continueCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4E8F7',
    marginBottom: 4,
  },
  continueCardSub: {
    fontSize: 13,
    color: '#2E4255',
  },
  continueArrow: {
    fontSize: 28,
    color: '#1E3347',
    marginLeft: 12,
  },
  newBtn: {
    backgroundColor: '#3FD0C9',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  newBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1E3347',
  },
  newBtnText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0B1F2E',
  },
  newBtnTextSecondary: {
    color: '#2E4255',
  },
});
