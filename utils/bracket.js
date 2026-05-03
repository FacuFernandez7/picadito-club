function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getRoundName(numPlayers, isPreliminary) {
  if (isPreliminary) return 'Ronda preliminar';
  switch (numPlayers) {
    case 2: return 'Final';
    case 4: return 'Semifinal';
    case 8: return 'Cuartos de final';
    case 16: return 'Octavos de final';
    default: return `Ronda de ${numPlayers}`;
  }
}

function createMatchup(id, home, away, format, isFinal) {
  if (!away) {
    return { id, home, away: null, bye: true, winner: home };
  }
  const base = { id, home, away, bye: false, winner: null, penaltyWinner: null };
  if (format === 'home-away' && !isFinal) {
    return {
      ...base,
      leg1HomeGoals: null,
      leg1AwayGoals: null,
      leg1Played: false,
      leg2HomeGoals: null,
      leg2AwayGoals: null,
      leg2Played: false,
    };
  }
  return { ...base, homeScore: null, awayScore: null };
}

export function generateFirstRound(players, format) {
  const shuffled = shuffle(players);
  const n = shuffled.length;
  const bracketBase = Math.pow(2, Math.floor(Math.log2(n)));
  const prelimCount = n - bracketBase;
  const isPreliminary = prelimCount > 0;
  const isFinal = n === 2;
  const matchups = [];

  if (isPreliminary) {
    for (let i = 0; i < prelimCount; i++) {
      matchups.push(createMatchup(
        `r0-m${i}`,
        shuffled[i * 2],
        shuffled[i * 2 + 1],
        format,
        false
      ));
    }
    for (let i = prelimCount * 2; i < n; i++) {
      matchups.push(createMatchup(`r0-bye${i}`, shuffled[i], null, format, false));
    }
  } else {
    for (let i = 0; i < n; i += 2) {
      matchups.push(createMatchup(`r0-m${i / 2}`, shuffled[i], shuffled[i + 1], format, isFinal));
    }
  }

  return {
    roundNumber: 0,
    name: isPreliminary ? 'Ronda preliminar' : getRoundName(n, false),
    matchups,
  };
}

export function computeMatchupWinner(matchup, format, isFinal) {
  if (matchup.bye) return matchup.home;

  if (format === 'home-away' && !isFinal) {
    if (!matchup.leg1Played || !matchup.leg2Played) return null;
    // home total = goals scored by matchup.home across both legs
    const homeTotal = (matchup.leg1HomeGoals ?? 0) + (matchup.leg2AwayGoals ?? 0);
    const awayTotal = (matchup.leg1AwayGoals ?? 0) + (matchup.leg2HomeGoals ?? 0);
    if (homeTotal > awayTotal) return matchup.home;
    if (awayTotal > homeTotal) return matchup.away;
    return matchup.penaltyWinner ?? null;
  }

  if (matchup.homeScore === null || matchup.awayScore === null) return null;
  if (matchup.homeScore > matchup.awayScore) return matchup.home;
  if (matchup.awayScore > matchup.homeScore) return matchup.away;
  return matchup.penaltyWinner ?? null;
}

export function isRoundComplete(round) {
  return round.matchups.every(m => m.winner !== null);
}

export function generateNextRound(currentRound, format, nextRoundIndex) {
  const winners = currentRound.matchups.map(m => m.winner).filter(Boolean);
  const n = winners.length;
  const isFinal = n === 2;
  const matchups = [];

  for (let i = 0; i + 1 < n; i += 2) {
    matchups.push(createMatchup(
      `r${nextRoundIndex}-m${Math.floor(i / 2)}`,
      winners[i],
      winners[i + 1],
      format,
      isFinal
    ));
  }

  return { roundNumber: nextRoundIndex, name: getRoundName(n, false), matchups };
}
