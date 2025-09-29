/**
 * 🎊 ConfettiEffect Component
 * React-based confetti animation without DOM manipulation
 */

import React, { useEffect, useState } from 'react';
import { CONFETTI_CONFIG } from '../../constants/streak.constants';
import styles from '../../styles/streak.module.css';

interface ConfettiParticle {
  id: number;
  left: number;
  color: string;
  rotation: number;
  animationDelay: number;
}

interface ConfettiEffectProps {
  active: boolean;
  duration?: number;
}

const ConfettiEffect: React.FC<ConfettiEffectProps> = ({
  active,
  duration = CONFETTI_CONFIG.DURATION
}) => {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  useEffect(() => {
    if (active) {
      const newParticles: ConfettiParticle[] = [];

      for (let i = 0; i < CONFETTI_CONFIG.COUNT; i++) {
        newParticles.push({
          id: i,
          left: Math.random() * 100,
          color: CONFETTI_CONFIG.COLORS[Math.floor(Math.random() * CONFETTI_CONFIG.COLORS.length)],
          rotation: Math.random() * 360,
          animationDelay: Math.random() * 0.5
        });
      }

      setParticles(newParticles);

      // Clear particles after animation
      const timer = setTimeout(() => {
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  if (!active || particles.length === 0) return null;

  return (
    <div className={styles.confettiContainer}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={styles.confettiParticle}
          style={{
            left: `${particle.left}%`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            animationDelay: `${particle.animationDelay}s`
          }}
        />
      ))}
    </div>
  );
};

export default ConfettiEffect;