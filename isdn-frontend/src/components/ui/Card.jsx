import React from 'react';
import styles from './Card.module.css';

export const Card = ({ children, className = '', glass = false, ...props }) => {
  const glassClass = glass ? styles.glass : '';
  
  return (
    <div className={`${styles.card} ${glassClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};
