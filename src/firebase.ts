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

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgDaT6k3UnDrMIwd4y99d8aTUMC-kmG8g",
  authDomain: "saksicipatron.firebaseapp.com",
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

// Test Firebase connection
console.log("Firebase initialized:", app);
console.log("Firestore database:", db);

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
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
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
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
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
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
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

export { db, analytics };
