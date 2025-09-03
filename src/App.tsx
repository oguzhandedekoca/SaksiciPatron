import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import "./App.css";

interface Employee {
  id: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  hit: boolean;
  name: string;
  hitCount: number;
}

interface GameSettings {
  bossName: string;
  employeeNames: string[];
  difficulty: "kolay" | "orta" | "zor";
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

const EMPLOYEES_DATA = [
  // Sol üst bölge
  { name: "Ahmet", x: 120, y: 120 },
  { name: "Fatma", x: 200, y: 180 },
  { name: "Mustafa", x: 150, y: 250 },
  { name: "Hakan", x: 100, y: 320 },
  { name: "Leyla", x: 180, y: 380 },

  // Orta sol bölge
  { name: "Zeynep", x: 300, y: 150 },
  { name: "Elif", x: 350, y: 220 },
  { name: "Deniz", x: 280, y: 300 },
  { name: "Ece", x: 320, y: 380 },
  { name: "İpek", x: 250, y: 450 },

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
  { name: "Okan", x: 1150, y: 320 },
  { name: "Pınar", x: 1050, y: 400 },
  { name: "Tolga", x: 1180, y: 480 },
];

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
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    bossName: "",
    employeeNames: [],
    difficulty: "orta",
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [powerLevel, setPowerLevel] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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

      notes.forEach((note, index) => {
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
    } catch (error) {
      console.log("Audio not supported");
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chargingAnimationId.current) {
        cancelAnimationFrame(chargingAnimationId.current);
      }
    };
  }, []);

  // Initialize employees
  useEffect(() => {
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
      }))
    );
  }, []);

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

            // Update trail
            const newTrail = [
              { x: pot.x, y: pot.y },
              ...pot.trail.slice(0, 4), // Keep last 5 positions
            ];

            // Boundary check
            if (
              newX < -50 ||
              newX > window.innerWidth + 50 ||
              newY > window.innerHeight + 50
            ) {
              return { ...pot, active: false };
            }

            return {
              ...pot,
              x: newX,
              y: newY,
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

              if (distance < 900) {
                // 30px radius squared
                setScore((prev) => prev + 1);
                setShowConfetti(true);
                setScreenShake(true);

                // Play hit sound
                playHitSound();

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

    event.preventDefault();

    // Clear any existing animation
    if (chargingAnimationId.current) {
      cancelAnimationFrame(chargingAnimationId.current);
      chargingAnimationId.current = null;
    }

    // Reset states immediately
    setIsCharging(true);
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
        setIsCharging(false);
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

    setIsCharging(false);

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
    const startX = window.innerWidth / 2;
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
    const minDistance = 120; // Minimum mesafe (px)
    const maxAttempts = 50; // Maksimum deneme sayısı

    // Ekranın her yerine random dağıtım
    const randomPositions = [];

    for (let i = 0; i < employeeCount; i++) {
      let attempts = 0;
      let validPosition = false;
      let x, y;

      // Çalışanların birbirine çok yakın olmaması için kontrol
      while (!validPosition && attempts < maxAttempts) {
        x = Math.random() * (screenWidth - 200) + 100;
        y = Math.random() * (screenHeight - 300) + 100;

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
    setIsCharging(false);
    setShowPowerBar(false);

    // Clear any charging animation
    if (chargingAnimationId.current) {
      cancelAnimationFrame(chargingAnimationId.current);
      chargingAnimationId.current = null;
    }

    setTimeout(() => {
      setEmployees(createEmployeesFromSettings());
      setIsLoading(false);
    }, 500);
  };

  const startGame = () => {
    if (gameSettings.bossName && gameSettings.employeeNames.length > 0) {
      setIsLoading(true);
      setShowPowerBar(false);
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

  const allEmployeesHit =
    employees.length > 0 && employees.every((emp) => emp.hit);

  // Play victory sound when all employees are hit
  useEffect(() => {
    if (allEmployeesHit && gameStarted) {
      // Delay the victory sound slightly to let the last hit sound finish
      setTimeout(() => {
        playVictorySound();
      }, 500);
    }
  }, [allEmployeesHit, gameStarted]);

  return (
    <div className={`app ${screenShake ? "screen-shake" : ""}`}>
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
          🏺 SAKSICI PATRON 🏺
        </motion.h1>
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
          <div className="controls">
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
        </div>
      </motion.div>

      <div
        className="game-area"
        ref={gameAreaRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
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
            🧔‍♂️
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
                  {employee.hit ? "😵" : "😊"}
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

        <AnimatePresence>
          {allEmployeesHit && (
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
          )}
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
            <motion.button
              className="start-btn"
              onClick={openSettings}
              disabled={isLoading}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Oyunu Başlat! 🎯
            </motion.button>
          </motion.div>
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
              🏺
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
