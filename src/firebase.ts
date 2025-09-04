// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  getDatabase,
  ref,
  set,
  push,
  onValue,
  off,
  remove,
  serverTimestamp,
} from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgDaT6k3UnDrMIwd4y99d8aTUMC-kmG8g",
  authDomain: "saksicipatron.firebaseapp.com",
  databaseURL: "https://saksicipatron-default-rtdb.firebaseio.com/",
  projectId: "saksicipatron",
  storageBucket: "saksicipatron.firebasestorage.app",
  messagingSenderId: "1019470935274",
  appId: "1:1019470935274:web:a9d2d8ae890547a6fad393",
  measurementId: "G-6EYT5MFW72",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// Test Firebase connection
console.log("Firebase initialized:", app);
console.log("Firestore database:", db);
console.log("Realtime database:", rtdb);

// Types
export interface PlayerScore {
  id?: string;
  playerName: string;
  score: number;
  time: number; // in seconds
  difficulty: string;
  timestamp: number;
  combo: number;
  achievements: string[];
  playerCount: number; // number of employees/players
}

// Multiplayer interfaces
export interface GameLobby {
  id: string;
  name: string; // Lobby display name
  hostId: string;
  hostName: string;
  players: { [playerId: string]: LobbyPlayer };
  settings: {
    employeeCount: number;
    timeLimit: number; // in seconds
    difficulty: "kolay" | "orta" | "zor";
  };
  status: "waiting" | "starting" | "playing" | "finished";
  createdAt: number;
}

export interface LobbyPlayer {
  id: string;
  name: string;
  ready: boolean;
  score: number;
  employeesHit: number;
  finished: boolean;
  finishTime?: number;
}

export interface GameState {
  lobbyId: string;
  players: { [playerId: string]: PlayerGameState };
  startTime: number;
  timeLimit: number;
  status: "countdown" | "playing" | "finished";
  winner?: string;
}

export interface PlayerGameState {
  id: string;
  name: string;
  score: number;
  employeesHit: number;
  totalEmployees: number;
  finished: boolean;
  finishTime?: number;
}

// Test Firebase connection
export const testFirebaseConnection = async () => {
  try {
    console.log("Testing Firebase connection...");
    console.log("Firebase app:", app);
    console.log("Firebase config:", firebaseConfig);
    console.log("Firestore database:", db);

    const testCollection = collection(db, "test");
    console.log("Test collection created successfully:", testCollection);

    // Try to add a test document
    const testDoc = await addDoc(testCollection, {
      test: true,
      timestamp: Date.now(),
      message: "Firebase connection test",
    });
    console.log("Test document added with ID:", testDoc.id);

    return true;
  } catch (error) {
    console.error("Firebase connection test failed:", error);
    console.error("Error details:", {
      name: (error as any).name,
      message: (error as any).message,
      code: (error as any).code,
      stack: (error as any).stack,
    });
    return false;
  }
};

// Test Realtime Database connection
export const testRealtimeDatabase = async () => {
  try {
    console.log("Testing Realtime Database connection...");
    console.log("RTDB instance:", rtdb);

    const testRef = ref(rtdb, "test");
    await set(testRef, {
      message: "RTDB connection test",
      timestamp: Date.now(),
    });

    console.log("RTDB test data written successfully");
    return true;
  } catch (error) {
    console.error("RTDB connection test failed:", error);
    console.error("Error details:", {
      name: (error as any).name,
      message: (error as any).message,
      code: (error as any).code,
      stack: (error as any).stack,
    });
    return false;
  }
};

// Firebase functions
export const savePlayerScore = async (playerData: PlayerScore) => {
  try {
    console.log("Firebase: Saving player score:", playerData);
    console.log("Firebase: Database instance:", db);

    const scoresCollection = collection(db, "scores");
    console.log("Firebase: Collection reference:", scoresCollection);

    const docData = {
      ...playerData,
      timestamp: Date.now(),
    };
    console.log("Firebase: Document data to save:", docData);

    const docRef = await addDoc(scoresCollection, docData);
    console.log("Firebase: Score saved with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Firebase: Error saving score: ", error);
    console.error("Firebase: Error details:", {
      name: (error as any).name,
      message: (error as any).message,
      code: (error as any).code,
      stack: (error as any).stack,
    });
    throw error;
  }
};

export const getTopScores = async (limitCount: number = 10) => {
  try {
    console.log("Firebase: Getting top scores...");
    console.log("Firebase: Database instance:", db);

    const scoresRef = collection(db, "scores");
    console.log("Firebase: Collection reference created:", scoresRef);

    const q = query(scoresRef, orderBy("score", "desc"), limit(limitCount));
    console.log("Firebase: Query created:", q);

    const querySnapshot = await getDocs(q);
    console.log("Firebase: Query executed, snapshot size:", querySnapshot.size);

    const scores: PlayerScore[] = [];
    querySnapshot.forEach((doc) => {
      console.log("Firebase: Document ID:", doc.id, "Data:", doc.data());
      scores.push({ id: doc.id, ...doc.data() } as PlayerScore);
    });

    console.log("Firebase: Final scores array:", scores);
    return scores;
  } catch (error) {
    console.error("Firebase: Error getting scores: ", error);
    console.error("Firebase: Error details:", {
      name: (error as any).name,
      message: (error as any).message,
      code: (error as any).code,
      stack: (error as any).stack,
    });
    throw error;
  }
};

export const getTopScoresByTime = async (limitCount: number = 10) => {
  try {
    const scoresRef = collection(db, "scores");
    const q = query(scoresRef, orderBy("time", "asc"), limit(limitCount));
    const querySnapshot = await getDocs(q);

    const scores: PlayerScore[] = [];
    querySnapshot.forEach((doc) => {
      scores.push({ id: doc.id, ...doc.data() } as PlayerScore);
    });

    return scores;
  } catch (error) {
    console.error("Error getting scores by time: ", error);
    throw error;
  }
};

// Multiplayer functions
export const createLobby = async (
  hostId: string,
  hostName: string,
  lobbyName?: string
): Promise<string> => {
  try {
    console.log("Creating lobby with RTDB instance:", rtdb);
    console.log("Host ID:", hostId, "Host Name:", hostName);

    const lobbyRef = push(ref(rtdb, "lobbies"));
    const lobbyId = lobbyRef.key!;
    console.log("Generated lobby ID:", lobbyId);
    console.log("Lobby reference:", lobbyRef);

    const lobby: GameLobby = {
      id: lobbyId,
      name: lobbyName || `${hostName}'in Lobisi`,
      hostId,
      hostName,
      players: {
        [hostId]: {
          id: hostId,
          name: hostName,
          ready: false,
          score: 0,
          employeesHit: 0,
          finished: false,
        },
      },
      settings: {
        employeeCount: 5,
        timeLimit: 60,
        difficulty: "orta",
      },
      status: "waiting",
      createdAt: Date.now(),
    };

    console.log("Lobby data to save:", lobby);
    await set(lobbyRef, lobby);
    console.log("Lobby created successfully:", lobbyId);
    return lobbyId;
  } catch (error) {
    console.error("Error creating lobby:", error);
    console.error("Error details:", {
      name: (error as any).name,
      message: (error as any).message,
      code: (error as any).code,
      stack: (error as any).stack,
    });
    throw error;
  }
};

export const joinLobby = async (
  lobbyId: string,
  playerId: string,
  playerName: string
): Promise<boolean> => {
  try {
    const lobbyRef = ref(rtdb, `lobbies/${lobbyId}`);
    const playerRef = ref(rtdb, `lobbies/${lobbyId}/players/${playerId}`);

    const player: LobbyPlayer = {
      id: playerId,
      name: playerName,
      ready: false,
      score: 0,
      employeesHit: 0,
      finished: false,
    };

    await set(playerRef, player);
    console.log("Joined lobby:", lobbyId);
    return true;
  } catch (error) {
    console.error("Error joining lobby:", error);
    return false;
  }
};

export const updateLobbySettings = async (
  lobbyId: string,
  settings: GameLobby["settings"]
): Promise<void> => {
  try {
    const settingsRef = ref(rtdb, `lobbies/${lobbyId}/settings`);
    await set(settingsRef, settings);
  } catch (error) {
    console.error("Error updating lobby settings:", error);
    throw error;
  }
};

export const setPlayerReady = async (
  lobbyId: string,
  playerId: string,
  ready: boolean
): Promise<void> => {
  try {
    const readyRef = ref(rtdb, `lobbies/${lobbyId}/players/${playerId}/ready`);
    await set(readyRef, ready);
  } catch (error) {
    console.error("Error setting player ready:", error);
    throw error;
  }
};

export const startMultiplayerGame = async (lobbyId: string): Promise<void> => {
  try {
    const statusRef = ref(rtdb, `lobbies/${lobbyId}/status`);
    await set(statusRef, "starting");

    // Create game state
    const gameStateRef = ref(rtdb, `games/${lobbyId}`);
    const gameState: Partial<GameState> = {
      lobbyId,
      startTime: Date.now() + 5000, // 5 second countdown
      status: "countdown",
    };

    await set(gameStateRef, gameState);
  } catch (error) {
    console.error("Error starting game:", error);
    throw error;
  }
};

export const updatePlayerGameState = async (
  lobbyId: string,
  playerId: string,
  gameState: Partial<PlayerGameState>
): Promise<void> => {
  try {
    const playerStateRef = ref(rtdb, `games/${lobbyId}/players/${playerId}`);
    await set(playerStateRef, gameState);
  } catch (error) {
    console.error("Error updating player game state:", error);
    throw error;
  }
};

export const subscribeLobby = (
  lobbyId: string,
  callback: (lobby: GameLobby | null) => void
) => {
  const lobbyRef = ref(rtdb, `lobbies/${lobbyId}`);
  onValue(lobbyRef, (snapshot) => {
    const lobby = snapshot.val();
    callback(lobby);
  });

  return () => off(lobbyRef);
};

export const subscribeGameState = (
  lobbyId: string,
  callback: (gameState: GameState | null) => void
) => {
  const gameRef = ref(rtdb, `games/${lobbyId}`);
  onValue(gameRef, (snapshot) => {
    const gameState = snapshot.val();
    callback(gameState);
  });

  return () => off(gameRef);
};

export const leaveLobby = async (
  lobbyId: string,
  playerId: string
): Promise<void> => {
  try {
    const playerRef = ref(rtdb, `lobbies/${lobbyId}/players/${playerId}`);
    await remove(playerRef);
  } catch (error) {
    console.error("Error leaving lobby:", error);
    throw error;
  }
};

export const getAvailableLobbies = async (): Promise<GameLobby[]> => {
  try {
    const lobbiesRef = ref(rtdb, "lobbies");
    const snapshot = await new Promise((resolve) => {
      onValue(lobbiesRef, resolve, { onlyOnce: true });
    });

    const lobbiesData = (snapshot as any).val();
    if (!lobbiesData) return [];

    const lobbies: GameLobby[] = [];
    Object.keys(lobbiesData).forEach((lobbyId) => {
      const lobby = lobbiesData[lobbyId];
      if (lobby.status === "waiting" && Object.keys(lobby.players).length < 2) {
        lobbies.push(lobby);
      }
    });

    // Sort by creation time (newest first)
    lobbies.sort((a, b) => b.createdAt - a.createdAt);

    console.log("Available lobbies:", lobbies);
    return lobbies;
  } catch (error) {
    console.error("Error getting available lobbies:", error);
    return [];
  }
};

export { db, analytics, rtdb };
