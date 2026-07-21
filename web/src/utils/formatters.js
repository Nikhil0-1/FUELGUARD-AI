export const formatCurrency = (value, currencySymbol = '₹') => {
  if (isNaN(value) || value === null) return `${currencySymbol}0.00`;
  return `${currencySymbol}${parseFloat(value).toFixed(2)}`;
};

export const formatVolume = (value, unit = 'L') => {
  if (isNaN(value) || value === null) return `0.00 ${unit}`;
  return `${parseFloat(value).toFixed(2)} ${unit}`;
};

const normalizeTimestamp = (ts) => {
  if (!ts) return null;
  const num = Number(ts);
  if (isNaN(num)) return null;
  // If timestamp is less than Year 2001 (1,000,000,000 seconds), it's a boot-time fallback, use current client time
  if (num < 1000000000) {
    return Date.now();
  }
  // If timestamp is in seconds (< 100 billion), convert to milliseconds
  return num < 1e11 ? num * 1000 : num;
};

export const formatDate = (timestamp) => {
  const tsMs = normalizeTimestamp(timestamp);
  if (!tsMs) return '—';
  const date = new Date(tsMs);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatTime = (timestamp) => {
  const tsMs = normalizeTimestamp(timestamp);
  if (!tsMs) return '—';
  const date = new Date(tsMs);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const formatDateTime = (timestamp) => {
  const tsMs = normalizeTimestamp(timestamp);
  if (!tsMs) return '—';
  return `${formatDate(tsMs)} ${formatTime(tsMs)}`;
};

export const formatDuration = (seconds) => {
  if (isNaN(seconds) || seconds === null) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
};
