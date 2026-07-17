import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-russian-white flex flex-col justify-center items-center px-6">
      <div className="text-center space-y-6">
        <h1 className="text-9xl font-extrabold text-luxury-gold tracking-tight font-display animate-pulse-gold rounded-full px-6 py-2">
          404
        </h1>
        <h2 className="text-3xl font-bold font-display text-text-primary mt-4">
          Page Not Found
        </h2>
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          The requested console endpoint was not located. Make sure you possess the proper role configurations.
        </p>
        <div className="pt-4">
          <Link to="/" className="btn-gold">
            Return to Marketing Home
          </Link>
        </div>
      </div>
    </div>
  );
}
