import React, { useEffect, useState } from 'react';
import { ref, get, query, orderByKey, limitToLast } from 'firebase/database';
import { db } from '../../config/firebase';
import { StatusBadge } from '../common/StatusBadge';
import { formatVolume, formatCurrency, formatDateTime } from '../../utils/formatters';

export const RecentTransactions = ({ activeDeviceId }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const transRef = query(ref(db, 'FuelGuardAI/Transactions'), orderByKey(), limitToLast(10));
        const snapshot = await get(transRef);
        if (snapshot.exists()) {
          const raw = snapshot.val();
          // Filter by activeDeviceId if provided
          const array = Object.entries(raw)
            .map(([id, val]) => ({ id, ...val }))
            .filter(t => !activeDeviceId || t.deviceId === activeDeviceId)
            .sort((a, b) => b.startTime - a.startTime);
          setList(array);
        } else {
          setList([]);
        }
      } catch (error) {
        console.error("Failed to read transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [activeDeviceId]);

  if (loading) {
    return <div className="card p-6">Reading transaction log history...</div>;
  }

  return (
    <div className="card">
      <h3 className="text-lg font-bold font-display pb-4 border-b border-border-light/50">
        Recent Fueling Logs
      </h3>

      <div className="overflow-x-auto mt-4">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="table-header">Date/Time</th>
              <th className="table-header">Fuel Volume</th>
              <th className="table-header">Total Cost</th>
              <th className="table-header">Avg Flow</th>
              <th className="table-header">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan="5" className="table-cell text-center text-text-muted py-6">
                  No logged sessions recorded for this node.
                </td>
              </tr>
            ) : (
              list.map(t => (
                <tr key={t.id} className="table-row">
                  <td className="table-cell font-medium">{formatDateTime(t.startTime)}</td>
                  <td className="table-cell font-bold text-luxury-gold-dark font-display">{formatVolume(t.fuel)}</td>
                  <td className="table-cell font-bold text-text-primary font-display">{formatCurrency(t.price)}</td>
                  <td className="table-cell">{parseFloat(t.averageFlow || 0).toFixed(2)} L/m</td>
                  <td className="table-cell">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
