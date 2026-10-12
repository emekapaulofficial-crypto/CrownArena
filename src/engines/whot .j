const SUITS = ["Circle", "Triangle", "Cross", "Square", "Star"];
const SPECIAL_CARD = 20;

function makeDeck() {
  const deck = [];

  for (const suit of SUITS) {
    for (let number = 1; number <= 14; number++) {
      deck.push({ suit, number });
    }
  }

  deck.push({ suit: "Whot", number: SPECIAL_CARD });
  return deck;
}

function shuffle(deck) {
  const cards = [...deck];

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
}

export function createGame(format = "1v1") {
  const playerCount = format === "4-player" ? 4 : 2;
  const names = ["You", "Bot 1", "Bot 2", "Bot 3"].slice(0, playerCount);
  const deck = shuffle(makeDeck());

  const players = names.map((name, index) => ({
    id: index,
    name,
    hand: deck.splice(0, 5),
  }));

  const firstCard = deck.shift();

  return {
    format,
    players,
    deck,
    discardPile: [firstCard],
    currentPlayer: 0,
    activeSuit: firstCard.suit === "Whot" ? "Circle" : firstCard.suit,
    direction: 1,
    winner: null,
    message: "Your turn. Play a matching card or draw.",
  };
}

export function canPlay(card, topCard, activeSuit) {
  return (
    card.suit === "Whot" ||
    card.suit === activeSuit ||
    card.number === topCard.number
  );
}

export function playCard(state, cardIndex) {
  if (state.winner) return { ...state, error: "The game is over." };

  const player = state.players[state.currentPlayer];
  const card = player?.hand[cardIndex];

  if (!card) return { ...state, error: "That card is not available." };

  const topCard = state.discardPile[state.discardPile.length - 1];

  if (!canPlay(card, topCard, state.activeSuit)) {
    return { ...state, error: "Choose a card matching the suit or number." };
  }

  const players = state.players.map((p, i) =>
    i === state.currentPlayer
      ? { ...p, hand: p.hand.filter((_, index) => index !== cardIndex) }
      : p
  );

  const next = {
    ...state,
    players,
    discardPile: [...state.discardPile, card],
    activeSuit: card.suit === "Whot" ? state.activeSuit : card.suit,
    message: `${player.name} played ${card.suit} ${card.number}.`,
    error: null,
  };

  if (players[state.currentPlayer].hand.length === 0) {
    next.winner = player.name;
    next.message = `${player.name} wins!`;
    return next;
  }

  next.currentPlayer = nextPlayer(next);
  return next;
}

export function chooseSuit(state, suit) {
  if (!SUITS.includes(suit)) return { ...state, error: "Invalid suit." };

  return {
    ...state,
    activeSuit: suit,
    message: `The active suit is now ${suit}.`,
    error: null,
  };
}

export function drawCard(state) {
  if (state.winner) return state;

  const playerIndex = state.currentPlayer;
  let deck = [...state.deck];
  let discardPile = [...state.discardPile];

  if (deck.length === 0 && discardPile.length > 1) {
    const topCard = discardPile.pop();
    deck = shuffle(discardPile);
    discardPile = [topCard];
  }

  if (deck.length === 0) {
    return {
      ...state,
      message: "No cards remain to draw. Try playing a card.",
    };
  }

  const card = deck.shift();
  const players = state.players.map((player, index) =>
    index === playerIndex
      ? { ...player, hand: [...player.hand, card] }
      : player
  );

  return {
    ...state,
    deck,
    discardPile,
    players,
    message: `${players[playerIndex].name} drew a card.`,
    currentPlayer: nextPlayer(state),
    error: null,
  };
}

function nextPlayer(state) {
  const count = state.players.length;
  return (state.currentPlayer + state.direction + count) % count;
}

export function playBotTurn(state) {
  if (state.winner || state.currentPlayer === 0) return state;

  const player = state.players[state.currentPlayer];
  const topCard = state.discardPile[state.discardPile.length - 1];

  const playableIndex = player.hand.findIndex((card) =>
    canPlay(card, topCard, state.activeSuit)
  );

  if (playableIndex >= 0) {
    return playCard(state, playableIndex);
  }

  return drawCard(state);
}

export { SUITS };
