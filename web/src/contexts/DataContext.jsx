import React, { createContext, useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../config/firebase';

export const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [liveData, setLiveData] = useState({});
  const [devices, setDevices] = useState({});
  const [globalSettings, setGlobalSettings] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Live Readings listener
    const liveRef = ref(db, 'FuelGuardAI/LiveData');
    const unsubscribeLive = onValue(liveRef, (snapshot) => {
      if (snapshot.exists()) {
        setLiveData(snapshot.val());
      } else {
        setLiveData({});
      }
    });

    // 2. Devices status listener
    const devicesRef = ref(db, 'FuelGuardAI/Devices');
    const unsubscribeDevices = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        setDevices(snapshot.val());
      } else {
        setDevices({});
      }
    });

    // 3. Global settings listener
    const settingsRef = ref(db, 'FuelGuardAI/Settings');
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setGlobalSettings(snapshot.val());
      } else {
        setGlobalSettings({});
      }
    });

    // 4. Notifications listener (Limit to last 50 for performance)
    const notifRef = ref(db, 'FuelGuardAI/Notifications');
    const unsubscribeNotif = onValue(notifRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Convert to sorted array (newest first)
        const sorted = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 50);
        setNotifications(sorted);
      } else {
        setNotifications([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeLive();
      unsubscribeDevices();
      unsubscribeSettings();
      unsubscribeNotif();
    };
  }, []);

  const value = {
    liveData,
    devices,
    globalSettings,
    notifications,
    loading
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
