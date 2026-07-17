import React from 'react';
import { AnimatedCard } from '../common/AnimatedCard';
import { RiDropLine } from 'react-icons/ri';
import { formatVolume } from '../../utils/formatters';

export const LiveFuelCard = ({ value }) => {
  return (
    <AnimatedCard className="border-l-4 border-l-luxury-gold">
      <div className="flex justify-between items-start">
        <div>
          <span className="stat-label block">Live Fuel Volume</span>
          <span className="stat-value block mt-2 text-text-primary">
            {formatVolume(value)}
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 text-luxury-gold flex items-center justify-center">
          <RiDropLine size={22} className="animate-bounce-subtle" />
        </div>
      </div>
    </AnimatedCard>
  );
};
