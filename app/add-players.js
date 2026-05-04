import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  Image,
  KeyboardAvoidingView,
  Pressable,
  Platform,
  SafeAreaView,
  ImageBackground,
  Dimensions,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
// overlay paddingH (20*2) + card padding (20*2) + item margin (4*2) * 5 cols
const LOGO_CELL = Math.floor((SCREEN_WIDTH - 40 - 40 - 40) / 5);
import { router } from 'expo-router';
import { useTournament } from '../context/TournamentContext';
import { generateLeagueRounds } from '../utils/league';
import { generateFirstRound } from '../utils/bracket';
import logos from '../assets/images/logos/index';

const DEFAULT_LOGO = require('../assets/images/default_logo.png');

export default function AddPlayersScreen() {
  const { state, dispatch } = useTournament();
  const [players, setPlayers] = useState([]);          // [{ name, logo }]
  const [modalVisible, setModalVisible] = useState(false);
  const [inputName, setInputName] = useState('');
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);

  const filteredLogos = logos.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  function openModal() {
    setInputName('');
    setSelectedLogo(null);
    setSearch('');
    setModalVisible(true);
  }

  function cancelModal() {
    setModalVisible(false);
  }

  function savePlayer() {
    const name = inputName.trim();
    if (!name) {
      Alert.alert('Nombre inválido', 'Escribí un nombre antes de agregar.');
      return;
    }
    if (players.map(p => p.name.toLowerCase()).includes(name.toLowerCase())) {
      Alert.alert('Repetido', `"${name}" ya está en la lista.`);
      return;
    }
    setPlayers(prev => [...prev, { name, logo: selectedLogo?.logo ?? null }]);
    setModalVisible(false);
  }

  function removePlayer(index) {
    setPlayers(prev => prev.filter((_, i) => i !== index));
  }

  function startTournament() {
    const names = players.map(p => p.name);
    const playerLogos = Object.fromEntries(players.map(p => [p.name, p.logo]));
    if (state.type === 'league') {
      const rounds = generateLeagueRounds(names);
      dispatch({ type: 'START_LEAGUE', players: names, rounds, playerLogos });
      router.replace('/league');
    } else {
      const firstRound = generateFirstRound(names, state.cupFormat);
      dispatch({ type: 'START_CUP', players: names, firstRound, playerLogos });
      router.replace('/cup');
    }
  }

  const canStart = players.length >= 2;

  return (
    <ImageBackground source={require('../assets/images/background.png')} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Volver</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>Jugadores</Text>

          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Lista · {players.length}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openModal} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={players}
            keyExtractor={(item, idx) => `${item.name}-${idx}`}
            style={styles.list}
            contentContainerStyle={players.length === 0 ? styles.listCentered : null}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.playerRow}
                onPress={() => removePlayer(index)}
                activeOpacity={0.7}
              >
                <Image source={item.logo ?? DEFAULT_LOGO} style={styles.playerLogo} resizeMode="contain" />
                <Text style={styles.playerName}>{item.name}</Text>
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
        </View>
      </SafeAreaView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.modalBackdrop} onPress={cancelModal} />

          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agregar jugador</Text>

            <TextInput
              ref={inputRef}
              style={styles.modalInput}
              placeholder="Nombre del jugador"
              placeholderTextColor="#2E4255"
              value={inputName}
              onChangeText={setInputName}
              onSubmitEditing={() => inputRef.current?.blur()}
              returnKeyType="done"
              maxLength={30}
              autoFocus
            />

            <Text style={styles.logoSectionTitle}>
              Escudo{selectedLogo ? ` · ${selectedLogo.name}` : ' (opcional)'}
            </Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Buscar equipo..."
              placeholderTextColor="#2E4255"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />

            <FlatList
              data={filteredLogos}
              keyExtractor={item => item.name}
              numColumns={5}
              style={styles.logoGrid}
              contentContainerStyle={styles.logoGridContent}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = selectedLogo?.name === item.name;
                return (
                  <TouchableOpacity
                    style={[styles.logoItem, isSelected && styles.logoItemSelected]}
                    onPress={() => setSelectedLogo(isSelected ? null : item)}
                    activeOpacity={0.7}
                  >
                    <Image source={item.logo} style={styles.logoImage} resizeMode="contain" />
                  </TouchableOpacity>
                );
              }}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelModal} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={savePlayer} activeOpacity={0.8}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },
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
  backBtnText: { fontSize: 15, color: '#FFFFFF', fontWeight: '600' },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#D4E8F7', marginBottom: 20 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B7B96',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  addBtn: {
    backgroundColor: '#3FD0C9',
    borderRadius: 10,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#0B1F2E', fontSize: 24, fontWeight: '400', lineHeight: 28 },
  list: { flex: 1 },
  listCentered: { flexGrow: 1, justifyContent: 'center' },
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
  playerLogo: {
    width: 32,
    height: 32,
    marginRight: 12,
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
  playerBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#3FD0C9' },
  playerName: { flex: 1, fontSize: 15, color: '#D4E8F7', fontWeight: '500' },
  removeIcon: { fontSize: 12, color: '#1E3347', paddingLeft: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 48, marginTop: 48 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#5B7B96', marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: '#2E4255' },
  startBtn: {
    backgroundColor: '#3FD0C9',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  startBtnDisabled: {
    backgroundColor: '#0F1923',
    borderWidth: 1,
    borderColor: '#1E3347',
  },
  startBtnText: { color: '#0B1F2E', fontSize: 16, fontWeight: 'bold' },
  startBtnTextDisabled: { color: '#2E4255' },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalCard: {
    backgroundColor: '#0F1923',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E3347',
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#D4E8F7', marginBottom: 14 },
  modalInput: {
    backgroundColor: '#0B1F2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#D4E8F7',
    borderWidth: 1,
    borderColor: '#1E3347',
    marginBottom: 16,
  },
  logoSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B7B96',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#0B1F2E',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#D4E8F7',
    borderWidth: 1,
    borderColor: '#1E3347',
    marginBottom: 10,
  },
  logoGrid: { flexGrow: 0 },
  logoGridContent: { paddingBottom: 4 },
  logoItem: {
    width: LOGO_CELL,
    height: LOGO_CELL,
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#0B2535',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    overflow: 'hidden',
  },
  logoItemSelected: {
    backgroundColor: '#1A3D4A',
    borderWidth: 2,
    borderColor: '#3FD0C9',
  },
  logoImage: { width: '100%', height: '100%' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3347',
  },
  cancelBtnText: { color: '#5B7B96', fontSize: 15, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    backgroundColor: '#3FD0C9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#0B1F2E', fontSize: 15, fontWeight: 'bold' },
});
