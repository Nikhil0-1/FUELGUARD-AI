import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../contexts/DataContext';
import { useAuth } from '../hooks/useAuth';
import { useDevices } from '../hooks/useDevices';
import { logActivity } from '../services/logService';
import { db } from '../config/firebase';
import { ref, update, get, set, remove, serverTimestamp } from 'firebase/database';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { toast } from 'react-hot-toast';
import { 
  RiHammerLine, 
  RiUserSettingsLine, 
  RiCpuLine, 
  RiMoneyDollarCircleLine, 
  RiDatabaseLine,
  RiWifiLine,
  RiRestartLine,
  RiCloseLine
} from 'react-icons/ri';

export default function AdminPage() {
  const { globalSettings, devices, loading, isMock, writeMockData } = useContext(DataContext);
  const { isSuperAdmin, currentUser } = useAuth();
  const { addDevice, updateDevice, deleteDevice, triggerDeviceCommand } = useDevices();
  
  const [activeTab, setActiveTab] = useState('price'); // 'price', 'calibration', 'devices', 'users', 'logs'
  const [submitting, setSubmitting] = useState(false);

  // Price States
  const [fuelPrice, setFuelPrice] = useState('');
  const [priceHistory, setPriceHistory] = useState([]);

  // Calibration States
  const [activeCalFactor, setActiveCalFactor] = useState('');
  const [calDeviceId, setCalDeviceId] = useState('');

  // Device CRUD States
  const [newDevId, setNewDevId] = useState('');
  const [newDevName, setNewDevName] = useState('');
  const [newDevLoc, setNewDevLoc] = useState('');
  const [newDevVeh, setNewDevVeh] = useState('');
  const [newDevCal, setNewDevCal] = useState('7.5');

  // User States
  const [usersList, setUsersList] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('operator');
  const [newUserName, setNewUserName] = useState('');

  // Logs States
  const [logsList, setLogsList] = useState([]);

  const currentPrice = globalSettings?.fuelPrice?.current || 106.31;

  useEffect(() => {
    // Populate price inputs from context
    if (globalSettings?.fuelPrice?.current) {
      setFuelPrice(globalSettings.fuelPrice.current.toString());
    }

    if (globalSettings?.fuelPrice?.history) {
      const arr = Object.entries(globalSettings.fuelPrice.history)
        .map(([id, val]) => ({ id, ...val }))
        .sort((a, b) => b.timestamp - a.timestamp);
      setPriceHistory(arr);
    }
  }, [globalSettings]);

  // Load Admin Data: Users & Logs list
  const fetchAdminData = async () => {
    if (isMock) {
      const currentDb = JSON.parse(localStorage.getItem('fg_mock_db') || '{}');
      
      const usersArr = Object.entries(currentDb.Users || {}).map(([uid, val]) => ({ uid, ...val }));
      setUsersList(usersArr);
      
      const logsArr = Object.values(currentDb.Logs || {})
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50);
      setLogsList(logsArr);
      return;
    }

    try {
      // 1. Fetch Users
      const usersRef = ref(db, 'FuelGuardAI/Users');
      const usersSnap = await get(usersRef);
      if (usersSnap.exists()) {
        const arr = Object.entries(usersSnap.val()).map(([uid, val]) => ({ uid, ...val }));
        setUsersList(arr);
      }

      // 2. Fetch Activity Logs
      const logsRef = ref(db, 'FuelGuardAI/Logs');
      const logsSnap = await get(logsRef);
      if (logsSnap.exists()) {
        const arr = Object.entries(logsSnap.val())
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 50);
        setLogsList(arr);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'logs') {
      fetchAdminData();
    }
  }, [activeTab]);

  const addMockLog = (action, details) => {
    try {
      const currentDb = JSON.parse(localStorage.getItem('fg_mock_db') || '{}');
      const currentLogs = currentDb.Logs || [];
      const newLog = {
        id: "log_" + Date.now(),
        action,
        userId: currentUser?.uid || "MOCK_ADMIN_UID",
        details,
        timestamp: Date.now()
      };
      writeMockData('Logs', null, [newLog, ...currentLogs]);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Fuel Price Update
  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error("Only Super Admins can alter financial settings.");
      return;
    }
    const val = parseFloat(fuelPrice);
    if (isNaN(val) || val <= 0) {
      toast.error("Enter a valid price parameter.");
      return;
    }

    setSubmitting(true);
    try {
      if (isMock) {
        const currentDb = JSON.parse(localStorage.getItem('fg_mock_db') || '{}');
        const currentSettings = currentDb.Settings || {};
        if (!currentSettings.fuelPrice) currentSettings.fuelPrice = { current: 106.31, history: {} };
        
        currentSettings.fuelPrice.current = val;
        const timestamp = Date.now();
        if (!currentSettings.fuelPrice.history) currentSettings.fuelPrice.history = {};
        currentSettings.fuelPrice.history[timestamp.toString()] = {
          price: val,
          setBy: currentUser?.uid || "MOCK_ADMIN_UID",
          timestamp
        };
        writeMockData('Settings', null, currentSettings);
        addMockLog("FUEL_PRICE_CHANGED", `Fuel price changed from ₹${currentPrice} to ₹${val}`);
      } else {
        const settingsRef = ref(db, 'FuelGuardAI/Settings/fuelPrice');
        const histRef = ref(db, `FuelGuardAI/Settings/fuelPrice/history/${Date.now()}`);
        await set(histRef, {
          price: val,
          setBy: currentUser.uid,
          timestamp: Date.now()
        });
        await update(settingsRef, { current: val });
        await logActivity(
          "FUEL_PRICE_CHANGED",
          currentUser.uid,
          `Fuel price changed from ₹${currentPrice} to ₹${val}`
        );
      }
      toast.success("Fuel price successfully updated.");
    } catch (err) {
      console.error(err);
      toast.error("Price update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Calibration Save
  const handleSaveCalibration = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error("Only Super Admins can calibrate sensors.");
      return;
    }
    if (!calDeviceId) {
      toast.error("Select a target controller node.");
      return;
    }
    const factorVal = parseFloat(activeCalFactor);
    if (isNaN(factorVal) || factorVal <= 0.1 || factorVal > 30.0) {
      toast.error("Enter a valid calibration factor (0.1 - 30).");
      return;
    }

    setSubmitting(true);
    try {
      if (isMock) {
        const currentDb = JSON.parse(localStorage.getItem('fg_mock_db') || '{}');
        const targetDev = currentDb.Devices?.[calDeviceId];
        if (targetDev) {
          targetDev.calibrationFactor = factorVal;
          writeMockData('Devices', null, { ...currentDb.Devices, [calDeviceId]: targetDev });
          addMockLog("CALIBRATION_CHANGED", `Adjusted calibration factor of ${calDeviceId} to ${factorVal}`);
        }
      } else {
        await updateDevice(calDeviceId, { calibrationFactor: factorVal });
        await triggerDeviceCommand(calDeviceId, "syncSettings");
        await logActivity(
          "CALIBRATION_CHANGED",
          currentUser.uid,
          `Adjusted calibration factor of ${calDeviceId} to ${factorVal}`
        );
      }
      toast.success("Calibration settings updated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update calibration factor.");
    } finally {
      setSubmitting(false);
    }
  };

  // Remote Commands
  const handleRemoteCommand = async (deviceId, actionStr) => {
    try {
      if (isMock) {
        toast.success(`Mock command [${actionStr}] simulated on local console.`);
        addMockLog("DEVICE_RESTART", `Simulated remote action [${actionStr}] on node ${deviceId}`);
        return;
      }
      await triggerDeviceCommand(deviceId, actionStr);
      await logActivity(
        "DEVICE_RESTART",
        currentUser.uid,
        `Triggered remote action [${actionStr}] on node ${deviceId}`
      );
      toast.success(`Remote command [${actionStr}] queued.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to deliver remote command.");
    }
  };

  // Handle Add Device
  const handleAddDevice = async (e) => {
    e.preventDefault();
    if (!newDevId.trim() || !newDevName.trim()) {
      toast.error("Please fill in Device ID and Device Name.");
      return;
    }

    setSubmitting(true);
    try {
      if (isMock) {
        const currentDb = JSON.parse(localStorage.getItem('fg_mock_db') || '{}');
        const devPayload = {
          name: newDevName.trim(),
          location: newDevLoc.trim() || 'Bay Main',
          vehicleId: newDevVeh.trim() || 'VH-AUTO',
          calibrationFactor: parseFloat(newDevCal) || 7.5,
          enabled: true,
          firmwareVersion: "1.0.0",
          wifiStrength: -60,
          lastSeen: Date.now(),
          status: 'online',
          lockStatus: false
        };
        const updatedDevices = { ...currentDb.Devices, [newDevId.trim()]: devPayload };
        writeMockData('Devices', null, updatedDevices);
        
        // Seed live data path too
        const updatedLiveData = { 
          ...currentDb.LiveData, 
          [newDevId.trim()]: {
            flowRate: 0,
            totalLitres: 0,
            fuelCost: 0,
            pulseCount: 0,
            averageFlow: 0,
            duration: 0,
            status: "Waiting",
            timestamp: Date.now()
          } 
        };
        writeMockData('LiveData', null, updatedLiveData);
        addMockLog("USER_ADDED", `Added new controller node registration ${newDevId}`);
      } else {
        await addDevice(newDevId.trim(), {
          name: newDevName.trim(),
          location: newDevLoc.trim() || 'Bay Main',
          vehicleId: newDevVeh.trim() || 'VH-AUTO',
          calibrationFactor: parseFloat(newDevCal) || 7.5
        });
        await logActivity(
          "USER_ADDED",
          currentUser.uid,
          `Added new controller node registration ${newDevId}`
        );
      }
      toast.success("Device successfully registered.");
      setNewDevId('');
      setNewDevName('');
      setNewDevLoc('');
      setNewDevVeh('');
    } catch (err) {
      console.error(err);
      toast.error("Failed to register node.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Device
  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm("Delete this device? Hardware metrics data will clear.")) {
      return;
    }

    try {
      if (isMock) {
        const currentDb = JSON.parse(localStorage.getItem('fg_mock_db') || '{}');
        const updatedDevices = { ...currentDb.Devices };
        delete updatedDevices[deviceId];
        writeMockData('Devices', null, updatedDevices);

        const updatedLiveData = { ...currentDb.LiveData };
        delete updatedLiveData[deviceId];
        writeMockData('LiveData', null, updatedLiveData);
        addMockLog("USER_DELETED", `Unregistered controller node ${deviceId}`);
      } else {
        await deleteDevice(deviceId);
        await logActivity(
          "USER_DELETED",
          currentUser.uid,
          `Unregistered controller node ${deviceId}`
        );
      }
      toast.success("Device unregistered.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete device.");
    }
  };

  // Add User Operator
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserName.trim()) {
      toast.error("Email and Name are required.");
      return;
    }

    setSubmitting(true);
    try {
      if (isMock) {
        const mockUid = "USER_" + Math.random().toString(36).substring(2, 9).toUpperCase();
        const currentDb = JSON.parse(localStorage.getItem('fg_mock_db') || '{}');
        const updatedUsers = {
          ...currentDb.Users,
          [mockUid]: {
            email: newUserEmail.trim(),
            displayName: newUserName.trim(),
            role: newUserRole,
            enabled: true,
            createdAt: Date.now()
          }
        };
        writeMockData('Users', null, updatedUsers);
        addMockLog("USER_ADDED", `Created database credential profile for user: ${newUserEmail}`);
      } else {
        const mockUid = "USER_" + Math.random().toString(36).substring(2, 9).toUpperCase();
        const userRef = ref(db, `FuelGuardAI/Users/${mockUid}`);
        await set(userRef, {
          email: newUserEmail.trim(),
          displayName: newUserName.trim(),
          role: newUserRole,
          enabled: true,
          createdAt: Date.now()
        });
        await logActivity(
          "USER_ADDED",
          currentUser.uid,
          `Created database credential profile for user: ${newUserEmail}`
        );
      }
      toast.success("User access profile registered.");
      setNewUserEmail('');
      setNewUserName('');
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add user profile.");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle User Profile Active state
  const handleToggleUser = async (uid, currentEnabled) => {
    try {
      if (isMock) {
        const currentDb = JSON.parse(localStorage.getItem('fg_mock_db') || '{}');
        if (currentDb.Users?.[uid]) {
          currentDb.Users[uid].enabled = !currentEnabled;
          writeMockData('Users', null, currentDb.Users);
        }
      } else {
        const userRef = ref(db, `FuelGuardAI/Users/${uid}`);
        await update(userRef, { enabled: !currentEnabled });
      }
      toast.success("User status changed.");
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle status.");
    }
  };

  if (loading) {
    return <div className="text-center py-12">Retrieving administrative permissions...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight text-text-primary">Admin Control Panel</h1>
        <p className="text-sm text-text-secondary mt-1">Configure database pricing parameters, sensor factors, and manage devices</p>
      </div>

      {/* Tabs Menu Selector */}
      <div className="flex border-b border-border-light/60 gap-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('price')}
          className={`pb-2.5 text-sm font-bold border-b-2 px-1 transition-all ${
            activeTab === 'price' ? 'border-luxury-gold text-luxury-gold' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Fuel Price Config
        </button>
        <button
          onClick={() => setActiveTab('calibration')}
          className={`pb-2.5 text-sm font-bold border-b-2 px-1 transition-all ${
            activeTab === 'calibration' ? 'border-luxury-gold text-luxury-gold' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Sensor Calibration
        </button>
        <button
          onClick={() => setActiveTab('devices')}
          className={`pb-2.5 text-sm font-bold border-b-2 px-1 transition-all ${
            activeTab === 'devices' ? 'border-luxury-gold text-luxury-gold' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Device Profiles
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2.5 text-sm font-bold border-b-2 px-1 transition-all ${
            activeTab === 'users' ? 'border-luxury-gold text-luxury-gold' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          User Roles
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-2.5 text-sm font-bold border-b-2 px-1 transition-all ${
            activeTab === 'logs' ? 'border-luxury-gold text-luxury-gold' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          System Activity Logs
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        
        {/* TAB 1: Fuel Price Settings */}
        {activeTab === 'price' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="card space-y-4 lg:col-span-1">
              <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b pb-3">
                <RiMoneyDollarCircleLine className="text-luxury-gold" size={20} />
                Set Fuel price
              </h3>
              
              <form onSubmit={handleUpdatePrice} className="space-y-4">
                <div>
                  <label className="label">Current Fuel Price (INR / L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(e.target.value)}
                    className="input-field"
                    placeholder="106.31"
                    disabled={submitting}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submitting || !isSuperAdmin}
                  className="btn-gold w-full text-xs"
                >
                  Apply Updated Price
                </button>
                {!isSuperAdmin && (
                  <p className="text-xs text-danger font-medium">Read-only: requires Super Admin privileges.</p>
                )}
              </form>
            </div>

            <div className="card lg:col-span-2 space-y-4">
              <h3 className="text-lg font-bold font-display">Fuel Pricing Update History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="table-header">Timestamp Date</th>
                      <th className="table-header">Registered Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceHistory.map(p => (
                      <tr key={p.id} className="table-row">
                        <td className="table-cell">{formatDateTime(p.timestamp)}</td>
                        <td className="table-cell font-bold text-luxury-gold font-display">{formatCurrency(p.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Calibration Manager */}
        {activeTab === 'calibration' && (
          <div className="card space-y-6 max-w-xl">
            <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b pb-3">
              <RiHammerLine className="text-luxury-gold" size={20} />
              Sensor Pulse Calibration
            </h3>

            <form onSubmit={handleSaveCalibration} className="space-y-4">
              <div>
                <label className="label">Select Target Node</label>
                <select
                  value={calDeviceId}
                  onChange={(e) => setCalDeviceId(e.target.value)}
                  className="select-field text-sm"
                >
                  <option value="">Choose device...</option>
                  {Object.keys(devices).map(id => (
                    <option key={id} value={id}>{devices[id].name || id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Calibration Factor (Nominal: 7.50)</label>
                <input
                  type="number"
                  step="0.01"
                  value={activeCalFactor}
                  onChange={(e) => setActiveCalFactor(e.target.value)}
                  className="input-field"
                  placeholder="7.50"
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || !isSuperAdmin}
                  className="btn-gold flex-1 text-xs"
                >
                  Apply to Device
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoteCommand(calDeviceId, "startCalibration")}
                  disabled={!calDeviceId}
                  className="btn-outline flex-1 text-xs"
                >
                  Start Calibration Mode
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoteCommand(calDeviceId, "stopCalibration")}
                  disabled={!calDeviceId}
                  className="btn-outline flex-1 text-xs text-danger border-red-200 hover:border-red-400"
                >
                  Stop Calibration Mode
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: Device Configurations */}
        {activeTab === 'devices' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="card space-y-4">
              <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b pb-3">
                <RiCpuLine className="text-luxury-gold" size={20} />
                Register New Node
              </h3>
              
              <form onSubmit={handleAddDevice} className="space-y-4">
                <div>
                  <label className="label">Device MAC/Hardware ID</label>
                  <input
                    type="text"
                    value={newDevId}
                    onChange={(e) => setNewDevId(e.target.value)}
                    className="input-field"
                    placeholder="DEVICE_ESP001"
                  />
                </div>
                <div>
                  <label className="label">Display Name</label>
                  <input
                    type="text"
                    value={newDevName}
                    onChange={(e) => setNewDevName(e.target.value)}
                    className="input-field"
                    placeholder="Bay Station Alpha"
                  />
                </div>
                <div>
                  <label className="label">Installed Location</label>
                  <input
                    type="text"
                    value={newDevLoc}
                    onChange={(e) => setNewDevLoc(e.target.value)}
                    className="input-field"
                    placeholder="Bay 1"
                  />
                </div>
                <div>
                  <label className="label">Assigned Vehicle ID</label>
                  <input
                    type="text"
                    value={newDevVeh}
                    onChange={(e) => setNewDevVeh(e.target.value)}
                    className="input-field"
                    placeholder="VH-129"
                  />
                </div>
                <div>
                  <label className="label">Calibration Factor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newDevCal}
                    onChange={(e) => setNewDevCal(e.target.value)}
                    className="input-field"
                    placeholder="7.5"
                  />
                </div>

                <button type="submit" className="btn-gold w-full text-xs">
                  Register Node Profile
                </button>
              </form>
            </div>

            <div className="card xl:col-span-2 space-y-4">
              <h3 className="text-lg font-bold font-display">Active Controller Nodes</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-header">Device ID</th>
                      <th className="table-header">Label</th>
                      <th className="table-header">Location</th>
                      <th className="table-header">Hardware Details</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(devices).map(([id, dev]) => (
                      <tr key={id} className="table-row">
                        <td className="table-cell font-mono text-xs">{id}</td>
                        <td className="table-cell font-semibold">{dev.name}</td>
                        <td className="table-cell">{dev.location}</td>
                        <td className="table-cell">
                          <div className="flex flex-col gap-0.5 text-xs text-text-secondary">
                            <span>FW: {dev.firmwareVersion || '1.0.0'}</span>
                            <span className="flex items-center gap-1">
                              <RiWifiLine /> {dev.wifiStrength || 0} dBm
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <StatusBadge status={dev.status} />
                        </td>
                        <td className="table-cell">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRemoteCommand(id, "restart")}
                              className="p-1 rounded bg-russian-white hover:bg-luxury-gold/10 text-luxury-gold"
                              title="Restart ESP Module"
                            >
                              <RiRestartLine size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteDevice(id)}
                              className="p-1 rounded bg-red-50 hover:bg-red-100 text-danger"
                              title="Delete Registration"
                            >
                              <RiCloseLine size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: User Administration */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="card space-y-4">
              <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b pb-3">
                <RiUserSettingsLine className="text-luxury-gold" size={20} />
                Add User Role
              </h3>
              
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="input-field"
                    placeholder="Vikram Singh"
                  />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="input-field"
                    placeholder="vikram@fuelguard.ai"
                  />
                </div>
                <div>
                  <label className="label">System Privilege Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="select-field text-sm"
                  >
                    <option value="operator">Operator (Edit transactions)</option>
                    <option value="admin">Admin (Edit devices)</option>
                    <option value="viewer">Viewer (Read charts)</option>
                  </select>
                </div>

                <button type="submit" className="btn-gold w-full text-xs">
                  Create User Account
                </button>
              </form>
            </div>

            <div className="card xl:col-span-2 space-y-4">
              <h3 className="text-lg font-bold font-display">Authorized Platform Users</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-header">Display Name</th>
                      <th className="table-header">Email</th>
                      <th className="table-header">Assigned Role</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.uid} className="table-row">
                        <td className="table-cell font-semibold">{u.displayName}</td>
                        <td className="table-cell">{u.email}</td>
                        <td className="table-cell">
                          <span className="uppercase text-xs font-bold text-luxury-gold tracking-widest">{u.role}</span>
                        </td>
                        <td className="table-cell">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                            u.enabled ? 'bg-success-light text-success' : 'bg-red-50 text-danger'
                          }`}>
                            {u.enabled ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="table-cell">
                          <button
                            onClick={() => handleToggleUser(u.uid, u.enabled)}
                            className={`text-xs font-bold ${u.enabled ? 'text-danger' : 'text-success'}`}
                          >
                            {u.enabled ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Activity Logs */}
        {activeTab === 'logs' && (
          <div className="card space-y-4">
            <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b pb-3">
              <RiDatabaseLine className="text-luxury-gold" size={20} />
              Administrative Activity Logs
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-header">Date & Time</th>
                    <th className="table-header">Action Code</th>
                    <th className="table-header">User</th>
                    <th className="table-header">Audit Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logsList.map(l => (
                    <tr key={l.id} className="table-row">
                      <td className="table-cell whitespace-nowrap">{formatDateTime(l.timestamp)}</td>
                      <td className="table-cell">
                        <span className="bg-russian-white text-text-primary px-2 py-0.5 rounded font-mono text-xs font-bold uppercase">
                          {l.action}
                        </span>
                      </td>
                      <td className="table-cell font-mono text-xs">{l.userId.slice(0, 10)}...</td>
                      <td className="table-cell">{l.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
