import { useState } from 'react';
import { ref, set, remove, update } from 'firebase/database';
import { db } from '../config/firebase';

export const useDevices = () => {
  const [actionLoading, setActionLoading] = useState(false);

  const addDevice = async (deviceId, deviceData) => {
    setActionLoading(true);
    try {
      // Set parameters inside database paths
      await set(ref(db, `FuelGuardAI/Devices/${deviceId}`), {
        name: deviceData.name || "New Device",
        vehicleId: deviceData.vehicleId || "VH-UNASSIGNED",
        location: deviceData.location || "Bay 1",
        enabled: true,
        firmwareVersion: deviceData.firmwareVersion || "1.0.0",
        wifiStrength: 0,
        lastSeen: Date.now(),
        status: 'offline',
        calibrationFactor: deviceData.calibrationFactor || 7.5
      });
      
      // Initialize configuration path
      await set(ref(db, `FuelGuardAI/Devices/${deviceId}/config`), {
        reportInterval: 1000,
        calibrationMode: false
      });
    } finally {
      setActionLoading(false);
    }
  };

  const updateDevice = async (deviceId, fields) => {
    setActionLoading(true);
    try {
      await update(ref(db, `FuelGuardAI/Devices/${deviceId}`), fields);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteDevice = async (deviceId) => {
    setActionLoading(true);
    try {
      await remove(ref(db, `FuelGuardAI/Devices/${deviceId}`));
      await remove(ref(db, `FuelGuardAI/LiveData/${deviceId}`));
    } finally {
      setActionLoading(false);
    }
  };

  const triggerDeviceCommand = async (deviceId, actionStr) => {
    setActionLoading(true);
    try {
      await set(ref(db, `FuelGuardAI/Devices/${deviceId}/commands`), {
        action: actionStr,
        timestamp: Date.now()
      });
    } finally {
      setActionLoading(false);
    }
  };

  return {
    addDevice,
    updateDevice,
    deleteDevice,
    triggerDeviceCommand,
    actionLoading
  };
};
