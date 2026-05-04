import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { useTournament } from '../context/TournamentContext';

const CUP_FORMATS = [
  {
    key: 'single',
    icon: '➡️',
    title: 'Solo ida',
    description: 'Un partido por cruce.\nEl que gane avanza.',
    note: 'La final siempre es solo ida.',
  },
  {
    key: 'home-away',
    icon: '🔁',
    title: 'Ida y vuelta',
    description: 'Dos partidos por cruce.\nGana quien acumule más goles en el global.',
    note: 'La final es solo ida.',
  },
];

export default function CupOptionsScreen() {
  const { dispatch } = useTournament();

  function handleSelectFormat(format) {
    dispatch({ type: 'SET_CUP_FORMAT', payload: format });
    router.push('/add-players');
  }

  return (
    <ImageBackground source={require('../assets/images/background.png')} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Volver</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Formato de Copa</Text>
        <Text style={styles.sub}>¿Cómo se juegan los cruces?</Text>

        {CUP_FORMATS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={styles.card}
            onPress={() => handleSelectFormat(f.key)}
            activeOpacity={0.75}
          >
            <Text style={styles.cardIcon}>{f.icon}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{f.title}</Text>
              <Text style={styles.cardDesc}>{f.description}</Text>
              <Text style={styles.cardNote}>{f.note}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
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
    marginBottom: 4,
  },
  sub: {
    fontSize: 15,
    color: '#5B7B96',
    marginBottom: 28,
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
    fontSize: 30,
    marginRight: 16,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#D4E8F7',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#5B7B96',
    lineHeight: 19,
    marginBottom: 6,
  },
  cardNote: {
    fontSize: 11,
    color: '#2E4255',
    fontStyle: 'italic',
  },
  arrow: {
    fontSize: 26,
    color: '#1E3347',
    marginLeft: 8,
  },
});
