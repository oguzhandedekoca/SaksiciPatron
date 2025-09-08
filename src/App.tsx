import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { ref, set } from "firebase/database";
import "./App.css";
import {
  savePlayerScore,
  getTopScores,
  type PlayerScore,
  type GameLobby,
  type GameState,
  createLobby,
  joinLobby,
  subscribeLobby,
  subscribeGameState,
  setPlayerReady,
  updateLobbySettings,
  startMultiplayerGame,
  updatePlayerGameState,
  leaveLobby,
  getAvailableLobbies,
  finishMultiplayerGame,
  rtdb,
} from "./firebase";

interface Employee {
  id: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  hit: boolean;
  name: string;
  hitCount: number;
  avatar: string;
}

interface GameSettings {
  bossName: string;
  employeeNames: string[];
  difficulty: "kolay" | "orta" | "zor";
  bossGender: "male" | "female";
}

interface Pot {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  trail: { x: number; y: number }[];
}

const EMPLOYEE_AVATARS = [
  "👨‍💻",
  "👩‍💻",
  "👨‍🔧",
  "👩‍🔧",
  "👨‍🏫",
  "👩‍🏫",
  "👨‍⚕️",
  "👩‍⚕️",
  "👨‍🍳",
  "👩‍🍳",
  "👨‍🎨",
  "👩‍🎨",
  "👨‍💼",
  "👩‍💼",
  "👨‍🔬",
  "👩‍🔬",
  "👨‍🚀",
  "👩‍🚀",
  "👨‍🏭",
  "👩‍🏭",
  "👨‍🌾",
  "👩‍🌾",
  "👨‍⚖️",
  "👩‍⚖️",
];

const EMPLOYEES_DATA = [
  // Sol üst bölge
  { name: "Hamza", x: 120, y: 120 },
  { name: "Adil", x: 200, y: 180 },
  { name: "Emin", x: 150, y: 250 },
  { name: "Sadık", x: 100, y: 320 },
  { name: "Oğuzhan", x: 180, y: 380 },

  // Orta sol bölge
  { name: "Alihan", x: 300, y: 150 },
  { name: "Pınar", x: 350, y: 220 },
  { name: "Sezer", x: 280, y: 300 },
  { name: "Engin", x: 320, y: 380 },
  { name: "Enes Ali", x: 250, y: 450 },

  // Orta bölge
  { name: "Mehmet", x: 500, y: 100 },
  { name: "Ayşe", x: 600, y: 180 },
  { name: "Ali", x: 550, y: 280 },
  { name: "Burak", x: 650, y: 350 },
  { name: "Murat", x: 580, y: 420 },

  // Orta sağ bölge
  { name: "Cemre", x: 800, y: 120 },
  { name: "Gizem", x: 900, y: 200 },
  { name: "Kaan", x: 850, y: 300 },
  { name: "Nazlı", x: 750, y: 380 },
  { name: "Furkan", x: 820, y: 460 },

  // Sağ bölge
  { name: "Emre", x: 1100, y: 150 },
  { name: "Selin", x: 1200, y: 220 },
  { name: "Samet", x: 1150, y: 320 },
  { name: "Furkan", x: 1050, y: 400 },
  { name: "Tolga", x: 1180, y: 480 },
];

// Lobby Screen Component
const LobbyScreen: React.FC<{
  lobby: GameLobby;
  playerId: string;
  onStartGame: () => void;
  onLeaveLobby: () => void;
  onUpdateSettings: (settings: GameLobby["settings"]) => void;
  onToggleReady: (ready: boolean) => void;
}> = ({
  lobby,
  playerId,
  onStartGame,
  onLeaveLobby,
  onUpdateSettings,
  onToggleReady,
}) => {
  const isHost = lobby.hostId === playerId;
  const currentPlayer = lobby.players[playerId];
  const playerList = Object.values(lobby.players);
  const allReady = playerList.every((p) => p.ready);
  const canStart = playerList.length >= 2 && allReady;

  return (
    <motion.div
      className="lobby-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="lobby-content"
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <h2>🏠 {lobby.name}</h2>
        <p className="lobby-code">
          Lobi Kodu: <strong>{lobby.id}</strong>
        </p>

        {/* Players List */}
        <div className="players-section">
          <h3>👥 Oyuncular ({playerList.length}/2)</h3>
          <div className="players-list">
            {playerList.map((player) => (
              <div
                key={player.id}
                className={`player-card ${
                  player.ready ? "ready" : "not-ready"
                } ${player.id === lobby.hostId ? "host" : ""}`}
              >
                <div className="player-info">
                  <span className="player-name">
                    {player.name}
                    {player.id === lobby.hostId && " 👑"}
                  </span>
                  <span
                    className={`ready-status ${
                      player.ready ? "ready" : "not-ready"
                    }`}
                  >
                    {player.ready ? "✅ Hazır" : "🎯 Hazır Ol"}
                  </span>
                </div>
              </div>
            ))}

            {playerList.length < 2 && (
              <div className="waiting-player">
                <span>⏳ Oyuncu bekleniyor...</span>
              </div>
            )}
          </div>
        </div>

        {/* Game Settings */}
        {isHost && (
          <div className="game-settings">
            <h3>⚙️ Oyun Ayarları</h3>
            <div className="settings-row">
              <label>Çalışan Sayısı:</label>
              <select
                value={lobby.settings.employeeCount}
                onChange={(e) =>
                  onUpdateSettings({
                    ...lobby.settings,
                    employeeCount: parseInt(e.target.value),
                  })
                }
              >
                {[3, 5, 8, 10, 15].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </div>

            <div className="settings-row">
              <label>Süre Limiti:</label>
              <select
                value={lobby.settings.timeLimit}
                onChange={(e) =>
                  onUpdateSettings({
                    ...lobby.settings,
                    timeLimit: parseInt(e.target.value),
                  })
                }
              >
                <option value={30}>30 saniye</option>
                <option value={60}>1 dakika</option>
                <option value={120}>2 dakika</option>
                <option value={180}>3 dakika</option>
              </select>
            </div>

            <div className="settings-row">
              <label>Zorluk:</label>
              <select
                value={lobby.settings.difficulty}
                onChange={(e) =>
                  onUpdateSettings({
                    ...lobby.settings,
                    difficulty: e.target.value as "kolay" | "orta" | "zor",
                  })
                }
              >
                <option value="kolay">😊 Kolay</option>
                <option value="orta">🤔 Orta</option>
                <option value="zor">😤 Zor</option>
              </select>
            </div>
          </div>
        )}

        {/* Ready Button */}
        <div className="lobby-actions">
          <motion.button
            className={`ready-btn ${
              currentPlayer?.ready ? "ready" : "not-ready"
            }`}
            onClick={() => onToggleReady(!currentPlayer?.ready)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {currentPlayer?.ready ? "✅ Hazırım!" : "🎯 Hazır Ol"}
          </motion.button>

          {isHost && (
            <motion.button
              className="start-game-btn"
              onClick={onStartGame}
              disabled={!canStart}
              whileHover={canStart ? { scale: 1.05 } : {}}
              whileTap={canStart ? { scale: 0.95 } : {}}
            >
              {canStart ? "🚀 Oyunu Başlat!" : "⏳ Oyuncular Hazırlanıyor..."}
            </motion.button>
          )}

          <motion.button
            className="leave-lobby-btn"
            onClick={onLeaveLobby}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🚪 Lobiden Ayrıl
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Settings Screen Component
const SettingsScreen: React.FC<{
  gameSettings: GameSettings;
  setGameSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  onStartGame: () => void;
  onBack: () => void;
}> = ({ gameSettings, setGameSettings, onStartGame, onBack }) => {
  const [tempEmployeeName, setTempEmployeeName] = useState("");

  const addEmployee = () => {
    if (tempEmployeeName.trim() && gameSettings.employeeNames.length < 20) {
      setGameSettings((prev) => ({
        ...prev,
        employeeNames: [...prev.employeeNames, tempEmployeeName.trim()],
      }));
      setTempEmployeeName("");
    }
  };

  const removeEmployee = (index: number) => {
    setGameSettings((prev) => ({
      ...prev,
      employeeNames: prev.employeeNames.filter((_, i) => i !== index),
    }));
  };

  const canStart =
    gameSettings.bossName.trim() && gameSettings.employeeNames.length > 0;

  return (
    <motion.div
      className="settings-screen"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2
        animate={{
          color: ["#ffd700", "#ff6b6b", "#4CAF50", "#ffd700"],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        🎮 OYUN AYARLARI 🎮
      </motion.h2>

      <div className="settings-content">
        {/* Boss Name */}
        <div className="setting-group">
          <label>👔 Patron İsmi:</label>
          <input
            type="text"
            value={gameSettings.bossName}
            onChange={(e) =>
              setGameSettings((prev) => ({ ...prev, bossName: e.target.value }))
            }
            placeholder="Patron ismini girin..."
            maxLength={20}
          />
        </div>

        <div className="setting-group">
          <label>👤 Patron Cinsiyeti:</label>
          <div className="gender-buttons">
            {(["male", "female"] as const).map((gender) => (
              <button
                key={gender}
                type="button"
                className={`gender-btn ${
                  gameSettings.bossGender === gender ? "active" : ""
                }`}
                onClick={() =>
                  setGameSettings((prev) => ({ ...prev, bossGender: gender }))
                }
              >
                {gender === "male" ? "🧔‍♂️ Erkek" : "👩‍💼 Kadın"}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="setting-group">
          <label>⚡ Zorluk Seviyesi:</label>
          <div className="difficulty-buttons">
            {(["kolay", "orta", "zor"] as const).map((level) => (
              <button
                key={level}
                className={`difficulty-btn ${
                  gameSettings.difficulty === level ? "active" : ""
                }`}
                onClick={() =>
                  setGameSettings((prev) => ({ ...prev, difficulty: level }))
                }
              >
                {level === "kolay"
                  ? "😊 Kolay"
                  : level === "orta"
                  ? "🤔 Orta"
                  : "😤 Zor"}
              </button>
            ))}
          </div>
          <div className="difficulty-info">
            {gameSettings.difficulty === "kolay" &&
              "🐌 Çalışanlar yavaş hareket eder"}
            {gameSettings.difficulty === "orta" &&
              "🚶 Çalışanlar normal hareket eder"}
            {gameSettings.difficulty === "zor" &&
              "🏃💨 Çalışanlar çok hızlı ve geniş hareket eder"}
          </div>
        </div>

        {/* Employee Names */}
        <div className="setting-group">
          <label>👥 Çalışanlar ({gameSettings.employeeNames.length}/20):</label>
          <div className="employee-input">
            <input
              type="text"
              value={tempEmployeeName}
              onChange={(e) => setTempEmployeeName(e.target.value)}
              placeholder="Çalışan ismini girin..."
              maxLength={15}
              onKeyPress={(e) => e.key === "Enter" && addEmployee()}
            />
            <button
              onClick={addEmployee}
              disabled={
                !tempEmployeeName.trim() ||
                gameSettings.employeeNames.length >= 20
              }
            >
              ➕
            </button>
          </div>
          <div className="employee-list">
            {gameSettings.employeeNames.map((name, index) => (
              <div key={index} className="employee-item">
                <span>{name}</span>
                <button onClick={() => removeEmployee(index)}>❌</button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="settings-actions">
          <motion.button
            className="back-btn"
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ⬅️ Geri
          </motion.button>
          <motion.button
            className={`start-game-btn ${canStart ? "enabled" : "disabled"}`}
            onClick={onStartGame}
            disabled={!canStart}
            whileHover={canStart ? { scale: 1.05 } : {}}
            whileTap={canStart ? { scale: 0.95 } : {}}
          >
            🎯 Oyunu Başlat!
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

function App() {
  const [score, setScore] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pots, setPots] = useState<Pot[]>([]);
  const [gameStarted, setGameStarted] = useState(false);

  // Debug gameStarted state changes
  useEffect(() => {
    console.log("gameStarted state changed:", gameStarted);
  }, [gameStarted]);
  const [combo, setCombo] = useState(0);
  const [comboTimer, setComboTimer] = useState<number | null>(null);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [showAchievement, setShowAchievement] = useState<string | null>(null);
  const [powerUps, setPowerUps] = useState<any[]>([]);
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);
  const [powerUpTimer, setPowerUpTimer] = useState<number | null>(null);
  const [, setLeaderboard] = useState<
    { name: string; score: number; time: number }[]
  >([]);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [gameTimer, setGameTimer] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  const [globalLeaderboard, setGlobalLeaderboard] = useState<PlayerScore[]>([]);
  const [showGlobalLeaderboard, setShowGlobalLeaderboard] = useState(false);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [victoryLeaderboard, setVictoryLeaderboard] = useState<PlayerScore[]>(
    []
  );
  const [isLoadingVictoryLeaderboard, setIsLoadingVictoryLeaderboard] =
    useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    bossName: "",
    employeeNames: [],
    difficulty: "orta",
    bossGender: "male",
  });
  const [showSettings, setShowSettings] = useState(false);

  // Multiplayer states
  const [, setGameMode] = useState<"single" | "multiplayer">("single");
  const [currentLobby, setCurrentLobby] = useState<GameLobby | null>(null);
  const [currentGameState, setCurrentGameState] = useState<GameState | null>(
    null
  );
  const [playerId] = useState<string>(
    () => `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
  const [showLobby, setShowLobby] = useState(false);
  const [showJoinLobby, setShowJoinLobby] = useState(false);
  const [lobbyName, setLobbyName] = useState("");
  const [availableLobbies, setAvailableLobbies] = useState<GameLobby[]>([]);
  const [isLoadingLobbies, setIsLoadingLobbies] = useState(false);
  const [isMultiplayerGame, setIsMultiplayerGame] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [powerLevel, setPowerLevel] = useState(0);
  const [showPowerBar, setShowPowerBar] = useState(false);
  const chargingStartTime = useRef<number>(0);
  const chargingAnimationId = useRef<number | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const bossControls = useAnimation();

  // Audio generation functions
  const createAudioContext = () => {
    return new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: AudioContext })
        .webkitAudioContext)();
  };

  const playAimSound = () => {
    try {
      const audioContext = createAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        1200,
        audioContext.currentTime + 0.1
      );

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch {
      console.log("Audio not supported");
    }
  };

  const playThrowSound = () => {
    try {
      const audioContext = createAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        50,
        audioContext.currentTime + 0.3
      );

      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch {
      console.log("Audio not supported");
    }
  };

  const playHitSound = () => {
    try {
      const audioContext = createAudioContext();

      // Create a more complex hit sound with multiple oscillators
      for (let i = 0; i < 3; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const frequencies = [400, 600, 800];
        oscillator.frequency.setValueAtTime(
          frequencies[i],
          audioContext.currentTime
        );
        oscillator.frequency.exponentialRampToValueAtTime(
          frequencies[i] * 0.3,
          audioContext.currentTime + 0.2
        );

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.2
        );

        oscillator.start(audioContext.currentTime + i * 0.05);
        oscillator.stop(audioContext.currentTime + 0.2 + i * 0.05);
      }
    } catch {
      console.log("Audio not supported");
    }
  };

  const playVictorySound = () => {
    try {
      const audioContext = createAudioContext();

      // Create a triumphant victory fanfare with multiple notes
      const notes = [
        { freq: 523, time: 0 }, // C5
        { freq: 659, time: 0.2 }, // E5
        { freq: 784, time: 0.4 }, // G5
        { freq: 1047, time: 0.6 }, // C6
        { freq: 784, time: 0.8 }, // G5
        { freq: 1047, time: 1.0 }, // C6
        { freq: 1319, time: 1.2 }, // E6
        { freq: 1047, time: 1.4 }, // C6
      ];

      notes.forEach((note) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(
          note.freq,
          audioContext.currentTime + note.time
        );

        gainNode.gain.setValueAtTime(0, audioContext.currentTime + note.time);
        gainNode.gain.linearRampToValueAtTime(
          0.3,
          audioContext.currentTime + note.time + 0.1
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + note.time + 0.3
        );

        oscillator.start(audioContext.currentTime + note.time);
        oscillator.stop(audioContext.currentTime + note.time + 0.3);
      });
    } catch {
      console.log("Audio not supported");
    }
  };

  const playComboSound = (comboLevel: number) => {
    try {
      const audioContext = createAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const baseFreq = 800 + comboLevel * 200;
      oscillator.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        baseFreq * 1.5,
        audioContext.currentTime + 0.2
      );

      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch {
      console.log("Audio not supported");
    }
  };

  // Combo system
  const handleCombo = () => {
    const newCombo = combo + 1;
    setCombo(newCombo);

    if (comboTimer) clearTimeout(comboTimer);

    const timer = setTimeout(() => {
      setCombo(0);
    }, 3000); // 3 seconds to maintain combo

    setComboTimer(timer as unknown as number);

    if (newCombo >= 2) {
      playComboSound(newCombo);
    }

    return Math.min(newCombo, 5); // Max 5x multiplier
  };

  // Achievement system
  const unlockAchievement = (achievement: string) => {
    if (!achievements.includes(achievement)) {
      setAchievements((prev) => [...prev, achievement]);
      setShowAchievement(achievement);
      setTimeout(() => setShowAchievement(null), 1500); // 3000ms -> 1500ms
    }
  };

  // Power-up system
  const spawnPowerUp = () => {
    if (powerUps.length < 2 && Math.random() < 0.3) {
      const powerUpTypes = ["rapid", "bigPot", "multiShot"];
      const type =
        powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      const newPowerUp = {
        id: Date.now(),
        type,
        x: Math.random() * (window.innerWidth - 100) + 50,
        y: Math.random() * (window.innerHeight - 200) + 100,
      };
      setPowerUps((prev) => [...prev, newPowerUp]);
    }
  };

  const activatePowerUp = (type: string) => {
    setActivePowerUp(type);
    if (powerUpTimer) clearTimeout(powerUpTimer);

    const timer = setTimeout(() => {
      setActivePowerUp(null);
    }, 5000); // 5 seconds duration

    setPowerUpTimer(timer as unknown as number);
  };

  // Global leaderboard functions

  const loadGlobalLeaderboard = async () => {
    setIsLoadingScores(true);
    try {
      console.log("Loading global leaderboard...");
      const topScores = await getTopScores(10);
      console.log("Top scores loaded:", topScores);
      setGlobalLeaderboard(topScores);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      // Show error message to user
      alert("Liderlik tablosu yüklenirken hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoadingScores(false);
    }
  };

  const loadVictoryLeaderboard = async () => {
    setIsLoadingVictoryLeaderboard(true);
    try {
      console.log("Loading victory leaderboard...");
      const topScores = await getTopScores(10);
      console.log("Victory top scores loaded:", topScores);
      setVictoryLeaderboard(topScores);
    } catch (error) {
      console.error("Error loading victory leaderboard:", error);
      // Fallback to local leaderboard if Firebase fails
      setVictoryLeaderboard([]);
    } finally {
      setIsLoadingVictoryLeaderboard(false);
    }
  };

  const saveScoreToFirebase = async () => {
    if (!gameSettings.bossName.trim()) {
      console.log("No boss name, skipping Firebase save");
      return;
    }

    try {
      const gameTime = (Date.now() - gameStartTime) / 1000;
      const playerData: PlayerScore = {
        playerName: gameSettings.bossName.trim(),
        score,
        time: gameTime,
        difficulty: gameSettings.difficulty,
        timestamp: Date.now(),
        combo: combo,
        achievements: achievements,
        playerCount: gameSettings.employeeNames.length,
      };

      console.log("App: Attempting to save score to Firebase:", playerData);
      await savePlayerScore(playerData);
      console.log("App: Score saved to Firebase successfully!");
    } catch (error) {
      console.error("App: Error saving score to Firebase:", error);
    }
  };

  // Difficulty settings for employee movement
  const getDifficultySettings = (difficulty: string) => {
    switch (difficulty) {
      case "kolay":
        return { movementRange: 8, movementSpeed: 0.0005 };
      case "orta":
        return { movementRange: 12, movementSpeed: 0.0008 };
      case "zor":
        return { movementRange: 30, movementSpeed: 0.0025 }; // Çok daha hızlı ve geniş hareket
      default:
        return { movementRange: 12, movementSpeed: 0.0008 };
    }
  };

  // Listen to lobby status changes for multiplayer
  useEffect(() => {
    if (currentLobby && currentLobby.status === "starting" && !gameStarted) {
      console.log(
        "Lobby status changed to starting, initializing multiplayer game..."
      );

      setIsMultiplayerGame(true);
      setShowLobby(false);

      // Add multiplayer mode class to body to prevent scrolling
      document.body.classList.add("multiplayer-mode");

      // Start countdown
      setCountdown(3);
      let countdownValue = 3;
      const countdownInterval = setInterval(() => {
        countdownValue--;
        console.log("Countdown tick:", countdownValue);

        if (countdownValue > 0) {
          setCountdown(countdownValue);
        } else {
          console.log("Countdown finished, starting game...");
          clearInterval(countdownInterval);
          setCountdown(null);

          // Start actual game
          console.log("Starting multiplayer game...");
          setGameStarted(true);
          setGameStartTime(Date.now());
          setGameTimer(0);

          // Start game timer
          const gameInterval = setInterval(() => {
            setGameTimer((prev) => prev + 1);
          }, 1000);
          setTimerInterval(gameInterval);

          console.log("Multiplayer game started successfully");
        }
      }, 1000);

      // Create employees based on lobby settings
      setGameSettings((prev) => ({
        ...prev,
        employeeNames: Array.from(
          { length: currentLobby.settings.employeeCount },
          (_, i) => `Çalışan ${i + 1}`
        ),
        difficulty: currentLobby.settings.difficulty,
      }));

      // Subscribe to game state
      const unsubscribe = subscribeGameState(currentLobby.id, (gameState) => {
        console.log("Game state updated:", JSON.stringify(gameState, null, 2));
        console.log(
          "Players in game state:",
          JSON.stringify(gameState?.players, null, 2)
        );
        setCurrentGameState(gameState);
      });

      return () => {
        clearInterval(countdownInterval);
        unsubscribe();
      };
    }
  }, [currentLobby?.status]);

  // Cleanup on unmount and load leaderboard
  useEffect(() => {
    // Load leaderboard from localStorage
    const savedLeaderboard = localStorage.getItem("saksici-leaderboard");
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    }

    return () => {
      if (chargingAnimationId.current) {
        cancelAnimationFrame(chargingAnimationId.current);
      }
      // Clean up multiplayer mode class
      document.body.classList.remove("multiplayer-mode");
    };
  }, []);

  // Initialize employees (only for single player)
  useEffect(() => {
    if (!isMultiplayerGame) {
      setEmployees(
        EMPLOYEES_DATA.map((emp, index) => ({
          id: index,
          x: emp.x,
          y: emp.y,
          baseX: emp.x,
          baseY: emp.y,
          hit: false,
          name: emp.name,
          hitCount: 0,
          avatar: EMPLOYEE_AVATARS[index % EMPLOYEE_AVATARS.length],
        }))
      );
    }
  }, [isMultiplayerGame]);

  // Create employees for multiplayer when game settings change
  useEffect(() => {
    if (isMultiplayerGame && gameSettings.employeeNames.length > 0) {
      console.log(
        "Creating employees for multiplayer:",
        gameSettings.employeeNames.length
      );
      const newEmployees = createEmployeesFromSettings();
      console.log("Created employees:", newEmployees);
      setEmployees(newEmployees);
    }
  }, [isMultiplayerGame, gameSettings.employeeNames.length]);

  // Optimized employee movement animation with difficulty-based speed
  useEffect(() => {
    if (!gameStarted) return;

    let animationId: number;
    const difficultySettings = getDifficultySettings(gameSettings.difficulty);

    const moveEmployees = () => {
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) => {
          if (emp.hit) return emp;

          const time = Date.now() * difficultySettings.movementSpeed;
          const offsetX =
            Math.sin(time + emp.id) * difficultySettings.movementRange;
          const offsetY =
            Math.cos(time * 0.6 + emp.id) *
            (difficultySettings.movementRange * 0.6);

          return {
            ...emp,
            x: emp.baseX + offsetX,
            y: emp.baseY + offsetY,
          };
        })
      );

      animationId = requestAnimationFrame(moveEmployees);
    };

    animationId = requestAnimationFrame(moveEmployees);
    return () => cancelAnimationFrame(animationId);
  }, [gameStarted, gameSettings.difficulty]);

  // Game physics loop
  useEffect(() => {
    if (!gameStarted) return;

    const animate = () => {
      setPots((prevPots) => {
        return prevPots
          .map((pot) => {
            if (!pot.active) return pot;

            const newX = pot.x + pot.vx;
            const newY = pot.y + pot.vy;
            const newVy = pot.vy + 0.3; // Realistic gravity

            // Multiplayer mode: Bounce off center line
            let finalX = newX;
            let finalVx = pot.vx;
            if (isMultiplayerGame && newX > window.innerWidth / 2) {
              finalX = window.innerWidth / 2 - (newX - window.innerWidth / 2);
              finalVx = -Math.abs(pot.vx) * 0.8; // Bounce back with reduced speed
            }

            // Update trail
            const newTrail = [
              { x: pot.x, y: pot.y },
              ...pot.trail.slice(0, 4), // Keep last 5 positions
            ];

            // Boundary check
            if (
              finalX < -50 ||
              finalX > window.innerWidth + 50 ||
              newY > window.innerHeight + 50
            ) {
              return { ...pot, active: false };
            }

            return {
              ...pot,
              x: finalX,
              y: newY,
              vx: finalVx,
              vy: newVy,
              trail: newTrail,
            };
          })
          .filter((pot) => pot.active);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted]);

  // Optimized collision detection
  useEffect(() => {
    if (!gameStarted) return;

    let collisionAnimationId: number;

    const checkCollisions = () => {
      setPots((prevPots) => {
        return prevPots
          .map((pot) => {
            if (!pot.active) return pot;

            // Quick collision check with active employees only
            const activeEmployees = employees.filter((emp) => !emp.hit);

            for (const employee of activeEmployees) {
              const headX = employee.x + 40;
              const headY = employee.y + 20;
              const dx = pot.x - headX;
              const dy = pot.y - headY;
              const distance = dx * dx + dy * dy; // Skip sqrt for performance

              if (distance < 1600) {
                // 40px radius squared (increased from 30px for better collision)
                const comboMultiplier = handleCombo();
                const basePoints = 1;
                const criticalHit = Math.random() < 0.2; // 20% critical hit chance
                const points =
                  basePoints * comboMultiplier * (criticalHit ? 2 : 1);

                setScore((prev) => prev + points);
                setShowConfetti(true);
                setScreenShake(true);

                // Play hit sound
                playHitSound();

                // Check achievements
                if (score === 0) {
                  unlockAchievement("İlk Kan");
                }
                if (comboMultiplier >= 5) {
                  unlockAchievement("Combo Master");
                }
                if (criticalHit) {
                  unlockAchievement("Keskin Nişancı");
                }

                // Spawn power-up occasionally
                if (Math.random() < 0.15) {
                  spawnPowerUp();
                }

                // Boss celebration
                bossControls.start({
                  scale: 1.3,
                  rotate: 15,
                  transition: { duration: 0.3 },
                });

                // Reset boss after celebration
                setTimeout(() => {
                  bossControls.start({
                    scale: 1,
                    rotate: 0,
                    transition: { duration: 0.3 },
                  });
                }, 300);

                setTimeout(() => setShowConfetti(false), 2000);
                setTimeout(() => setScreenShake(false), 250);

                // Update the hit employee
                setEmployees((prevEmployees) =>
                  prevEmployees.map((emp) =>
                    emp.id === employee.id
                      ? {
                          ...emp,
                          hit: true,
                          hitCount: emp.hitCount + 1,
                          x: emp.baseX,
                          y: emp.baseY,
                        }
                      : emp
                  )
                );

                return { ...pot, active: false };
              }
            }

            return pot;
          })
          .filter((pot) => pot.active);
      });

      collisionAnimationId = requestAnimationFrame(checkCollisions);
    };

    collisionAnimationId = requestAnimationFrame(checkCollisions);
    return () => cancelAnimationFrame(collisionAnimationId);
  }, [employees, bossControls, gameStarted]);

  // Improved power charging system
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!gameStarted || isLoading) return;

    // Check if clicking on a hit employee - if so, don't start aiming
    const target = event.target as HTMLElement;
    if (
      target.closest(".employee-emoji") &&
      target.closest(".employee-emoji")?.classList.contains("hit")
    ) {
      return;
    }

    event.preventDefault();

    // Clear any existing animation
    if (chargingAnimationId.current) {
      cancelAnimationFrame(chargingAnimationId.current);
      chargingAnimationId.current = null;
    }

    // Reset states immediately
    setShowPowerBar(true);
    setPowerLevel(0);
    chargingStartTime.current = Date.now();

    // Play aim sound
    playAimSound();

    // Improved charging loop with better stability
    const charge = () => {
      const now = Date.now();
      const elapsed = now - chargingStartTime.current;
      const newPower = Math.min(elapsed / 1500, 1); // 1.5 seconds for full power

      setPowerLevel(newPower);

      // Continue charging if not at max
      if (newPower < 1) {
        chargingAnimationId.current = requestAnimationFrame(charge);
      } else {
        // Auto-release at max power
        chargingAnimationId.current = null;
      }
    };

    // Start immediately
    charge();
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!gameStarted || !gameAreaRef.current || isLoading) return;

    event.preventDefault();

    // Clear charging animation
    if (chargingAnimationId.current) {
      cancelAnimationFrame(chargingAnimationId.current);
      chargingAnimationId.current = null;
    }

    // Minimum power requirement
    if (powerLevel < 0.05) {
      // Don't reset powerLevel immediately, let it fade naturally
      setTimeout(() => {
        setPowerLevel(0);
        setShowPowerBar(false);
      }, 300);
      return;
    }

    const rect = gameAreaRef.current.getBoundingClientRect();
    const targetX = event.clientX - rect.left;
    const targetY = event.clientY - rect.top;

    // Multiplayer mode: Limit throwing to left half only
    if (isMultiplayerGame && targetX > rect.width / 2) {
      return;
    }

    // Add click ripple effect
    const newRipple = {
      id: Date.now(),
      x: targetX,
      y: targetY,
    };
    setRipples((prev) => [...prev, newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1000);

    // Calculate launch physics with better power scaling
    const startX = isMultiplayerGame
      ? window.innerWidth / 4
      : window.innerWidth / 2;
    const startY = window.innerHeight - 60;
    const deltaX = targetX - startX;
    const deltaY = targetY - startY;

    const angle = Math.atan2(deltaY, deltaX);
    const basePower = 12;
    const powerBonus = powerLevel * 18; // More balanced power scaling
    const totalPower = basePower + powerBonus;

    const vx = Math.cos(angle) * totalPower;
    const vy = Math.sin(angle) * totalPower;

    const newPot: Pot = {
      id: Date.now(),
      x: startX,
      y: startY,
      vx,
      vy,
      active: true,
      trail: [],
    };

    setPots((prev) => [...prev, newPot]);

    // Play throw sound
    playThrowSound();

    // Delay power reset to show the final power level briefly
    setTimeout(() => {
      setPowerLevel(0);
      setShowPowerBar(false);
    }, 500);

    // Boss throwing animation based on power
    const animationIntensity = 1 + powerLevel * 0.5;
    bossControls.start({
      y: -15 * animationIntensity,
      scale: 1.1 + powerLevel * 0.2,
      transition: { duration: 0.2 },
    });

    // Reset boss position after animation
    setTimeout(() => {
      bossControls.start({
        y: 0,
        scale: 1,
        transition: { duration: 0.2 },
      });
    }, 200);
  };

  // Handle context menu to prevent right-click issues
  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const createEmployeesFromSettings = () => {
    const employeeCount = gameSettings.employeeNames.length;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const minDistance = isMultiplayerGame ? 150 : 120; // Multiplayer'da daha fazla mesafe
    const maxAttempts = 100; // Daha fazla deneme

    // Ekranın her yerine random dağıtım
    const randomPositions: { x: number; y: number }[] = [];

    for (let i = 0; i < employeeCount; i++) {
      let attempts = 0;
      let validPosition = false;
      let x: number = 0;
      let y: number = 0;

      // Çalışanların birbirine çok yakın olmaması için kontrol
      while (!validPosition && attempts < maxAttempts) {
        // Multiplayer modunda sadece sol yarıya yerleştir
        if (isMultiplayerGame) {
          // Sol yarı için daha iyi dağıtım
          x = Math.random() * (screenWidth / 2 - 200) + 100;
          y = Math.random() * (screenHeight - 400) + 150;
        } else {
          x = Math.random() * (screenWidth - 200) + 100;
          y = Math.random() * (screenHeight - 300) + 100;
        }

        // Diğer çalışanlarla minimum mesafe kontrolü
        validPosition = randomPositions.every((pos) => {
          const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
          return distance >= minDistance;
        });

        attempts++;
      }

      // Eğer geçerli pozisyon bulunamazsa, en son denenen pozisyonu kullan
      randomPositions.push({ x, y });
    }

    return randomPositions.map((pos, index) => ({
      id: index,
      x: pos.x,
      y: pos.y,
      baseX: pos.x,
      baseY: pos.y,
      hit: false,
      name: gameSettings.employeeNames[index] || `Çalışan ${index + 1}`,
      hitCount: 0,
      avatar: EMPLOYEE_AVATARS[index % EMPLOYEE_AVATARS.length],
    }));
  };

  const resetGame = () => {
    setIsLoading(true);
    setScore(0);
    setPots([]);
    setRipples([]);
    setScreenShake(false);
    setShowConfetti(false);
    setPowerLevel(0);
    setShowPowerBar(false);
    setCombo(0);
    setPowerUps([]);
    setActivePowerUp(null);
    setGameStartTime(Date.now());
    setGameTimer(0);

    // Clear timer interval
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    // Clear any charging animation
    if (chargingAnimationId.current) {
      cancelAnimationFrame(chargingAnimationId.current);
      chargingAnimationId.current = null;
    }

    // Clear timers
    if (comboTimer) clearTimeout(comboTimer);
    if (powerUpTimer) clearTimeout(powerUpTimer);

    setTimeout(() => {
      setEmployees(createEmployeesFromSettings());
      setIsLoading(false);
    }, 500);
  };

  const startGame = () => {
    if (gameSettings.bossName && gameSettings.employeeNames.length > 0) {
      setIsLoading(true);
      setShowPowerBar(false);
      setGameStartTime(Date.now());
      setGameTimer(0);

      // Start timer
      const interval = setInterval(() => {
        setGameTimer((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);

      setTimeout(() => {
        setEmployees(createEmployeesFromSettings());
        setGameStarted(true);
        setShowSettings(false);
        setIsLoading(false);
      }, 800);
    }
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  // Load available lobbies
  const loadAvailableLobbies = async () => {
    setIsLoadingLobbies(true);
    try {
      console.log("Loading available lobbies...");
      const lobbies = await getAvailableLobbies();
      console.log("Loaded lobbies:", lobbies);
      setAvailableLobbies(lobbies);
    } catch (error) {
      console.error("Error loading lobbies:", error);
    } finally {
      setIsLoadingLobbies(false);
    }
  };

  // Manual lobby refresh only - no automatic refresh
  const refreshLobbyList = () => {
    console.log("Manual lobby refresh requested");
    loadAvailableLobbies();
  };

  // Multiplayer functions
  const createMultiplayerLobby = async () => {
    if (!gameSettings.bossName.trim()) {
      alert("Lütfen önce patron adınızı girin!");
      return;
    }

    try {
      console.log("Creating lobby...");
      const lobbyId = await createLobby(
        playerId,
        gameSettings.bossName.trim(),
        lobbyName.trim() || undefined
      );
      console.log("Lobby created with ID:", lobbyId);

      setShowJoinLobby(false);
      setShowLobby(true);

      // Refresh the lobby list to show the new lobby (for other players)
      setTimeout(() => {
        console.log("Refreshing lobby list after creation...");
        loadAvailableLobbies();
      }, 2000); // Delay to ensure lobby is saved

      // Subscribe to lobby updates
      const unsubscribe = subscribeLobby(lobbyId, (lobby) => {
        console.log("Lobby updated:", lobby);
        setCurrentLobby(lobby);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error creating lobby:", error);
      alert("Lobi oluşturulurken hata oluştu!");
    }
  };

  const joinMultiplayerLobby = async (lobbyId: string) => {
    if (!gameSettings.bossName.trim()) {
      alert("Lütfen önce patron adınızı girin!");
      return;
    }

    try {
      const success = await joinLobby(
        lobbyId,
        playerId,
        gameSettings.bossName.trim()
      );
      if (success) {
        setShowJoinLobby(false);
        setShowLobby(true);

        // Subscribe to lobby updates
        const unsubscribe = subscribeLobby(lobbyId, (lobby) => {
          setCurrentLobby(lobby);
        });

        return unsubscribe;
      } else {
        alert("Lobiye katılınamadı!");
      }
    } catch (error) {
      console.error("Error joining lobby:", error);
      alert("Lobiye katılırken hata oluştu!");
    }
  };

  const leaveMultiplayerLobby = async () => {
    if (currentLobby) {
      try {
        await leaveLobby(currentLobby.id, playerId);
        setCurrentLobby(null);
        setShowLobby(false);
        setIsMultiplayerGame(false);

        // Remove multiplayer mode class from body
        document.body.classList.remove("multiplayer-mode");
      } catch (error) {
        console.error("Error leaving lobby:", error);
      }
    }
  };

  const handleUpdateLobbySettings = async (settings: GameLobby["settings"]) => {
    if (currentLobby) {
      try {
        await updateLobbySettings(currentLobby.id, settings);
      } catch (error) {
        console.error("Error updating lobby settings:", error);
      }
    }
  };

  const handleToggleReady = async (ready: boolean) => {
    if (currentLobby) {
      try {
        await setPlayerReady(currentLobby.id, playerId, ready);
      } catch (error) {
        console.error("Error setting ready status:", error);
      }
    }
  };

  const handleStartMultiplayerGame = async () => {
    if (currentLobby && currentLobby.hostId === playerId) {
      try {
        console.log("Starting multiplayer game...");
        await startMultiplayerGame(currentLobby.id, currentLobby.settings);

        // Host just triggers the game start, the useEffect will handle the rest
        console.log("Game start triggered by host");
      } catch (error) {
        console.error("Error starting multiplayer game:", error);
        alert("Oyun başlatılırken hata oluştu!");
      }
    }
  };

  const allEmployeesHit =
    employees.length > 0 && employees.every((emp) => emp.hit);

  // Update multiplayer game state when score or progress changes
  useEffect(() => {
    if (isMultiplayerGame && currentLobby && gameStarted) {
      const updatePlayerState = async () => {
        try {
          const playerState = {
            id: playerId,
            name: gameSettings.bossName,
            score: score,
            employeesHit: employees.filter((emp) => emp.hit).length,
            totalEmployees: employees.length,
            finished: allEmployeesHit,
            ...(allEmployeesHit && { finishTime: Date.now() }),
          };

          console.log("Updating player state:", playerState);
          await updatePlayerGameState(currentLobby.id, playerId, playerState);
          console.log("Player state updated successfully");
        } catch (error) {
          console.error("Error updating player state:", error);
        }
      };

      updatePlayerState();
    }
  }, [
    score,
    employees,
    allEmployeesHit,
    isMultiplayerGame,
    gameStarted,
    currentLobby,
    playerId,
    gameSettings.bossName,
  ]);

  // Play victory sound when all employees are hit
  useEffect(() => {
    if (allEmployeesHit && gameStarted && score > 0) {
      // Only save if score > 0
      const gameTime = (Date.now() - gameStartTime) / 1000;

      // Stop timer
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }

      // Check time-based achievements
      if (gameTime <= 60) {
        unlockAchievement("Patron Kralı");
      }

      // For single player, update leaderboard and save to Firebase
      if (!isMultiplayerGame) {
        // Update local leaderboard
        const newEntry = {
          name: gameSettings.bossName,
          score,
          time: gameTime,
        };

        setLeaderboard((prev) => {
          const updated = [...prev, newEntry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Keep top 10
          localStorage.setItem("saksici-leaderboard", JSON.stringify(updated));
          console.log("Local leaderboard updated:", updated);
          return updated;
        });

        // Save to Firebase
        saveScoreToFirebase();

        // Load victory leaderboard from Firebase
        loadVictoryLeaderboard();
      }

      // Delay the victory sound slightly to let the last hit sound finish
      setTimeout(() => {
        playVictorySound();
      }, 500);
    }
  }, [
    allEmployeesHit,
    gameStarted,
    score,
    gameStartTime,
    gameSettings.bossName,
  ]);

  return (
    <div className={`app ${screenShake ? "screen-shake" : ""}`}>
      {/* Global Leaderboard Modal */}
      <AnimatePresence>
        {showGlobalLeaderboard && (
          <motion.div
            className="global-leaderboard-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowGlobalLeaderboard(false)}
          >
            <motion.div
              className="global-leaderboard-content"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>🏆 Global Liderlik Tablosu</h2>

              {isLoadingScores ? (
                <div className="loading-scores">
                  <div className="loading-spinner">🏺</div>
                  <p>Skorlar yükleniyor...</p>
                  <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>
                    İlk kez yükleniyorsa biraz zaman alabilir
                  </p>
                </div>
              ) : (
                <div className="leaderboard-list">
                  {globalLeaderboard.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                      <p>🏆 Henüz skor bulunmuyor</p>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          opacity: 0.7,
                          marginTop: "10px",
                        }}
                      >
                        İlk oyunu oynayarak liderlik tablosuna girin!
                      </p>
                    </div>
                  ) : (
                    globalLeaderboard.map((player, index) => (
                      <div key={player.id} className="leaderboard-item">
                        <div className="rank">#{index + 1}</div>
                        <div className="player-info">
                          <div className="player-name">{player.playerName}</div>
                          <div className="player-stats">
                            Skor: {player.score} | Süre:{" "}
                            {player.time.toFixed(1)}s
                            <br />
                            Oyuncu: {player.playerCount || "N/A"} | Zorluk:{" "}
                            {player.difficulty} | Combo: {player.combo}
                          </div>
                        </div>
                        <div className="achievements">
                          {player.achievements.slice(0, 3).map((_, i) => (
                            <span key={i} className="achievement-badge">
                              🏆
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <motion.button
                className="close-btn"
                onClick={() => setShowGlobalLeaderboard(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Kapat
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            className="confetti"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {Array.from({ length: 60 }).map((_, i) => (
              <motion.div
                key={i}
                className="confetti-piece"
                initial={{
                  y: -100,
                  x: Math.random() * window.innerWidth,
                  rotate: 0,
                  scale: 0,
                }}
                animate={{
                  y: window.innerHeight + 100,
                  rotate: 720,
                  scale: 1,
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  ease: "easeOut",
                  delay: Math.random() * 0.5,
                }}
                style={{
                  backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="header"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <motion.h1
          animate={{
            textShadow: [
              "2px 2px 4px rgba(0,0,0,0.5), 0 0 10px #ff6b6b",
              "2px 2px 4px rgba(0,0,0,0.5), 0 0 20px #ff6b6b, 0 0 30px #ff6b6b",
              "2px 2px 4px rgba(0,0,0,0.5), 0 0 10px #ff6b6b",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🪴 SAKSICI PATRON 🪴
        </motion.h1>
        {/* Split-screen layout for multiplayer */}
        {isMultiplayerGame && gameStarted ? (
          <div className="split-screen-header">
            {/* Left side - Current Player */}
            <div className="player-header left-player">
              <h3>🎯 {gameSettings.bossName} (SEN)</h3>
              <div className="player-stats">
                <span className="score">Skor: {score}</span>
                <span className="timer">
                  ⏱️ {Math.floor(gameTimer / 60)}:
                  {(gameTimer % 60).toString().padStart(2, "0")}
                </span>
                <span className="progress">
                  👥 {employees.filter((emp) => emp.hit).length}/
                  {employees.length}
                </span>
              </div>
            </div>

            {/* Right side - Opponent */}
            <div className="player-header right-player">
              {currentGameState &&
                currentGameState.players &&
                (() => {
                  console.log(
                    "Current game state players:",
                    JSON.stringify(currentGameState.players, null, 2)
                  );
                  const players = Object.values(currentGameState.players);
                  console.log(
                    "Players array:",
                    JSON.stringify(players, null, 2)
                  );
                  const opponent = players.find((p) => p.id !== playerId);
                  console.log(
                    "Opponent found:",
                    JSON.stringify(opponent, null, 2)
                  );

                  if (opponent) {
                    return (
                      <div key={opponent.id}>
                        <h3>🎯 {opponent.name} (RAKİP)</h3>
                        <div className="player-stats">
                          <span className="score">Skor: {opponent.score}</span>
                          <span className="progress">
                            👥 {opponent.employeesHit}/{opponent.totalEmployees}
                          </span>
                          {opponent.finished ? (
                            <span className="finished">✅ BİTTİ!</span>
                          ) : (
                            <span className="playing">🎯 Oynuyor...</span>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              {(!currentGameState ||
                !currentGameState.players ||
                !Object.values(currentGameState.players).find(
                  (p) => p.id !== playerId
                )) && (
                <div>
                  <h3>🎯 Rakip</h3>
                  <div className="player-stats">
                    <span className="score">Bekleniyor...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Single player header */
          <div className="score-board">
            <motion.span
              className="score"
              key={score}
              initial={{ scale: 1 }}
              animate={{ scale: 1.3 }}
              transition={{ duration: 0.2 }}
              onAnimationComplete={() => {
                // Reset scale after animation
                setTimeout(() => {
                  // This will be handled by the key prop change
                }, 200);
              }}
            >
              Skor: {score}
            </motion.span>

            {gameStarted && (
              <div className="timer">
                ⏱️ {Math.floor(gameTimer / 60)}:
                {(gameTimer % 60).toString().padStart(2, "0")}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {combo > 1 && (
        <motion.div
          className="combo-display"
          initial={{ scale: 0, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          COMBO x{combo}!
        </motion.div>
      )}

      {activePowerUp && (
        <motion.div
          className="power-up-display"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          🚀{" "}
          {activePowerUp === "rapid"
            ? "HIZLI ATIŞ"
            : activePowerUp === "bigPot"
            ? "BÜYÜK SAKSI"
            : "ÇOKLU ATIŞ"}
        </motion.div>
      )}

      <div className="controls">
        <motion.button
          className="global-leaderboard-header-btn"
          onClick={() => {
            loadGlobalLeaderboard();
            setShowGlobalLeaderboard(true);
          }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          🏆 Global
        </motion.button>

        {!gameStarted ? (
          <motion.button
            className="start-btn"
            onClick={startGame}
            disabled={isLoading}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {isLoading ? "Hazırlanıyor..." : "Oyunu Başlat! 🎯"}
          </motion.button>
        ) : (
          <motion.button
            className="reset-btn"
            onClick={resetGame}
            disabled={isLoading}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {isLoading ? "Sıfırlanıyor..." : "Yeniden Başla 🔄"}
          </motion.button>
        )}
      </div>

      <div
        className={`game-area ${isMultiplayerGame ? "multiplayer" : ""}`}
        ref={gameAreaRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        {/* Opponent View - Right Side */}
        {isMultiplayerGame && (
          <div className="opponent-view">
            <h3>🎯 RAKİP OYUNU</h3>
            <div className="opponent-stats">
              {currentGameState && currentGameState.players ? (
                (() => {
                  const players = Object.values(currentGameState.players);
                  const opponent = players.find((p) => p.id !== playerId);

                  if (opponent) {
                    return (
                      <>
                        <span>👤 {opponent.name}</span>
                        <span>🏆 Skor: {opponent.score}</span>
                        <span>
                          👥 Vurulan: {opponent.employeesHit}/
                          {opponent.totalEmployees}
                        </span>
                        <span>
                          {opponent.finished ? "✅ BİTTİ!" : "🎯 Oynuyor..."}
                        </span>
                      </>
                    );
                  }
                  return <span>Rakip bekleniyor...</span>;
                })()
              ) : (
                <span>Rakip bilgileri yükleniyor...</span>
              )}
            </div>
          </div>
        )}

        {/* Power Meter */}
        {showPowerBar && (
          <motion.div
            className="power-meter"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="power-bar">
              <motion.div
                className="power-fill"
                animate={{
                  width: `${powerLevel * 100}%`,
                  backgroundColor:
                    powerLevel > 0.75
                      ? "#ff4444"
                      : powerLevel > 0.5
                      ? "#ffaa00"
                      : "#44ff44",
                }}
                transition={{ duration: 0.05, ease: "easeOut" }}
              />
            </div>
            <div className="power-label">
              GÜÇ: {Math.round(powerLevel * 100)}%
            </div>
          </motion.div>
        )}

        {/* Boss Character */}
        <motion.div
          className="boss"
          animate={bossControls}
          initial={{ scale: 0, y: 100 }}
          whileInView={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <motion.div
            className="boss-character"
            animate={{
              y: -8,
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          >
            {gameSettings.bossGender === "male" ? "🧔‍♂️" : "👩‍💼"}
          </motion.div>
          <div className="boss-label">
            {gameSettings.bossName
              ? ` ${gameSettings.bossName.toUpperCase()}`
              : "PATRON (SEN)"}
          </div>
          <motion.div
            className="launch-indicator"
            animate={{
              y: -12,
              scale: 1.1,
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          >
            <div className="pot-body">🪴</div>
          </motion.div>
        </motion.div>

        {/* Office Desks and Employees */}
        <AnimatePresence>
          {employees.map((employee, index) => (
            <motion.div
              key={employee.id}
              className="employee-simple"
              style={{
                left: employee.x,
                top: employee.y,
              }}
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: 1,
                rotate: 0,
                y: employee.hit ? -20 : 0,
              }}
              transition={{
                delay: index * 0.1,
                type: "spring",
                stiffness: 200,
              }}
              whileHover={
                !employee.hit
                  ? {
                      scale: 1.1,
                      transition: { duration: 0.2 },
                    }
                  : {}
              }
            >
              {/* Simple Employee - Just Emoji */}
              <motion.div
                className={`employee-emoji ${employee.hit ? "hit" : ""}`}
                animate={{
                  opacity: employee.hit ? 0.3 : 1,
                }}
                transition={{ duration: 0.5 }}
                whileHover={
                  !employee.hit
                    ? {
                        scale: 1.1,
                        transition: { duration: 0.2 },
                      }
                    : {}
                }
              >
                <div className="employee-face">
                  {employee.hit ? "😵" : employee.avatar}
                </div>
                {employee.hit && (
                  <motion.div
                    className="band-aid"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    🩹
                  </motion.div>
                )}
              </motion.div>

              <div className="employee-name">{employee.name}</div>

              <AnimatePresence>
                {employee.hit && (
                  <motion.div
                    className="hit-effect"
                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                    animate={{ opacity: 1, y: -40, scale: 1 }}
                    exit={{ opacity: 0, y: -60, scale: 0.5 }}
                    transition={{ duration: 2 }}
                  >
                    VURULDU! 💥
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Flying Pots */}
        <AnimatePresence>
          {pots.map((pot) => (
            <motion.div key={pot.id}>
              {/* Pot Trail */}
              {pot.trail.map((trailPoint, index) => (
                <motion.div
                  key={`${pot.id}-trail-${index}`}
                  className="pot-trail"
                  style={{
                    left: trailPoint.x,
                    top: trailPoint.y,
                  }}
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{
                    scale: 0.3,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.5 }}
                />
              ))}

              {/* Realistic Pot */}
              <motion.div
                className="pot"
                style={{
                  left: pot.x,
                  top: pot.y,
                }}
                initial={{ scale: 0, rotate: 0 }}
                animate={{
                  scale: 1,
                  rotate: pot.vx * 2, // Slight rotation based on velocity
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                <div className="realistic-pot">
                  <div className="pot-body">🪴</div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Enhanced Click Ripples */}
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              className="click-ripple"
              style={{
                left: ripple.x - 60,
                top: ripple.y - 60,
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              exit={{ scale: 4, opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          ))}
        </AnimatePresence>

        {/* Power-ups */}
        <AnimatePresence>
          {powerUps.map((powerUp) => (
            <motion.div
              key={powerUp.id}
              className="power-up"
              style={{
                left: powerUp.x,
                top: powerUp.y,
              }}
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => {
                activatePowerUp(powerUp.type);
                setPowerUps((prev) => prev.filter((p) => p.id !== powerUp.id));
              }}
            >
              <div className="power-up-icon">
                {powerUp.type === "rapid"
                  ? "⚡"
                  : powerUp.type === "bigPot"
                  ? "🪣"
                  : "🎯"}
              </div>
              <div className="power-up-label">
                {powerUp.type === "rapid"
                  ? "Hızlı"
                  : powerUp.type === "bigPot"
                  ? "Büyük"
                  : "Çoklu"}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Achievement Notification */}
        <AnimatePresence>
          {showAchievement && (
            <motion.div
              className="achievement-notification"
              initial={{ scale: 0, y: -100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: -100 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="achievement-icon">🏆</div>
              <div className="achievement-text">
                <div className="achievement-title">BAŞARIM!</div>
                <div className="achievement-name">{showAchievement}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Single Player Victory */}
        <AnimatePresence>
          {allEmployeesHit && !isMultiplayerGame && (
            <div className="victory-screen">
              {/* Local Leaderboard - Sol taraf */}
              <motion.div
                className="victory-leaderboard"
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              >
                <h3>🏆 En İyi 10 Skor</h3>
                <div className="leaderboard-list">
                  {isLoadingVictoryLeaderboard ? (
                    <div className="loading-scores">
                      <div className="loading-spinner">🏺</div>
                      <p>Skorlar yükleniyor...</p>
                    </div>
                  ) : victoryLeaderboard.length > 0 ? (
                    victoryLeaderboard.map((entry, index) => (
                      <div
                        key={entry.id || index}
                        className={`leaderboard-item ${
                          index === 0 ? "first-place" : ""
                        }`}
                      >
                        <span className="rank">#{index + 1}</span>
                        <span className="name">{entry.playerName}</span>
                        <span className="score">{entry.score}</span>
                      </div>
                    ))
                  ) : (
                    <div className="no-scores">Henüz skor yok</div>
                  )}
                </div>
              </motion.div>

              {/* Victory Message - Sağ taraf */}
              <motion.div
                className="victory-message"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 10,
                }}
              >
                <motion.div
                  animate={{
                    scale: 1.1,
                    rotate: 3,
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  🎉 Hakkını verdin! TÜM ÇALIŞANLARI VURDUN! 🎉
                  <br />
                  Toplam Skor: {score}
                  <br />
                  <span style={{ fontSize: "1.2rem", opacity: 0.8 }}>
                    Artık gerçek bir patron oldun! 👑
                  </span>
                </motion.div>

                <div className="victory-buttons">
                  <motion.button
                    className="restart-settings-btn"
                    onClick={() => {
                      setGameStarted(false);
                      setShowSettings(true);
                      resetGame();
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    ⚙️ Baştan Başlat
                  </motion.button>

                  <motion.button
                    className="restart-game-btn"
                    onClick={resetGame}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    🔄 Yeniden Başlat
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Multiplayer Victory */}
        <AnimatePresence>
          {isMultiplayerGame &&
            currentGameState &&
            currentGameState.players &&
            (() => {
              const players = Object.values(currentGameState.players);
              const currentPlayer = players.find((p) => p.id === playerId);
              const opponent = players.find((p) => p.id !== playerId);
              const gameFinished = players.some((p) => p.finished);
              const winner = players.find((p) => p.finished);

              if (gameFinished) {
                // Mark game as finished when victory screen shows
                if (currentLobby) {
                  finishMultiplayerGame(currentLobby.id);
                }

                return (
                  <motion.div
                    className="multiplayer-victory-screen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      className="multiplayer-victory-content"
                      initial={{ scale: 0.8, y: 50 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <h2>
                        {winner?.id === playerId
                          ? "🎉 KAZANDIN! 🎉"
                          : "😔 KAYBETTİN"}
                      </h2>

                      <div className="final-scores">
                        <div
                          className={`player-result ${
                            currentPlayer?.id === playerId ? "current" : ""
                          }`}
                        >
                          <h3>{currentPlayer?.name}</h3>
                          <p>Skor: {currentPlayer?.score}</p>
                          <p>
                            Çalışan: {currentPlayer?.employeesHit}/
                            {currentPlayer?.totalEmployees}
                          </p>
                        </div>

                        <div className="vs">VS</div>

                        <div
                          className={`player-result ${
                            opponent?.id === playerId ? "current" : ""
                          }`}
                        >
                          <h3>{opponent?.name}</h3>
                          <p>Skor: {opponent?.score}</p>
                          <p>
                            Çalışan: {opponent?.employeesHit}/
                            {opponent?.totalEmployees}
                          </p>
                        </div>
                      </div>

                      <div className="multiplayer-victory-buttons">
                        <motion.button
                          className="restart-multiplayer-btn"
                          onClick={() => {
                            // Reset game and go back to lobby screen
                            setGameStarted(false);
                            setCurrentGameState(null);
                            setIsMultiplayerGame(false);
                            setScore(0);
                            setPots([]);
                            setRipples([]);
                            setScreenShake(false);
                            setShowConfetti(false);
                            setPowerLevel(0);
                            setShowPowerBar(false);
                            setCombo(0);
                            setPowerUps([]);
                            setActivePowerUp(null);
                            setGameStartTime(Date.now());
                            setGameTimer(0);

                            // Clear timer interval
                            if (timerInterval) {
                              clearInterval(timerInterval);
                              setTimerInterval(null);
                            }

                            // Clear any charging animation
                            if (chargingAnimationId.current) {
                              cancelAnimationFrame(chargingAnimationId.current);
                              chargingAnimationId.current = null;
                            }

                            // Clear timers
                            if (comboTimer) clearTimeout(comboTimer);
                            if (powerUpTimer) clearTimeout(powerUpTimer);

                            // Go back to lobby screen
                            setShowLobby(true);

                            // Reset player ready status in lobby and set status back to waiting
                            if (currentLobby) {
                              handleToggleReady(false);
                              // Reset lobby status to waiting for new game
                              const statusRef = ref(
                                rtdb,
                                `lobbies/${currentLobby.id}/status`
                              );
                              set(statusRef, "waiting");
                              // Reset multiplayer game state
                              setIsMultiplayerGame(false);

                              // Remove multiplayer mode class from body
                              document.body.classList.remove(
                                "multiplayer-mode"
                              );
                            }

                            // Reset employees
                            setTimeout(() => {
                              setEmployees(createEmployeesFromSettings());
                            }, 500);
                          }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 400 }}
                          style={{
                            background:
                              "linear-gradient(45deg, #4ecdc4, #44a08d)",
                            border: "none",
                            color: "white",
                            padding: "12px 24px",
                            borderRadius: "8px",
                            fontSize: "1rem",
                            fontWeight: "bold",
                            cursor: "pointer",
                            margin: "0 10px",
                          }}
                        >
                          🔄 Yeniden Oyna
                        </motion.button>

                        <motion.button
                          className="back-to-menu-btn"
                          onClick={() => {
                            setIsMultiplayerGame(false);
                            setGameStarted(false);
                            setCurrentLobby(null);
                            setCurrentGameState(null);

                            // Remove multiplayer mode class from body
                            document.body.classList.remove("multiplayer-mode");

                            resetGame();
                          }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 400 }}
                          style={{
                            background:
                              "linear-gradient(45deg, #ff6b6b, #ee5a52)",
                            border: "none",
                            color: "white",
                            padding: "12px 24px",
                            borderRadius: "8px",
                            fontSize: "1rem",
                            fontWeight: "bold",
                            cursor: "pointer",
                            margin: "0 10px",
                          }}
                        >
                          🏠 Ana Menü
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              }
              return null;
            })()}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {!gameStarted && !showSettings && (
          <motion.div
            className="welcome-screen"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h2
              animate={{
                color: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ff6b6b"],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              Hoş Geldin Patron! 👔
            </motion.h2>
            <p>Masalarında çalışan personeline saksı at!</p>
            <p>
              <strong>Basılı tut</strong> güç topla, <strong>bırak</strong>{" "}
              fırlat! 🏺
            </p>
            <p>Kafalarına isabet ettir ve puanını artır! 🎯</p>
            <div className="welcome-buttons">
              <motion.button
                className="start-btn"
                onClick={() => {
                  setGameMode("single");
                  openSettings();
                }}
                disabled={isLoading}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                🎯 Tek Oyuncu
              </motion.button>

              <motion.button
                className="multiplayer-btn"
                onClick={() => {
                  setGameMode("multiplayer");
                  setShowJoinLobby(true);
                  // Load lobbies when opening the modal
                  loadAvailableLobbies();
                }}
                disabled={isLoading}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                🎮 Çok Oyuncu
              </motion.button>

              <motion.button
                className="leaderboard-btn"
                onClick={() => {
                  loadGlobalLeaderboard();
                  setShowGlobalLeaderboard(true);
                }}
                disabled={isLoading}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                🏆 Global Liderlik Tablosu
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Lobby Modal */}
      <AnimatePresence>
        {showJoinLobby && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowJoinLobby(false)}
          >
            <motion.div
              className="join-lobby-modal"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "90%",
                maxWidth: "800px",
                maxHeight: "80vh",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h2>🎮 Çok Oyuncu Modu</h2>

              <div
                className="player-name-section"
                style={{ marginBottom: "20px" }}
              >
                <label>Oyuncu Adın:</label>
                <input
                  type="text"
                  value={gameSettings.bossName}
                  onChange={(e) =>
                    setGameSettings((prev) => ({
                      ...prev,
                      bossName: e.target.value,
                    }))
                  }
                  placeholder="Adınızı girin..."
                  maxLength={20}
                />
              </div>

              <div
                className="lobby-actions"
                style={{ display: "flex", gap: "20px", flex: 1 }}
              >
                {/* Create Lobby Section */}
                <div
                  className="create-lobby-section"
                  style={{ flex: 1, minWidth: "300px" }}
                >
                  <h3 style={{ color: "#4ecdc4", marginBottom: "15px" }}>
                    🏠 Lobi Oluştur
                  </h3>
                  <input
                    type="text"
                    value={lobbyName}
                    onChange={(e) => setLobbyName(e.target.value)}
                    placeholder="Lobi adı (opsiyonel)..."
                    maxLength={30}
                    style={{
                      width: "100%",
                      padding: "12px",
                      marginBottom: "15px",
                      border: "2px solid #4ecdc4",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "white",
                      textAlign: "center",
                      fontSize: "1rem",
                    }}
                  />
                  <motion.button
                    className="create-lobby-btn"
                    onClick={createMultiplayerLobby}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!gameSettings.bossName.trim()}
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                    }}
                  >
                    🏠 Lobi Oluştur
                  </motion.button>
                </div>

                {/* Available Lobbies */}
                <div
                  className="available-lobbies-section"
                  style={{ flex: 1, minWidth: "300px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        color: "#4ecdc4",
                        fontSize: "1.1rem",
                      }}
                    >
                      🎮 Aktif Lobiler
                    </h3>
                    <motion.button
                      onClick={refreshLobbyList}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        background: "linear-gradient(45deg, #4ecdc4, #44a08d)",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        fontWeight: "bold",
                      }}
                    >
                      🔄 Yenile
                    </motion.button>
                  </div>

                  <div
                    className="lobbies-list"
                    style={{ maxHeight: "400px", overflowY: "auto" }}
                  >
                    {/* Debug info */}
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "#888",
                        marginBottom: "10px",
                        textAlign: "center",
                      }}
                    >
                      {isLoadingLobbies
                        ? "Yükleniyor..."
                        : `Toplam ${availableLobbies.length} lobi bulundu`}
                    </div>

                    {isLoadingLobbies ? (
                      <div className="loading-lobbies">
                        🏺 Lobiler yükleniyor...
                      </div>
                    ) : availableLobbies.length > 0 ? (
                      availableLobbies.map((lobby) => (
                        <motion.div
                          key={lobby.id}
                          className="lobby-item"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => joinMultiplayerLobby(lobby.id)}
                          style={{
                            padding: "12px",
                            marginBottom: "8px",
                            borderRadius: "8px",
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "1px solid #4ecdc4",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div className="lobby-info">
                            <div
                              className="lobby-name"
                              style={{
                                fontWeight: "bold",
                                marginBottom: "4px",
                              }}
                            >
                              {lobby.name}
                            </div>
                            <div
                              className="lobby-details"
                              style={{ fontSize: "0.9rem", color: "#ccc" }}
                            >
                              👥 {Object.keys(lobby.players).length}/2 | ⏱️{" "}
                              {lobby.settings.timeLimit}s |{" "}
                              {lobby.settings.difficulty}
                            </div>
                          </div>
                          <span
                            className="join-arrow"
                            style={{ fontSize: "1.2rem" }}
                          >
                            →
                          </span>
                        </motion.div>
                      ))
                    ) : (
                      <div
                        className="no-lobbies"
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          color: "#888",
                        }}
                      >
                        Aktif lobi bulunamadı
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <motion.button
                className="close-btn"
                onClick={() => setShowJoinLobby(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ❌ Kapat
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lobby Screen */}
      <AnimatePresence>
        {showLobby && currentLobby && (
          <LobbyScreen
            lobby={currentLobby}
            playerId={playerId}
            onStartGame={handleStartMultiplayerGame}
            onLeaveLobby={leaveMultiplayerLobby}
            onUpdateSettings={handleUpdateLobbySettings}
            onToggleReady={handleToggleReady}
          />
        )}
      </AnimatePresence>

      {/* Settings Screen - Outside of game area */}
      <AnimatePresence>
        {showSettings && (
          <SettingsScreen
            gameSettings={gameSettings}
            setGameSettings={setGameSettings}
            onStartGame={startGame}
            onBack={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

      {/* Countdown overlay for multiplayer */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            className="countdown-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="countdown-number"
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {countdown === 0 ? "BAŞLA!" : countdown}
            </motion.div>
            <p>Multiplayer yarış başlıyor...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="loading-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <div className="pot-plant">🌿</div>
              <div className="pot-soil">🟫</div>
              <div className="pot-body">🪴</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
