import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';

export const AuthLayout = () => {
  return (
    <div className={styles.layout}>
      <div className={styles.illustration}>
        {/* Placeholder for branding/illustration */}
        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '1rem' }}>ISDN System NNS</h2>
          <p>Sales Distribution Management Platform</p>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.inner}>
          <div className={styles.logo}>ISDN</div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
