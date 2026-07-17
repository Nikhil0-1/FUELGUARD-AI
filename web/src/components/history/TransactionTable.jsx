import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { formatVolume, formatCurrency, formatDateTime, formatDuration } from '../../utils/formatters';

export const TransactionTable = ({ list, onSelectRow }) => {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="table-header">Transaction ID</th>
              <th className="table-header">Date & Time</th>
              <th className="table-header">Device ID</th>
              <th className="table-header">Fuel Volume</th>
              <th className="table-header">Total Cost</th>
              <th className="table-header">Duration</th>
              <th className="table-header">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan="7" className="table-cell text-center text-text-muted py-8">
                  No transaction records match the filter criteria.
                </td>
              </tr>
            ) : (
              list.map(t => (
                <tr 
                  key={t.id} 
                  onClick={() => onSelectRow(t)}
                  className="table-row"
                >
                  <td className="table-cell font-mono text-xs">{t.id.slice(0, 10)}...</td>
                  <td className="table-cell font-semibold">{formatDateTime(t.startTime)}</td>
                  <td className="table-cell">{t.deviceId}</td>
                  <td className="table-cell font-bold text-luxury-gold-dark font-display">{formatVolume(t.fuel)}</td>
                  <td className="table-cell font-bold text-text-primary font-display">{formatCurrency(t.price)}</td>
                  <td className="table-cell">{formatDuration(t.duration)}</td>
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
