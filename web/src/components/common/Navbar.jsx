import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { RiMenuLine, RiUserLine, RiNotification3Line } from 'react-icons/ri';

export const Navbar = ({ onMenuClick }) => {
  const { currentUser, userRole } = useAuth();

  return (
    <header className="bg-card-white h-16 border-b border-border-light/50 flex items-center justify-between px-6 z-10 shadow-nav">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg text-text-secondary hover:bg-russian-white hover:text-text-primary transition-colors"
        >
          <RiMenuLine size={22} />
        </button>
        <h2 className="text-lg font-bold font-display text-text-primary hidden sm:block">
          FuelGuard AI Platform
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Simple Notification Dot */}
        <button className="relative p-2 rounded-xl text-text-secondary hover:bg-russian-white hover:text-text-primary transition-all duration-200">
          <RiNotification3Line size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger" />
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-4 border-l border-border-light/60">
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-sm font-semibold text-text-primary">{currentUser?.email}</span>
            <span className="text-xs font-medium text-luxury-gold uppercase tracking-wider">{userRole}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-luxury-gold/10 text-luxury-gold flex items-center justify-center border border-luxury-gold/10 font-bold">
            <RiUserLine size={18} />
          </div>
        </div>
      </div>
    </header>
  );
};
