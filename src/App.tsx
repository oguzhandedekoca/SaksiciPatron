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
  { name: "Ahmet", x: 150, y: 180 },
  { name: "Fatma", x: 450, y: 160 },
  { name: "Mehmet", x: 750, y: 200 },
  { name: "Ayşe", x: 1050, y: 170 },
  { name: "Mustafa", x: 250, y: 320 },
  { name: "Zeynep", x: 550, y: 300 },
  { name: "Ali", x: 850, y: 340 },
  { name: "Elif", x: 350, y: 460 },
];

function App() {
  const [score, setScore] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pots, setPots] = useState<Pot[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [powerLevel, setPowerLevel] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const chargingStartTime = useRef<number>(0);
  const chargingAnimationId = useRef<number | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const bossControls = useAnimation();

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

  // Optimized employee movement animation
  useEffect(() => {
    if (!gameStarted) return;

    let animationId: number;

    const moveEmployees = () => {
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) => {
          if (emp.hit) return emp;

          const time = Date.now() * 0.0008; // Slightly slower for less CPU usage
          const offsetX = Math.sin(time + emp.id) * 12; // Reduced range
          const offsetY = Math.cos(time * 0.6 + emp.id) * 8; // Reduced range

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
  }, [gameStarted]);

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

                // Boss celebration
                bossControls.start({
                  scale: [1, 1.3, 1],
                  rotate: [0, 15, -15, 0],
                  transition: { duration: 0.6 },
                });

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

  // Simple and fast power charging system
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!gameStarted || isLoading) return;

    event.preventDefault();

    // Clear any existing animation
    if (chargingAnimationId.current) {
      cancelAnimationFrame(chargingAnimationId.current);
    }

    // Reset states immediately
    setIsCharging(true);
    setPowerLevel(0);
    chargingStartTime.current = Date.now();

    // Simple charging loop
    const charge = () => {
      const now = Date.now();
      const elapsed = now - chargingStartTime.current;
      const newPower = Math.min(elapsed / 1500, 1); // 1.5 seconds for full power (faster)

      setPowerLevel(newPower);

      if (newPower < 1) {
        chargingAnimationId.current = requestAnimationFrame(charge);
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
      setPowerLevel(0);
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
    setPowerLevel(0);

    // Boss throwing animation based on power
    const animationIntensity = 1 + powerLevel * 0.5;
    bossControls.start({
      y: [0, -15 * animationIntensity, 0],
      scale: [1, 1.1 + powerLevel * 0.2, 1],
      transition: { duration: 0.4 },
    });
  };

  // Handle context menu to prevent right-click issues
  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
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

    // Clear any charging animation
    if (chargingAnimationId.current) {
      cancelAnimationFrame(chargingAnimationId.current);
      chargingAnimationId.current = null;
    }

    setTimeout(() => {
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
      setIsLoading(false);
    }, 500);
  };

  const startGame = () => {
    setIsLoading(true);
    setTimeout(() => {
      setGameStarted(true);
      setIsLoading(false);
    }, 800);
  };

  const allEmployeesHit =
    employees.length > 0 && employees.every((emp) => emp.hit);

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
                  scale: [0, 1, 0],
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
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.4 }}
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
        {isCharging && (
          <motion.div
            className="power-meter"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
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
                transition={{ duration: 0.1 }}
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
              y: [0, -8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            🧔‍♂️
          </motion.div>
          <div className="boss-label">PATRON (SEN)</div>
          <motion.div
            className="launch-indicator"
            animate={{
              y: [0, -12, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            🏺
          </motion.div>
        </motion.div>

        {/* Office Desks and Employees */}
        <AnimatePresence>
          {employees.map((employee, index) => (
            <motion.div
              key={employee.id}
              className="employee-workspace"
              style={{
                left: employee.x,
                top: employee.y,
              }}
              initial={{ scale: 0, rotate: -180, y: 50 }}
              animate={{
                scale: 1,
                rotate: 0,
                y: 0,
              }}
              transition={{
                delay: index * 0.15,
                type: "spring",
                stiffness: 150,
              }}
            >
              {/* Desk */}
              <div className="desk">
                <div className="desk-surface"></div>
                <div className="desk-legs"></div>
                <div className="computer">💻</div>
                <div className="papers">📄</div>
              </div>

              {/* Employee */}
              <motion.div
                className={`employee ${employee.hit ? "hit" : ""}`}
                whileHover={
                  !employee.hit
                    ? {
                        scale: 1.05,
                        transition: { duration: 0.2 },
                      }
                    : {}
                }
              >
                <div className="employee-body">
                  <div className="employee-head">
                    <div className="face">{employee.hit ? "😵" : "😊"}</div>
                    {employee.hit && (
                      <motion.div
                        className="injury-mark"
                        initial={{ scale: 0, rotate: 45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        🩹
                      </motion.div>
                    )}
                  </div>
                  <div className="employee-torso">👔</div>
                </div>

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
                  <div className="pot-plant">🌿</div>
                  <div className="pot-soil">🟫</div>
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
                  scale: [1, 1.1, 1],
                  rotate: [0, 3, -3, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                🎉 MÜKEMMEL! TÜM ÇALIŞANLARI VURDUN! 🎉
                <br />
                Toplam Skor: {score}
                <br />
                <span style={{ fontSize: "1.2rem", opacity: 0.8 }}>
                  Artık gerçek bir patron oldun! 👑
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {!gameStarted && (
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
              🏺
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
