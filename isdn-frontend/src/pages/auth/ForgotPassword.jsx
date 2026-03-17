import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Password reset link sent! Check your inbox.');
    } catch (err) {
      setError('Failed to reset password. Please verify the email address.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>
          Reset Password
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--accent-danger)', color: 'white', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ backgroundColor: 'var(--accent-success)', color: 'white', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button type="submit" disabled={loading} className="w-full" style={{ marginTop: 'var(--space-2)' }}>
          {loading ? 'Sending link...' : 'Send Reset Link'}
        </Button>
      </form>

      <div style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        Remembered your password?{' '}
        <Link to="/login" style={{ fontWeight: '500' }}>
          Sign in
        </Link>
      </div>
    </Card>
  );
};
