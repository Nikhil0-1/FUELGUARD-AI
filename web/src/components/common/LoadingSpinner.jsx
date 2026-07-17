import React from 'react';

export const LoadingSpinner = ({ size = 'md', color = 'gold' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  const colorClasses = {
    gold: 'border-luxury-gold/20 border-t-luxury-gold',
    blue: 'border-soft-blue/20 border-t-soft-blue',
    white: 'border-white/20 border-t-white'
  };

  return (
    <div className="flex items-center justify-center">
      <div 
        className={`rounded-full animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
      />
    </div>
  );
};
