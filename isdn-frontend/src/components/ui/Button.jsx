import React from 'react';
import styles from './Button.module.css';

export const Button = ({
  children,
  variant = 'primary', // primary, secondary, ghost, danger
  size = 'md', // sm, md, lg
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClass = styles.button;
  const variantClass = styles[variant] || styles.primary;
  const sizeClass = styles[size] || styles.md;
  
  const combinedClasses = `${baseClass} ${variantClass} ${sizeClass} ${className}`.trim();

  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};
