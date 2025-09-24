import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

interface ConfettiAnimationProps {
  isActive: boolean;
  duration?: number;
  onComplete?: () => void;
}

const confettiFall = keyframes`
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
`;

const ConfettiContainer = styled.div<{ isActive: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
  display: ${props => props.isActive ? 'block' : 'none'};
`;

const ConfettiPiece = styled.div<{
  color: string;
  size: number;
  left: number;
  animationDelay: number;
  animationDuration: number;
}>`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background: ${props => props.color};
  left: ${props => props.left}%;
  animation: ${confettiFall} ${props => props.animationDuration}s linear ${props => props.animationDelay}s;
  border-radius: 2px;
`;

const colors = [
  '#667eea', // Primary blue
  '#764ba2', // Primary purple
  '#43e97b', // Success green
  '#38f9d7', // Success teal
  '#f093fb', // Error pink
  '#f5576c', // Error red
  '#ff9800', // Warning orange
  '#2196f3', // Info blue
  '#ffd700', // Gold
  '#ff69b4', // Hot pink
  '#00ced1', // Dark turquoise
  '#32cd32', // Lime green
];

const generateConfetti = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4, // 4-12px
    left: Math.random() * 100, // 0-100%
    animationDelay: Math.random() * 3, // 0-3s delay
    animationDuration: Math.random() * 3 + 2, // 2-5s duration
  }));
};

const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({
  isActive,
  duration = 3000,
  onComplete,
}) => {
  const [confettiPieces, setConfettiPieces] = useState<Array<{
    id: number;
    color: string;
    size: number;
    left: number;
    animationDelay: number;
    animationDuration: number;
  }>>([]);

  useEffect(() => {
    if (isActive) {
      const pieces = generateConfetti(50);
      setConfettiPieces(pieces);

      const timer = setTimeout(() => {
        setConfettiPieces([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setConfettiPieces([]);
    }
  }, [isActive, duration, onComplete]);

  return (
    <ConfettiContainer isActive={isActive}>
      {confettiPieces.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          color={piece.color}
          size={piece.size}
          left={piece.left}
          animationDelay={piece.animationDelay}
          animationDuration={piece.animationDuration}
        />
      ))}
    </ConfettiContainer>
  );
};

export default ConfettiAnimation;