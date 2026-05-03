import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useTournament } from '../context/TournamentContext';

const TOURNAMENT_TYPES = [
  {
    key: 'league',
    icon: '🏆',
    title: 'Liga',
    description: 'Todos contra todos.\nEl que más puntos acumule, gana.',
    badge: 'G=3pts · E=1pt · P=0pts',
  },
  {
    key: 'cup',
    icon: '⚡',
    title: 'Copa',
    description: 'Eliminación directa.\nUna derrota y quedás afuera.',
    badge: 'Bracket aleatorio',
  },
];

export default function SelectTypeScreen() {
  const { dispatch } = useTournament();

  function handleSelectType(type) {
    dispatch({ type: 'SET_TYPE', payload: type });
    router.push(type === 'cup' ? '/cup-options' : '/add-players');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Volver</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>¿Qué tipo de torneo?</Text>

        {TOURNAMENT_TYPES.map(t => (
          <TouchableOpacity
            key={t.key}
            style={styles.card}
            onPress={() => handleSelectType(t.key)}
            activeOpacity={0.75}
          >
            <Text style={styles.cardIcon}>{t.icon}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{t.title}</Text>
              <Text style={styles.cardDesc}>{t.description}</Text>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>{t.badge}</Text>
              </View>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  backBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4E8F7',
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1923',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E3347',
  },
  cardIcon: {
    fontSize: 34,
    marginRight: 16,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4E8F7',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#5B7B96',
    lineHeight: 19,
    marginBottom: 10,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0B2535',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardBadgeText: {
    fontSize: 11,
    color: '#3FD0C9',
    fontWeight: '700',
  },
  arrow: {
    fontSize: 26,
    color: '#1E3347',
    marginLeft: 8,
  },
});
