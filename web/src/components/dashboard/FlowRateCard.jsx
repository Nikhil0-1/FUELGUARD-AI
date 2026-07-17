import React from 'react';
import { AnimatedCard } from '../common/AnimatedCard';
import { RiDashboard3Line } from 'react-icons/ri';

export const FlowRateCard = ({ rate }) => {
  return (
    <AnimatedCard className="border-l-4 border-l-soft-blue">
      <div className="flex justify-between items-start">
        <div>
          <span className="stat-label block">Flow Delivery Rate</span>
          <span className="stat-value block mt-2 text-text-primary">
            {parseFloat(rate).toFixed(2)} <span className="text-sm font-medium text-text-secondary">L/min</span>
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-soft-blue/10 text-soft-blue flex items-center justify-center">
          <RiDashboard3Line size={22} />
        </div>
      </div>
    </AnimatedCard>
  );
};
