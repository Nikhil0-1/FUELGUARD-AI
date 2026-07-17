import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { toast } from 'react-hot-toast';

export const ForgotPassword = ({ onBackToLogin }) => {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email);
      toast.success("Password reset instructions sent to your email.");
      onBackToLogin();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to send reset link.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center pb-2">
        <h3 className="text-lg font-bold font-display text-text-primary">Reset Password</h3>
        <p className="text-xs text-text-secondary mt-1">
          Enter your email and we'll send you instructions to reset your password.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="reset-email">
          Email Address
        </label>
        <input
          id="reset-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          placeholder="admin@fuelguard.ai"
          disabled={submitting}
        />
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="btn-gold w-full flex items-center justify-center gap-2"
        >
          {submitting ? <LoadingSpinner size="sm" color="white" /> : "Send Reset Link"}
        </button>

        <button
          type="button"
          onClick={onBackToLogin}
          className="btn-ghost w-full text-xs font-semibold"
          disabled={submitting}
        >
          Back to Sign In
        </button>
      </div>
    </form>
  );
};
