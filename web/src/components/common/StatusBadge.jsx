import React from 'react';

export const StatusBadge = ({ status }) => {
  const getStyles = () => {
    switch (status?.toLowerCase()) {
      case 'online':
      case 'completed':
      case 'filling':
      case 'active':
        return 'bg-success-light text-success border-success/10';
      case 'waiting':
      case 'reconnecting':
      case 'pending':
        return 'bg-warning-light text-warning border-warning/10';
      case 'offline':
      case 'error':
      case 'sensor error':
      case 'cloud offline':
      case 'disabled':
        return 'bg-danger-light text-danger border-danger/10';
      default:
        return 'bg-russian-white text-text-secondary border-border-light';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${getStyles()}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {status || 'Unknown'}
    </span>
  );
};
