import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { toast } from 'react-hot-toast';

export const LoginForm = ({ onForgotPassword }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Successfully logged in.");
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to log in. Check credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="label" htmlFor="email">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          placeholder="admin@fuelguard.ai"
          disabled={submitting}
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          placeholder="••••••••"
          disabled={submitting}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 text-luxury-gold focus:ring-luxury-gold border-border-light rounded cursor-pointer"
          />
          <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-text-secondary cursor-pointer">
            Remember me
          </label>
        </div>

        <button
          type="button"
          onClick={onForgotPassword}
          className="text-xs font-bold text-luxury-gold hover:text-luxury-gold-dark hover:underline"
          disabled={submitting}
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn-gold w-full flex items-center justify-center gap-2"
      >
        {submitting ? <LoadingSpinner size="sm" color="white" /> : "Sign In to Console"}
      </button>
    </form>
  );
};
