export function generateLeagueRounds(players) {
  const isOdd = players.length % 2 !== 0;
  const list = isOdd ? [...players, null] : [...players]; // null = bye slot
  const total = list.length;
  const numRounds = total - 1;
  const rotation = list.slice(1);
  const rotLen = numRounds;
  const rounds = [];

  for (let r = 0; r < numRounds; r++) {
    const matches = [];

    // Fixed player (list[0]) vs rotation[r]
    const p1 = list[0];
    const p2 = rotation[r];
    if (p1 !== null && p2 !== null) {
      matches.push({ id: `r${r}-m0`, home: p1, away: p2, homeScore: null, awayScore: null, played: false });
    }

    // Remaining pairs via symmetric rotation
    for (let i = 1; i < total / 2; i++) {
      const a = rotation[((r - i) % rotLen + rotLen) % rotLen];
      const b = rotation[(r + i) % rotLen];
      if (a !== null && b !== null) {
        matches.push({ id: `r${r}-m${i}`, home: a, away: b, homeScore: null, awayScore: null, played: false });
      }
    }

    rounds.push({ roundNumber: r, name: `Jornada ${r + 1}`, matches });
  }

  return rounds;
}

export function computeStandings(players, matches) {
  const table = {};
  players.forEach(p => {
    table[p] = { player: p, played: 0, wins: 0, draws: 0, losses: 0, points: 0, gf: 0, gc: 0 };
  });

  matches.filter(m => m.played).forEach(m => {
    const home = table[m.home];
    const away = table[m.away];
    if (!home || !away) return;

    home.played++;
    away.played++;
    home.gf += m.homeScore;
    home.gc += m.awayScore;
    away.gf += m.awayScore;
    away.gc += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.wins++;
      home.points += 3;
      away.losses++;
    } else if (m.awayScore > m.homeScore) {
      away.wins++;
      away.points += 3;
      home.losses++;
    } else {
      home.draws++;
      home.points++;
      away.draws++;
      away.points++;
    }
  });

  return Object.values(table).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    const gdDiff = (b.gf - b.gc) - (a.gf - a.gc);
    if (gdDiff !== 0) return gdDiff;
    return a.player.localeCompare(b.player);
  });
}
