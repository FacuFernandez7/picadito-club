import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const DEFAULT_LOGO = require('../assets/images/default_logo.png');

export default function ScoreModal({
  visible,
  homePlayer,
  awayPlayer,
  homePlayerLogo,
  awayPlayerLogo,
  label,
  initialHome,
  initialAway,
  onConfirm,
  onClose,
}) {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setHomeScore(initialHome !== null && initialHome !== undefined ? String(initialHome) : '');
      setAwayScore(initialAway !== null && initialAway !== undefined ? String(initialAway) : '');
      setError('');
    }
  }, [visible, initialHome, initialAway]);

  function handleConfirm() {
    const home = parseInt(homeScore, 10);
    const away = parseInt(awayScore, 10);
    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      setError('Ingresá un resultado válido para ambos equipos.');
      return;
    }
    onConfirm(home, away);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.card}>
          {label ? <Text style={styles.label}>{label}</Text> : null}

          <View style={styles.matchRow}>
            <View style={styles.playerCol}>
              <Image
                source={homePlayerLogo ?? DEFAULT_LOGO}
                style={styles.playerLogo}
                resizeMode="contain"
              />
              <Text style={styles.playerName} numberOfLines={1}>{homePlayer}</Text>
            </View>

            <View style={styles.scoreInputs}>
              <TextInput
                style={styles.scoreInput}
                keyboardType="numeric"
                value={homeScore}
                onChangeText={t => { setHomeScore(t.replace(/[^0-9]/g, '')); setError(''); }}
                maxLength={2}
                placeholder="0"
                placeholderTextColor="#2E4255"
                autoFocus
                selectTextOnFocus
              />
              <Text style={styles.dash}>—</Text>
              <TextInput
                style={styles.scoreInput}
                keyboardType="numeric"
                value={awayScore}
                onChangeText={t => { setAwayScore(t.replace(/[^0-9]/g, '')); setError(''); }}
                maxLength={2}
                placeholder="0"
                placeholderTextColor="#2E4255"
                selectTextOnFocus
              />
            </View>

            <View style={styles.playerCol}>
              <Image
                source={awayPlayerLogo ?? DEFAULT_LOGO}
                style={styles.playerLogo}
                resizeMode="contain"
              />
              <Text style={styles.playerName} numberOfLines={1}>{awayPlayer}</Text>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#0F1923',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#1E3347',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3FD0C9',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 18,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  playerCol: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  playerLogo: {
    width: 48,
    height: 48,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D4E8F7',
    textAlign: 'center',
  },
  scoreInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 8,
  },
  scoreInput: {
    width: 54,
    height: 54,
    backgroundColor: '#152230',
    borderRadius: 12,
    fontSize: 26,
    fontWeight: 'bold',
    color: '#3FD0C9',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#1E3347',
  },
  dash: {
    fontSize: 18,
    color: '#1E3347',
  },
  error: {
    fontSize: 12,
    color: '#F87171',
    textAlign: 'center',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#152230',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3347',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5B7B96',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3FD0C9',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0B1F2E',
  },
});
