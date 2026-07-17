import React from 'react';
import { AnimatedCard } from '../common/AnimatedCard';
import { StatusBadge } from '../common/StatusBadge';
import { formatTime } from '../../utils/formatters';

export const StatusCard = ({ status, lastUpdated }) => {
  return (
    <AnimatedCard className="border-l-4 border-l-warning">
      <div className="flex flex-col justify-between h-full">
        <div>
          <span className="stat-label block">Controller Status</span>
          <div className="mt-2.5">
            <StatusBadge status={status || 'Idle'} />
          </div>
        </div>
        <span className="text-xs text-text-muted mt-4 block">
          Last Signal: {formatTime(lastUpdated)}
        </span>
      </div>
    </AnimatedCard>
  );
};
