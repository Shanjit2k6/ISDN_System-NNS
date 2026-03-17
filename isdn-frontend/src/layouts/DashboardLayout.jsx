import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import styles from './DashboardLayout.module.css';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';

// Mock navigation items - to be derived from roles later
const getNavItems = (role) => [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/orders', label: 'Orders', icon: '📦' },
  { path: '/inventory', label: 'Inventory', icon: '🏢' },
  { path: '/logistics', label: 'Logistics', icon: '🚚' },
  { path: '/billing', label: 'Billing', icon: '💰' },
];

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = getNavItems(currentUser?.role);

  return (
    <div className={styles.layout}>
      {/* Sidebar Navigation */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.logo}>
          <div style={{ width: 24, height: 24, backgroundColor: 'var(--accent-primary)', borderRadius: 4 }}></div>
          ISDN System
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border-light)' }}>
          <Button variant="ghost" className="w-full justify-start" onClick={logout}>🚪 Logout</Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.main}>
        <header className={styles.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>☰</button>
            <div className={styles.search}>
              <input 
                type="text" 
                placeholder="Search..." 
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>
          <div className={styles.actions}>
            <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 30 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
