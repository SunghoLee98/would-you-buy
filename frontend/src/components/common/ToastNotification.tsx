/**
 * Toast Notification Component
 * React-based toast notification without DOM manipulation
 */

import React, { useEffect, useState } from 'react';
import styles from '../../styles/streak.module.css';

interface ToastNotificationProps {
  message: string;
  subMessage?: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  subMessage,
  type = 'success',
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(hideTimer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'linear-gradient(135deg, #2ecc71, #27ae60)';
      case 'error':
        return 'linear-gradient(135deg, #e74c3c, #c0392b)';
      case 'info':
      default:
        return 'linear-gradient(135deg, #3498db, #2980b9)';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: getBackgroundColor(),
        color: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        zIndex: 10000,
        animation: isLeaving ? 'slideOutRight 0.3s ease' : 'slideInRight 0.3s ease',
        fontWeight: '600'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>{getIcon()}</span>
        <span>{message}</span>
      </div>
      {subMessage && (
        <div style={{ marginTop: '8px', fontSize: '14px', opacity: 0.9 }}>
          {subMessage}
        </div>
      )}
    </div>
  );
};

export default ToastNotification;