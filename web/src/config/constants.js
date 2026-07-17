export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer'
};

export const DEVICE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  ERROR: 'error'
};

export const TRANSACTION_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  CANCELLED: 'cancelled'
};

export const NOTIFICATION_TYPES = {
  FUEL_STARTED: 'FUEL_STARTED',
  FUEL_COMPLETED: 'FUEL_COMPLETED',
  SENSOR_ERROR: 'SENSOR_ERROR',
  WIFI_LOST: 'WIFI_LOST',
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
  DEVICE_ONLINE: 'DEVICE_ONLINE',
  PRICE_CHANGED: 'FUEL_PRICE_CHANGED',
  CALIBRATION_CHANGED: 'CALIBRATION_CHANGED'
};

export const SYSTEM_THEMES = {
  DEFAULT: 'default',
  GOLD: 'gold',
  BLUE: 'blue'
};

export const DEFAULTS = {
  FUEL_PRICE: 106.31,
  CURRENCY: 'INR',
  CURRENCY_SYMBOL: '₹',
  UNITS: 'litres'
};
