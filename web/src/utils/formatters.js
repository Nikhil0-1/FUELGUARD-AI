export const formatCurrency = (value, currencySymbol = '₹') => {
  if (isNaN(value) || value === null) return `${currencySymbol}0.00`;
  return `${currencySymbol}${parseFloat(value).toFixed(2)}`;
};

export const formatVolume = (value, unit = 'L') => {
  if (isNaN(value) || value === null) return `0.00 ${unit}`;
  return `${parseFloat(value).toFixed(2)} ${unit}`;
};

export const formatDate = (timestamp) => {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatTime = (timestamp) => {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const formatDateTime = (timestamp) => {
  if (!timestamp) return '—';
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`;
};

export const formatDuration = (seconds) => {
  if (isNaN(seconds) || seconds === null) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
};
