import React, { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { ForgotPassword } from '../components/auth/ForgotPassword';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [view, setView] = useState('login'); // 'login' or 'forgot'

  return (
    <div className="min-h-screen bg-russian-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-luxury-gold/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-soft-blue/5 blur-[120px] pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="w-12 h-12 rounded-2xl bg-luxury-gold flex items-center justify-center text-white font-bold font-display shadow-gold mx-auto mb-4">
          FG
        </div>
        <h2 className="text-3xl font-bold font-display tracking-tight text-text-primary">
          FuelGuard <span className="text-luxury-gold">AI</span> Console
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Smart Fuel Accuracy & IoT Monitoring Portal
        </p>
      </div>

      {/* Card Body */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <motion.div 
          layout
          className="bg-card-white py-8 px-6 shadow-modal border border-border-light/60 rounded-3xl sm:px-10"
        >
          <AnimatePresence mode="wait">
            {view === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <LoginForm onForgotPassword={() => setView('forgot')} />
              </motion.div>
            ) : (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ForgotPassword onBackToLogin={() => setView('login')} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
