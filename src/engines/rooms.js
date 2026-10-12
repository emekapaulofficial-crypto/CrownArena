const rooms = new Map();

function generateRoomCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < 6; i++) {
    code += characters[Math.floor(Math.random() * characters.length)];
  }

  return code;
}

export function createRoom({
  game = "whot",
  format = "1v1",
  visibility = "public",
  players = ["You"],
} = {}) {
  if (!["whot", "dice", "snooker"].includes(game)) {
    throw new Error("Unsupported game.");
  }

  if (!["1v1", "4-player"].includes(format)) {
    throw new Error("Unsupported match format.");
  }

  if (!["public", "private"].includes(visibility)) {
    throw new Error("Visibility must be public or private.");
  }

  let code;

  do {
    code = generateRoomCode();
  } while (rooms.has(code));

  const room = {
    code,
    game,
    format,
    visibility,
    status: "waiting",
    maxPlayers: format === "4-player" ? 4 : 2,
    players: players.slice(0, format === "4-player" ? 4 : 2).map(
      (name, index) => ({
        id: index + 1,
        name,
        joinedAt: new Date().toISOString(),
      })
    ),
    createdAt: new Date().toISOString(),
  };

  rooms.set(code, room);

  return { ...room, players: room.players.map((player) => ({ ...player })) };
}

export function joinRoom(code, playerName) {
  const room = rooms.get(String(code).toUpperCase());

  if (!room) {
    throw new Error("Room not found.");
  }

  if (room.status !== "waiting") {
    throw new Error("This room is no longer accepting players.");
  }

  if (room.players.length >= room.maxPlayers) {
    throw new Error("This room is full.");
  }

  if (!String(playerName || "").trim()) {
    throw new Error("Enter a player name.");
  }

  room.players.push({
    id: room.players.length + 1,
    name: String(playerName).trim().slice(0, 30),
    joinedAt: new Date().toISOString(),
  });

  if (room.players.length === room.maxPlayers) {
    room.status = "ready";
  }

  return getRoom(room.code);
}

export function getRoom(code) {
  const room = rooms.get(String(code).toUpperCase());

  if (!room) return null;

  return {
    ...room,
    players: room.players.map((player) => ({ ...player })),
  };
}

export function listRooms() {
  return Array.from(rooms.values())
    .filter((room) => room.visibility === "public" && room.status === "waiting")
    .map((room) => ({
      ...room,
      players: room.players.map((player) => ({ ...player })),
    }));
}

export function removeRoom(code) {
  return rooms.delete(String(code).toUpperCase());
}
