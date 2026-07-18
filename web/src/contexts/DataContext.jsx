import React, { createContext, useState, useEffect, useContext } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../config/firebase';
import { AuthContext } from './AuthContext';

export const DataContext = createContext(null);

const DEFAULT_MOCK_DB = {
  Devices: {
    "DEVICE_ESP8266": {
      name: "Demo Station 1",
      location: "Main Bay Alpha",
      firmwareVersion: "1.0.0",
      wifiStrength: -58,
      calibrationFactor: 7.5,
      lockStatus: false,
      status: "online"
    }
  },
  LiveData: {
    "DEVICE_ESP8266": {
      flowRate: 0,
      totalLitres: 0,
      fuelCost: 0,
      pulseCount: 0,
      averageFlow: 0,
      duration: 0,
      status: "Waiting",
      timestamp: Date.now()
    }
  },
  Settings: {
    fuelPrice: {
      current: 106.31,
      history: {
        "1711200000000": { price: 106.31, timestamp: 1711200000000, setBy: "MOCK_ADMIN" }
      }
    }
  },
  Notifications: [
    { id: "notif_1", type: "DEVICE_ONLINE", message: "Device registered: DEVICE_ESP8266", timestamp: Math.floor(Date.now()/1000) - 300, deviceId: "DEVICE_ESP8266" }
  ],
  Users: {
    "MOCK_ADMIN_UID": {
      email: "admin@fuelguard.ai",
      displayName: "Super Admin",
      role: "superadmin",
      enabled: true
    }
  },
  Logs: [
    { id: "log_1", action: "SYSTEM_BOOT", userId: "MOCK_ADMIN_UID", details: "System initialized", timestamp: Date.now() - 3600000 }
  ],
  Transactions: []
};

export const DataProvider = ({ children }) => {
  const [liveData, setLiveData] = useState({});
  const [devices, setDevices] = useState({});
  const [globalSettings, setGlobalSettings] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const authContext = useContext(AuthContext);
  const currentUser = authContext?.currentUser;
  
  // Determine mock state based on current user session (UID)
  const isMock = currentUser?.uid === 'MOCK_ADMIN_UID';

  // Unified mock write helper
  const writeMockData = (section, key, value) => {
    try {
      const currentDb = JSON.parse(localStorage.getItem('fg_mock_db') || JSON.stringify(DEFAULT_MOCK_DB));
      
      if (!currentDb[section]) currentDb[section] = {};
      
      if (key) {
        currentDb[section][key] = value;
      } else {
        currentDb[section] = value;
      }
      
      localStorage.setItem('fg_mock_db', JSON.stringify(currentDb));
      
      // Update local react states instantly
      if (section === 'Devices') setDevices(currentDb.Devices || {});
      if (section === 'Settings') setGlobalSettings(currentDb.Settings || {});
      if (section === 'LiveData') setLiveData(currentDb.LiveData || {});
      if (section === 'Notifications') {
        const sorted = Object.entries(currentDb.Notifications || {})
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(sorted);
      }
    } catch (e) {
      console.error("Failed to write to mock database:", e);
    }
  };

  useEffect(() => {
    if (isMock) {
      // 1. Initialize Mock Database from localStorage
      let mockDb = localStorage.getItem('fg_mock_db');
      if (!mockDb) {
        localStorage.setItem('fg_mock_db', JSON.stringify(DEFAULT_MOCK_DB));
        mockDb = JSON.stringify(DEFAULT_MOCK_DB);
      }
      
      try {
        const data = JSON.parse(mockDb);
        setLiveData(data.LiveData || {});
        setDevices(data.Devices || {});
        setGlobalSettings(data.Settings || {});
        
        // Notifications list
        const notifArray = Object.values(data.Notifications || {})
          .sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(notifArray);
      } catch (err) {
        console.error("Failed to parse mock database:", err);
      }
      
      setLoading(false);
      return; // Return early, skip Firebase listeners in mock mode
    }

    // 2. Production Firebase listeners
    setLoading(true);
    
    const liveRef = ref(db, 'FuelGuardAI/LiveData');
    const unsubscribeLive = onValue(liveRef, (snapshot) => {
      if (snapshot.exists()) {
        setLiveData(snapshot.val());
      } else {
        setLiveData({});
      }
    }, (err) => {
      console.warn("Live Readings listener error:", err);
    });

    const devicesRef = ref(db, 'FuelGuardAI/Devices');
    const unsubscribeDevices = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        setDevices(snapshot.val());
      } else {
        setDevices({});
      }
    }, (err) => {
      console.warn("Devices status listener error:", err);
    });

    const settingsRef = ref(db, 'FuelGuardAI/Settings');
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setGlobalSettings(snapshot.val());
      } else {
        setGlobalSettings({});
      }
    }, (err) => {
      console.warn("Global settings listener error:", err);
    });

    const notifRef = ref(db, 'FuelGuardAI/Notifications');
    const unsubscribeNotif = onValue(notifRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const sorted = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 50);
        setNotifications(sorted);
      } else {
        setNotifications([]);
      }
      setLoading(false);
    }, (err) => {
      console.warn("Notifications listener error or rules block:", err);
      setLoading(false); // Resolve loading screen block on auth rule failure
    });

    return () => {
      unsubscribeLive();
      unsubscribeDevices();
      unsubscribeSettings();
      unsubscribeNotif();
    };
  }, [isMock, currentUser]);

  const value = {
    liveData,
    devices,
    globalSettings,
    notifications,
    loading,
    isMock,
    writeMockData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
