const WINNING_SCORE = 50;

export function createGame() {
  return {
    players: [
      { id: 0, name: "You", score: 0 },
      { id: 1, name: "Opponent", score: 0 },
    ],
    currentPlayer: 0,
    winner: null,
    message: "Your turn. Select the points scored.",
  };
}

export function addPoints(state, playerIndex, points) {
  if (state.winner) {
    return { ...state, message: "The game has ended." };
  }

  if (
    !Number.isInteger(playerIndex) ||
    playerIndex < 0 ||
    playerIndex >= state.players.length
  ) {
    return { ...state, error: "Invalid player." };
  }

  if (![1, 2, 3, 4, 5, 6, 7].includes(points)) {
    return { ...state, error: "Invalid points value." };
  }

  const players = state.players.map((player, index) =>
    index === playerIndex
      ? { ...player, score: player.score + points }
      : player
  );

  const player = players[playerIndex];
  const winner = player.score >= WINNING_SCORE ? player.name : null;

  return {
    ...state,
    players,
    winner,
    currentPlayer: (playerIndex + 1) % players.length,
    message: winner
      ? `${winner} wins!`
      : `${player.name} scored ${points} points.`,
    error: null,
  };
}

export function scorePoints(state, points) {
  return addPoints(state, state.currentPlayer, points);
}

export function recordFoul(state) {
  if (state.winner) return state;

  const nextPlayer = (state.currentPlayer + 1) % state.players.length;

  return {
    ...state,
    currentPlayer: nextPlayer,
    message: `Foul recorded. ${state.players[nextPlayer].name}'s turn.`,
    error: null,
  };
}

export function getWinner(state) {
  return state.winner;
}

export function resetGame() {
  return createGame();
}
