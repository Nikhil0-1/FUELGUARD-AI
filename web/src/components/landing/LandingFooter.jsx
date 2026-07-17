import React from 'react';
import { Link } from 'react-router-dom';

export const LandingFooter = () => {
  return (
    <footer className="bg-text-primary text-white py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-luxury-gold flex items-center justify-center text-white font-bold font-display shadow-gold">
            FG
          </div>
          <span className="text-lg font-bold font-display tracking-tight">
            FuelGuard <span className="text-luxury-gold">AI</span>
          </span>
        </div>
        
        <p className="text-xs text-text-muted">
          &copy; {new Date().getFullYear()} FuelGuard AI. All rights reserved. Commercial IoT Solutions.
        </p>

        <div className="flex items-center gap-6">
          <Link to="/login" className="text-xs font-semibold text-luxury-gold hover:underline">
            Console Access
          </Link>
          <a href="#features" className="text-xs text-text-muted hover:text-white transition-colors">
            Features
          </a>
        </div>
      </div>
    </footer>
  );
};
