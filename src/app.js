```javascript
import * as Whot from "./engines/whot.js";
import * as Dice from "./engines/dice.js";
import * as Snooker from "./engines/snooker.js";
import { createRoom } from "./engines/rooms.js";

const $ = (selector) => document.querySelector(selector);

const gameSelect = $("#gameSelect");
const formatSelect = $("#formatSelect");
const visibilitySelect = $("#visibilitySelect");
const matchForm = $("#matchForm");
const playArea = $("#playArea");
const gameBoard = $("#gameBoard");
const matchTitle = $("#matchTitle");
const matchStatus = $("#matchStatus");
const resultDialog = $("#resultDialog");

let currentGame = null;
let currentRoom = null;
let currentState = null;
let selectedSuit = null;

const gameNames = {
  whot: "Nigerian Classic Whot",
  dice: "Dice Clash",
  snooker: "Snooker Scoreboard"
};

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function setStatus(message) {
  matchStatus.textContent = message;
}

function showMatch() {
  playArea.classList.remove("hidden");
  playArea.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showResult(title, message) {
  $("#resultTitle").textContent = title;
  $("#resultText").textContent = message;

  if (typeof resultDialog.showModal === "function") {
    resultDialog.showModal();
  } else {
    window.alert(`${title}\n\n${message}`);
  }
}

function finishMatch(message) {
  setStatus(message);
  showResult("Match complete", message);
  renderBoard();
}

function renderBoard() {
  if (!currentGame || !currentState) return;

  if (currentGame === "whot") {
    renderWhot();
  } else if (currentGame === "dice") {
    renderDice();
  } else if (currentGame === "snooker") {
    renderSnooker();
  }
}

/* =========================================
   START MATCH
   ========================================= */

function startMatch(game, format, visibility) {
  if (!gameNames[game]) {
    showResult("Invalid game", "Please choose a supported game.");
    return;
  }

  if (game === "snooker" && format !== "1v1") {
    showResult(
      "Format unavailable",
      "Snooker Scoreboard currently supports 1v1 only."
    );
    return;
  }

  currentGame = game;
  selectedSuit = null;

  try {
    currentRoom = createRoom({
      game,
      format,
      visibility,
      players: ["You", "Arena Bot"]
    });
  } catch (error) {
    showResult(
      "Could not create match",
      error instanceof Error ? error.message : "Please try again."
    );
    return;
  }

  matchTitle.textContent = gameNames[game];
  setStatus(
    `${format === "1v1" ? "1v1" : "Four-player"} practice · ` +
    `${visibility === "public" ? "Public demo" : "Private demo"} · Free play`
  );

  if (game === "whot") {
    currentState = Whot.createGame(format);
  } else if (game === "dice") {
    currentState = Dice.createGame(format);
  } else {
    currentState = Snooker.createGame();
  }

  showMatch();
  renderBoard();
}

/* =========================================
   WHOT
   ========================================= */

function renderWhot() {
  const state = currentState;
  const hand = state.players[state.currentPlayer].hand;
  const topCard = state.discardPile[state.discardPile.length - 1];

  const colours = {
    circle: "red",
    triangle: "blue",
    cross: "green",
    square: "gold",
    star: "gold"
  };

  gameBoard.innerHTML = `
    <h3>♧ Whot Table</h3>
    <p>Current player: <strong>${escapeHTML(
      state.players[state.currentPlayer].name
    )}</strong></p>
    <p>Cards remaining in deck: ${state.deck.length}</p>
    <div class="score">
      Top card:
      <strong>${escapeHTML(topCard.shape)} ${topCard.number}</strong>
    </div>
    <div class="score">
      Your cards: ${hand.length}
    </div>
    <div class="player-hand" id="whotHand"></div>
    <div id="whotActions"></div>
  `;

  const handContainer = $("#whotHand");

  hand.forEach((card, index) => {
    const button = document.createElement("button");
    button.className =
      `playing-card ${colours[card.shape] || "gold"}`;
    button.innerHTML =
      `<span>${escapeHTML(card.number)}</span>` +
      `<span>${escapeHTML(card.shape)}</span>`;
    button.setAttribute(
      "aria-label",
      `${card.number} ${card.shape}`
    );

    const isMyTurn = state.currentPlayer === 0;
    button.disabled = !isMyTurn;

    button.addEventListener("click", () => {
      playWhotCard(index);
    });

    handContainer.appendChild(button);
  });

  const actions = $("#whotActions");

  if (state.currentPlayer === 0) {
    const drawButton = document.createElement("button");
    drawButton.className = "btn secondary";
    drawButton.textContent = "Draw card";
    drawButton.addEventListener("click", drawWhotCard);
    actions.appendChild(drawButton);
  } else {
    const botButton = document.createElement("button");
    botButton.className = "btn primary";
    botButton.textContent = "Bot's turn";
    botButton.addEventListener("click", advanceWhotBot);
    actions.appendChild(botButton);
  }

  if (state.winner !== undefined && state.winner !== null) {
    finishMatch(
      `${state.players[state.winner].name} wins the Whot match!`
    );
  }
}

function playWhotCard(index) {
  try {
    const result = Whot.playCard(currentState, index);

    if (result && result.error) {
      setStatus(result.error);
      return;
    }

    if (result && result.requiresSuit) {
      renderSuitChoices();
      return;
    }

    renderBoard();
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "That move failed."
    );
  }
}

function renderSuitChoices() {
  const actions = $("#whotActions");
  actions.innerHTML = "<p>Choose a suit:</p>";

  ["circle", "triangle", "cross", "square"].forEach((suit) => {
    const button = document.createElement("button");
    button.className = "btn secondary";
    button.textContent = suit;
    button.addEventListener("click", () => {
      selectedSuit = suit;

      if (typeof Whot.chooseSuit === "function") {
        Whot.chooseSuit(currentState, suit);
      }

      renderBoard();
    });

    actions.appendChild(button);
  });
}

function drawWhotCard() {
  try {
    Whot.drawCard(currentState);
    renderBoard();
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "Could not draw a card."
    );
  }
}

function advanceWhotBot() {
  try {
    if (typeof Whot.playBotTurn === "function") {
      Whot.playBotTurn(currentState);
    } else if (typeof Whot.botTurn === "function") {
      Whot.botTurn(currentState);
    } else {
      setStatus(
        "Bot automation is not available in this engine version."
      );
      return;
    }

    renderBoard();
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "Bot turn failed."
    );
  }
}

/* =========================================
   DICE CLASH
   ========================================= */

function renderDice() {
  const state = currentState;

  gameBoard.innerHTML = `
    <h3>⚄ Dice Clash</h3>
    <p>Round: ${Number(state.round || 1)} of 4</p>
    <p>Current player: <strong>${escapeHTML(
      state.players[state.currentPlayer]?.name || "Player"
    )}</strong></p>
    <div id="diceScores"></div>
    <div id="diceActions"></div>
  `;

  const scores = $("#diceScores");

  state.players.forEach((player) => {
    const item = document.createElement("div");
    item.className = "score";
    item.textContent =
      `${player.name}: ${Number(player.score || 0)} points`;
    scores.appendChild(item);
  });

  const actions = $("#diceActions");

  if (state.winner !== undefined && state.winner !== null) {
    finishMatch(
      `${state.players[state.winner].name} wins Dice Clash!`
    );
    return;
  }

  const rollButton = document.createElement("button");
  rollButton.className = "btn primary";
  rollButton.textContent = "⚄ Roll dice";
  rollButton.addEventListener("click", rollDice);
  actions.appendChild(rollButton);
}

function rollDice() {
  try {
    const result = Dice.roll(currentState);

    if (result && result.error) {
      setStatus(result.error);
      return;
    }

    if (result && result.message) {
      setStatus(result.message);
    } else if (result && result.value !== undefined) {
      setStatus(`You rolled ${result.value}.`);
    }

    renderBoard();
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "Dice roll failed."
    );
  }
}

/* =========================================
   SNOOKER SCOREBOARD
   ========================================= */

function renderSnooker() {
  const state = currentState;

  gameBoard.innerHTML = `
    <h3>◉ Snooker Scoreboard</h3>
    <p>Track practice scores for two players.</p>
    <div id="snookerScores"></div>
    <div id="snookerActions"></div>
  `;

  const scores = $("#snookerScores");

  state.players.forEach((player, index) => {
    const item = document.createElement("div");
    item.className = "score";
    item.textContent =
      `${player.name}: ${Number(player.score || 0)} points`;
    scores.appendChild(item);

    const actions = $("#snookerActions");

    [1, 2, 3, 4, 5, 6, 7].forEach((points) => {
      const button = document.createElement("button");
      button.className = "btn secondary";
      button.textContent = `Player ${index + 1}: +${points}`;

      button.addEventListener("click", () => {
        addSnookerPoints(index, points);
      });

      actions.appendChild(button);
    });
  });

  const foulButton = document.createElement("button");
  foulButton.className = "btn secondary";
  foulButton.textContent = "Record foul";
  foulButton.addEventListener("click", recordSnookerFoul);
  $("#snookerActions").appendChild(foulButton);

  const finishButton = document.createElement("button");
  finishButton.className = "btn primary";
  finishButton.textContent = "Finish frame";
  finishButton.addEventListener("click", finishSnooker);
  $("#snookerActions").appendChild(finishButton);
}

function addSnookerPoints(playerIndex, points) {
  try {
    if (typeof Snooker.addPoints === "function") {
      Snooker.addPoints(currentState, playerIndex, points);
    } else if (typeof Snooker.scorePoints === "function") {
      Snooker.scorePoints(currentState, playerIndex, points);
    } else {
      setStatus("Scoring is not available in this engine version.");
      return;
    }

    renderBoard();
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "Could not add points."
    );
  }
}

function recordSnookerFoul() {
  try {
    if (typeof Snooker.recordFoul === "function") {
      Snooker.recordFoul(currentState);
      renderBoard();
    } else {
      setStatus("Foul recording is not available in this engine version.");
    }
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "Could not record foul."
    );
  }
}

function finishSnooker() {
  try {
    let winner;

    if (typeof Snooker.getWinner === "function") {
      winner = Snooker.getWinner(currentState);
    } else {
      const first = currentState.players[0].score || 0;
      const second = currentState.players[1].score || 0;

      winner = first === second ? null : first > second ? 0 : 1;
    }

    if (winner === null || winner === undefined) {
      finishMatch("The snooker frame ended in a tie.");
    } else {
      finishMatch(
        `${currentState.players[winner].name} wins the frame!`
      );
    }
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : "Could not finish frame."
    );
  }
}

/* =========================================
   PAGE EVENTS
   ========================================= */

matchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  startMatch(
    gameSelect.value,
    formatSelect.value,
    visibilitySelect.value
  );
});

document.querySelectorAll("[data-game]").forEach((button) => {
  button.addEventListener("click", () => {
    const game = button.dataset.game;

    gameSelect.value = game;

    if (game === "snooker") {
      formatSelect.value = "1v1";
    }

    startMatch(
      game,
      formatSelect.value,
      visibilitySelect.value
    );
  });
});

$("#quickMatch").addEventListener("click", () => {
  gameSelect.value = "whot";
  formatSelect.value = "1v1";
  visibilitySelect.value = "public";

  startMatch("whot", "1v1", "public");
});

$("#closeMatch").addEventListener("click", () => {
  playArea.classList.add("hidden");
  window.location.hash = "games";
});

$("#resultClose").addEventListener("click", () => {
  resultDialog.close();
});

$("#profileButton").addEventListener("click", () => {
  showResult(
    "Player profile",
    "Profiles and online accounts will be added in a future version."
  );
});

/* Prevent an unsupported four-player Snooker selection. */

formatSelect.addEventListener("change", () => {
  if (
    formatSelect.value === "4-player" &&
    gameSelect.value === "snooker"
  ) {
    gameSelect.value = "whot";
  }
});

gameSelect.addEventListener("change", () => {
  if (
    gameSelect.value === "snooker" &&
    formatSelect.value === "4-player"
  ) {
    formatSelect.value = "1v1";
  }
});

console.info("CrownArena app loaded.");
```
