import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

const STORAGE_KEY = '@picadito_v3';

const initialState = {
  active: false,
  type: null,           // 'league' | 'cup'
  players: [],
  playerLogos: {},      // { [name]: assetId | null }

  // League
  leagueRounds: [],        // [{ roundNumber, name, matches: [{ id, home, away, homeScore, awayScore, played }] }]
  leagueCurrentRound: 0,

  // Cup
  cupFormat: null,      // 'single' | 'home-away'
  cupRounds: [],        // [{ roundNumber, name, matchups }]
  cupCurrentRound: 0,
  cupWinner: null,
  cupFinished: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;

    case 'SET_TYPE':
      return { ...state, type: action.payload };

    case 'SET_CUP_FORMAT':
      return { ...state, cupFormat: action.payload };

    case 'START_LEAGUE':
      return {
        ...state,
        active: true,
        players: action.players,
        playerLogos: action.playerLogos ?? {},
        leagueRounds: action.rounds,
        leagueCurrentRound: 0,
        cupRounds: [],
        cupCurrentRound: 0,
        cupWinner: null,
        cupFinished: false,
      };

    case 'START_CUP':
      return {
        ...state,
        active: true,
        players: action.players,
        playerLogos: action.playerLogos ?? {},
        leagueRounds: [],
        leagueCurrentRound: 0,
        cupRounds: [action.firstRound],
        cupCurrentRound: 0,
        cupWinner: null,
        cupFinished: false,
      };

    case 'UPDATE_LEAGUE_MATCH': {
      const updatedRounds = state.leagueRounds.map((round, i) => {
        if (i !== state.leagueCurrentRound) return round;
        return {
          ...round,
          matches: round.matches.map(m =>
            m.id === action.id
              ? { ...m, homeScore: action.homeScore, awayScore: action.awayScore, played: true }
              : m
          ),
        };
      });
      return { ...state, leagueRounds: updatedRounds };
    }

    case 'ADVANCE_LEAGUE_ROUND':
      return { ...state, leagueCurrentRound: state.leagueCurrentRound + 1 };

    case 'UPDATE_CUP_MATCHUP': {
      const updatedRounds = state.cupRounds.map((round, i) => {
        if (i !== state.cupCurrentRound) return round;
        return {
          ...round,
          matchups: round.matchups.map(m =>
            m.id === action.id ? { ...m, ...action.updates } : m
          ),
        };
      });
      return { ...state, cupRounds: updatedRounds };
    }

    case 'ADVANCE_CUP_ROUND':
      return {
        ...state,
        cupRounds: [...state.cupRounds, action.nextRound],
        cupCurrentRound: state.cupCurrentRound + 1,
      };

    case 'FINISH_CUP':
      return { ...state, cupFinished: true, cupWinner: action.winner };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

const TournamentContext = createContext(null);

export function TournamentProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            dispatch({ type: 'HYDRATE', payload: JSON.parse(raw) });
          } catch (_) {}
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1F2E' }}>
        <ActivityIndicator size="large" color="#3FD0C9" />
      </View>
    );
  }

  return (
    <TournamentContext.Provider value={{ state, dispatch }}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  return useContext(TournamentContext);
}
