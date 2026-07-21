import React, { useContext, useState } from 'react';
import { DataContext } from '../contexts/DataContext';
import { LiveFuelCard } from '../components/dashboard/LiveFuelCard';
import { PriceCard } from '../components/dashboard/PriceCard';
import { FlowRateCard } from '../components/dashboard/FlowRateCard';
import { StatusCard } from '../components/dashboard/StatusCard';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { ref, set } from 'firebase/database';
import { db } from '../config/firebase';
import { RiBaseStationLine, RiLockLine, RiLockUnlockLine, RiShieldCheckLine } from 'react-icons/ri';

export default function DashboardPage() {
  const { liveData, devices, notifications, loading, isMock, writeMockData } = useContext(DataContext);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [lockingInProgress, setLockingInProgress] = useState(false);

  const deviceIds = Object.keys(devices);
  const activeDeviceId = selectedDeviceId || deviceIds[0] || '';
  const currentLive = liveData[activeDeviceId] || {
    flowRate: 0,
    totalLitres: 0,
    fuelCost: 0,
    pulseCount: 0,
    averageFlow: 0,
    duration: 0,
    status: 'Waiting',
    timestamp: Date.now()
  };
  const activeDeviceDetails = devices[activeDeviceId] || { name: 'No Configured Node' };

  // Calculate dynamic online state based on device status & heartbeat timestamp window
  const rawLastSeen = activeDeviceDetails.lastSeen || 0;
  const lastSeenMs = rawLastSeen < 1e11 ? rawLastSeen * 1000 : rawLastSeen;
  
  const rawLiveTs = currentLive.timestamp || 0;
  const liveTsMs = rawLiveTs < 1e11 ? rawLiveTs * 1000 : rawLiveTs;

  const isHardwareOnline = 
    activeDeviceDetails.status === 'online' ||
    (lastSeenMs > 0 && Math.abs(Date.now() - lastSeenMs) < 120000) ||
    (liveTsMs > 0 && Math.abs(Date.now() - liveTsMs) < 120000);

  const displayStatus = activeDeviceDetails.lockStatus 
    ? 'Locked' 
    : (isHardwareOnline ? (currentLive.status || 'Online') : 'Offline');

  const handleToggleLock = async () => {
    if (!activeDeviceId || lockingInProgress) return;
    setLockingInProgress(true);
    const currentLockStatus = activeDeviceDetails.lockStatus || false;
    try {
      if (isMock) {
        const currentDb = JSON.parse(localStorage.getItem('fg_mock_db') || '{}');
        const targetDev = currentDb.Devices?.[activeDeviceId];
        if (targetDev) {
          targetDev.lockStatus = !currentLockStatus;
          writeMockData('Devices', null, { ...currentDb.Devices, [activeDeviceId]: targetDev });
        }
      } else {
        // Set value in DB config block
        const lockConfigRef = ref(db, `FuelGuardAI/Devices/${activeDeviceId}/config/lockStatus`);
        await set(lockConfigRef, !currentLockStatus);
        
        // Update lock status directly in device state path
        const lockStateRef = ref(db, `FuelGuardAI/Devices/${activeDeviceId}/lockStatus`);
        await set(lockStateRef, !currentLockStatus);
      }
    } catch (error) {
      console.error("Failed to toggle device lock status:", error);
    } finally {
      setLockingInProgress(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Retrieving real-time feed...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-display tracking-tight text-text-primary">Real-time Monitor</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${isHardwareOnline ? 'bg-success-light text-success border border-success/20' : 'bg-danger-light text-danger border border-danger/20'}`}>
              <span className={`w-2 h-2 rounded-full ${isHardwareOnline ? 'bg-success animate-ping' : 'bg-danger'}`} />
              {isHardwareOnline ? 'CLOUD ONLINE' : 'HARDWARE OFFLINE'}
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">Live telemetry sync from edge YF-S201 sensors</p>
        </div>

        {/* Device selector */}
        {deviceIds.length > 0 && (
          <div className="flex items-center gap-2 bg-card-white border border-border-light/60 px-4 py-2.5 rounded-xl shadow-nav">
            <RiBaseStationLine size={18} className="text-luxury-gold" />
            <select
              value={activeDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer text-text-primary"
            >
              {deviceIds.map(id => (
                <option key={id} value={id}>
                  {devices[id].name || id} ({id})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <LiveFuelCard value={currentLive.totalLitres} />
        <PriceCard cost={currentLive.fuelCost} />
        <FlowRateCard rate={currentLive.flowRate} />
        <StatusCard status={displayStatus} lastUpdated={lastSeenMs} />
      </div>

      {/* Analytics & Transactions grid layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Real-time status list */}
        <div className="xl:col-span-2">
          <RecentTransactions activeDeviceId={activeDeviceId} />
        </div>

        {/* Diagnostics & Security side columns */}
        <div className="space-y-8">
          {/* System Diagnostics panel */}
          <div className="card space-y-6">
            <h3 className="text-lg font-bold font-display pb-3 border-b border-border-light/50">Device Diagnostics</h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary font-medium">Node ID</span>
                <span className="font-bold text-text-primary font-display">{activeDeviceId || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-medium">Location</span>
                <span className="font-semibold text-text-primary">{activeDeviceDetails.location || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-medium">WiFi Signal RSSI</span>
                <span className={`font-bold ${activeDeviceDetails.wifiStrength > -60 ? 'text-success' : 'text-warning'}`}>
                  {activeDeviceDetails.wifiStrength ? `${activeDeviceDetails.wifiStrength} dBm` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-medium">Calibration Factor</span>
                <span className="font-bold text-luxury-gold font-display">{activeDeviceDetails.calibrationFactor || '7.50'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-medium">Average Flow Rate</span>
                <span className="font-semibold text-text-primary font-display">{currentLive.averageFlow || 0} L/m</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-text-secondary font-medium">Valve Lock State</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${activeDeviceDetails.lockStatus ? 'bg-rose-50 text-rose-700' : 'bg-success-light text-success'}`}>
                  {activeDeviceDetails.lockStatus ? 'Secured & Locked' : 'Unlocked (Active)'}
                </span>
              </div>
            </div>

            {/* Lock Trigger Switch */}
            {activeDeviceId && (
              <button
                onClick={handleToggleLock}
                disabled={lockingInProgress}
                className={`w-full mt-2 py-2.5 px-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border flex items-center justify-center gap-2 ${
                  activeDeviceDetails.lockStatus
                    ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                    : 'bg-success-light border-success/20 text-success hover:bg-success-light/80'
                }`}
              >
                {activeDeviceDetails.lockStatus ? (
                  <>
                    <RiLockUnlockLine size={18} />
                    Unlock Fuel Valve
                  </>
                ) : (
                  <>
                    <RiLockLine size={18} />
                    Secure Lock Valve Node
                  </>
                )}
              </button>
            )}
          </div>

          {/* Security Alerts Live Panel */}
          <div className="card space-y-4">
            <h3 className="text-lg font-bold font-display pb-3 border-b border-border-light/50 flex items-center justify-between">
              <span>Security & Event Alerts</span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
              </span>
            </h3>
            
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-sm text-text-secondary flex flex-col items-center gap-2">
                  <RiShieldCheckLine size={32} className="text-success opacity-60" />
                  <div>
                    <p className="font-semibold text-success">System Secure</p>
                    <p className="text-xs text-text-secondary mt-0.5">No security threats detected</p>
                  </div>
                </div>
              ) : (
                notifications.slice(0, 5).map((notif) => {
                  const isTheft = notif.type === 'THEFT_ALERT';
                  return (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-xl border text-xs flex flex-col gap-1.5 transition-all duration-300 ${
                        isTheft
                          ? 'bg-rose-50/50 border-rose-100 text-rose-800'
                          : 'bg-blue-50/50 border-blue-100 text-blue-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{isTheft ? '⚠️ SECURITY THEFT' : '⛽ SYSTEM EVENT'}</span>
                        <span className="opacity-70 font-normal">
                          {new Date(notif.timestamp * 1000).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="font-medium text-text-primary">{notif.message}</p>
                      <div className="text-[10px] opacity-60">Node: {notif.deviceId}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
