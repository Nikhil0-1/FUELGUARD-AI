import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-16 px-6 overflow-hidden">
      {/* Background soft ambient lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-luxury-gold/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-soft-blue/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Info Column */}
        <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-luxury-gold/10 text-luxury-gold-dark font-semibold text-xs uppercase tracking-wider mb-6 border border-luxury-gold/15"
          >
            <span>✨ Introducing FuelGuard AI v1.0</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text-primary leading-[1.1] font-display"
          >
            Smart Fuel Accuracy & <br />
            <span className="gradient-text">IoT Monitoring Platform</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-text-secondary mt-6 max-w-xl text-balance"
          >
            Commercial-grade IoT platform providing real-time accuracy checks, instant calibration mechanisms, and automated metrics log exports to optimize fleet consumption.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto"
          >
            <Link to="/login" className="btn-gold w-full sm:w-auto text-center">
              Access Live Dashboard
            </Link>
            <a href="#features" className="btn-outline w-full sm:w-auto text-center">
              Explore Key Features
            </a>
          </motion.div>
        </div>

        {/* Right Dashboard Mockup Column */}
        <div className="lg:col-span-5 relative flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="w-full max-w-[450px] aspect-[4/5] bg-card-white/70 rounded-3xl border border-border-light/60 p-6 shadow-modal backdrop-blur-md relative"
          >
            {/* Mock Dashboard Header */}
            <div className="flex items-center justify-between border-b border-border-light/50 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-danger" />
                <div className="w-3 h-3 rounded-full bg-warning" />
                <div className="w-3 h-3 rounded-full bg-success" />
              </div>
              <span className="text-xs font-semibold text-text-secondary tracking-widest uppercase">
                Node_01 status
              </span>
            </div>

            {/* Mock Fuel Gauge */}
            <div className="flex flex-col items-center justify-center py-6 relative">
              <div className="w-40 h-40 rounded-full border-[8px] border-russian-white flex flex-col items-center justify-center shadow-inner relative">
                <div className="absolute inset-0 rounded-full border-[8px] border-transparent border-t-luxury-gold border-r-luxury-gold rotate-45" />
                <span className="text-4xl font-extrabold font-display">25.0</span>
                <span className="text-xs font-bold text-text-secondary">Litres</span>
              </div>
              <span className="mt-6 text-sm font-semibold text-success animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success" />
                ACTIVE FUELING SESSION
              </span>
            </div>

            {/* Mock Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-russian-white/50 p-4 rounded-2xl border border-border-light/40">
                <span className="text-xs font-semibold text-text-secondary block">FLOW RATE</span>
                <span className="text-lg font-bold font-display text-text-primary">12.5 L/min</span>
              </div>
              <div className="bg-russian-white/50 p-4 rounded-2xl border border-border-light/40">
                <span className="text-xs font-semibold text-text-secondary block">FUEL COST</span>
                <span className="text-lg font-bold font-display text-text-primary">₹2,657.80</span>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};
