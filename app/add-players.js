import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useTournament } from '../context/TournamentContext';
import { generateLeagueRounds } from '../utils/league';
import { generateFirstRound } from '../utils/bracket';

export default function AddPlayersScreen() {
  const { state, dispatch } = useTournament();
  const [inputName, setInputName] = useState('');
  const [players, setPlayers] = useState([]);
  const inputRef = useRef(null);

  function addPlayer() {
    const name = inputName.trim();
    if (!name) {
      Alert.alert('Nombre inválido', 'Escribí un nombre antes de agregar.');
      return;
    }
    if (players.map(p => p.toLowerCase()).includes(name.toLowerCase())) {
      Alert.alert('Repetido', `"${name}" ya está en la lista.`);
      return;
    }
    setPlayers(prev => [...prev, name]);
    setInputName('');
    inputRef.current?.focus();
  }

  function removePlayer(index) {
    setPlayers(prev => prev.filter((_, i) => i !== index));
  }

  function startTournament() {
    if (state.type === 'league') {
      const rounds = generateLeagueRounds(players);
      dispatch({ type: 'START_LEAGUE', players, rounds });
      router.replace('/league');
    } else {
      const firstRound = generateFirstRound(players, state.cupFormat);
      dispatch({ type: 'START_CUP', players, firstRound });
      router.replace('/cup');
    }
  }

  const canStart = players.length >= 2;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Volver</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Jugadores</Text>

        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Nombre del jugador"
            placeholderTextColor="#2E4255"
            value={inputName}
            onChangeText={setInputName}
            onSubmitEditing={addPlayer}
            returnKeyType="done"
            maxLength={30}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addPlayer} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Lista · {players.length}</Text>
          {players.length > 0 && <Text style={styles.removeHint}>Tocá para eliminar</Text>}
        </View>

        <FlatList
          data={players}
          keyExtractor={(item, idx) => `${item}-${idx}`}
          style={styles.list}
          contentContainerStyle={players.length === 0 ? styles.listCentered : null}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.playerRow}
              onPress={() => removePlayer(index)}
              activeOpacity={0.7}
            >
              <View style={styles.playerBadge}>
                <Text style={styles.playerBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.playerName}>{item}</Text>
              <Text style={styles.removeIcon}>✕</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>Sin jugadores todavía.</Text>
              <Text style={styles.emptySubtext}>Necesitás al menos 2 para empezar.</Text>
            </View>
          }
        />

        <TouchableOpacity
          style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
          onPress={startTournament}
          disabled={!canStart}
          activeOpacity={0.85}
        >
          <Text style={[styles.startBtnText, !canStart && styles.startBtnTextDisabled]}>
            {canStart
              ? 'Empezar torneo'
              : `Necesitás al menos 2 jugadores (${players.length}/2)`}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
    marginBottom: 12,
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
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#0F1923',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#D4E8F7',
    borderWidth: 1,
    borderColor: '#1E3347',
  },
  addBtn: {
    backgroundColor: '#3FD0C9',
    borderRadius: 12,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#0B1F2E',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 32,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B7B96',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  removeHint: {
    fontSize: 12,
    color: '#2E4255',
  },
  list: {
    flex: 1,
  },
  listCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1923',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E3347',
  },
  playerBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0B2535',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3FD0C9',
  },
  playerName: {
    flex: 1,
    fontSize: 15,
    color: '#D4E8F7',
    fontWeight: '500',
  },
  removeIcon: {
    fontSize: 12,
    color: '#1E3347',
    paddingLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#5B7B96',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#2E4255',
  },
  startBtn: {
    backgroundColor: '#3FD0C9',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  startBtnDisabled: {
    backgroundColor: '#0F1923',
    borderWidth: 1,
    borderColor: '#1E3347',
  },
  startBtnText: {
    color: '#0B1F2E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  startBtnTextDisabled: {
    color: '#2E4255',
  },
});
