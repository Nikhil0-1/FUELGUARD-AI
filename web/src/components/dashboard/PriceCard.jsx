import React from 'react';
import { AnimatedCard } from '../common/AnimatedCard';
import { RiMoneyDollarCircleLine } from 'react-icons/ri';
import { formatCurrency } from '../../utils/formatters';

export const PriceCard = ({ cost }) => {
  return (
    <AnimatedCard className="border-l-4 border-l-success">
      <div className="flex justify-between items-start">
        <div>
          <span className="stat-label block">Fuel Session Cost</span>
          <span className="stat-value block mt-2 text-text-primary">
            {formatCurrency(cost)}
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-success-light text-success flex items-center justify-center">
          <RiMoneyDollarCircleLine size={22} />
        </div>
      </div>
    </AnimatedCard>
  );
};
