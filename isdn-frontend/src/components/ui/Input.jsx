import React from 'react';
import styles from './Input.module.css';

export const Input = React.forwardRef(({
  label,
  error,
  className = '',
  wrapperClassName = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`${styles.inputWrapper} ${wrapperClassName}`}>
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={`${styles.input} ${error ? styles.error : ''} ${className}`}
        {...props}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
