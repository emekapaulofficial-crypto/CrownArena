const WINNING_SCORE = 50;

export function createGame(format = "1v1") {
  const playerCount = format === "4-player" ? 4 : 2;

  const names = ["You", "Bot 1", "Bot 2", "Bot 3"].slice(
    0,
    playerCount
  );

  return {
    format,
    players: names.map((name, id) => ({
      id,
      name,
      score: 0,
    })),
    currentPlayer: 0,
    round: 1,
    lastRoll: null,
    winner: null,
    message: "Your turn. Roll the dice!",
  };
}

export function roll(state) {
  if (state.winner) {
    return { ...state, message: "The game has ended." };
  }

  const diceValue = Math.floor(Math.random() * 6) + 1;
  const currentPlayer = state.currentPlayer;

  const players = state.players.map((player, index) => {
    if (index !== currentPlayer) return player;

    return {
      ...player,
      score: player.score + diceValue,
    };
  });

  const activePlayer = players[currentPlayer];
  const hasWon = activePlayer.score >= WINNING_SCORE;

  if (hasWon) {
    return {
      ...state,
      players,
      lastRoll: diceValue,
      winner: activePlayer.name,
      message: `${activePlayer.name} wins with ${activePlayer.score} points!`,
    };
  }

  const nextPlayer = (currentPlayer + 1) % players.length;

  return {
    ...state,
    players,
    lastRoll: diceValue,
    currentPlayer: nextPlayer,
    round: nextPlayer === 0 ? state.round + 1 : state.round,
    message: `${activePlayer.name} rolled ${diceValue}.`,
  };
}

export function resetGame(format = "1v1") {
  return createGame(format);
}
