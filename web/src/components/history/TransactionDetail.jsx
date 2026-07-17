import React, { useState } from 'react';
import { ref, update, remove } from 'firebase/database';
import { db } from '../../config/firebase';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { formatVolume, formatCurrency, formatDateTime, formatDuration } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { logActivity } from '../../services/logService';

export const TransactionDetail = ({ transaction, onClose, onRefresh }) => {
  const { isSuperAdmin, currentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!transaction) return null;

  const handleSaveEdit = async () => {
    if (!vehicleId.trim()) {
      toast.error("Vehicle ID is required.");
      return;
    }

    setSubmitting(true);
    try {
      const recordRef = ref(db, `FuelGuardAI/Transactions/${transaction.id}`);
      await update(recordRef, { vehicleId: vehicleId.trim() });
      
      await logActivity(
        "RECORD_EDITED",
        currentUser.uid,
        `Updated vehicle ID of transaction ${transaction.id} to ${vehicleId}`
      );
      
      toast.success("Transaction updated.");
      setEditing(false);
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to edit record.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this transaction? This action is logged.")) {
      return;
    }

    setSubmitting(true);
    try {
      const recordRef = ref(db, `FuelGuardAI/Transactions/${transaction.id}`);
      await remove(recordRef);
      
      await logActivity(
        "RECORD_DELETED",
        currentUser.uid,
        `Permanently deleted transaction ${transaction.id}`
      );
      
      toast.success("Transaction permanently deleted.");
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Permission denied. Failed to delete record.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={!!transaction} onClose={onClose} title="Transaction Details">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-text-secondary block font-medium">Transaction ID</span>
            <span className="font-mono font-bold text-text-primary text-xs break-all block mt-1">{transaction.id}</span>
          </div>
          <div>
            <span className="text-text-secondary block font-medium">Controller Node</span>
            <span className="font-bold text-text-primary block mt-1">{transaction.deviceId}</span>
          </div>

          <div>
            <span className="text-text-secondary block font-medium">Session Fueling Date</span>
            <span className="font-semibold text-text-primary block mt-1">{formatDateTime(transaction.startTime)}</span>
          </div>
          <div>
            <span className="text-text-secondary block font-medium">Session Status</span>
            <div className="mt-1">
              <StatusBadge status={transaction.status} />
            </div>
          </div>
        </div>

        <div className="divider" />

        <div className="grid grid-cols-2 gap-6 items-center">
          <div className="bg-russian-white/50 p-4 rounded-2xl border border-border-light/40">
            <span className="text-xs font-semibold text-text-secondary block">DELIVERED VOLUME</span>
            <span className="text-2xl font-extrabold font-display text-luxury-gold mt-1 block">
              {formatVolume(transaction.fuel)}
            </span>
          </div>
          <div className="bg-russian-white/50 p-4 rounded-2xl border border-border-light/40">
            <span className="text-xs font-semibold text-text-secondary block">SESSION BILL COST</span>
            <span className="text-2xl font-extrabold font-display text-text-primary mt-1 block">
              {formatCurrency(transaction.price)}
            </span>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary font-medium">Vehicle Identifier</span>
            {editing ? (
              <input
                type="text"
                value={vehicleId}
                placeholder="Enter Vehicle ID"
                onChange={(e) => setVehicleId(e.target.value)}
                className="input-field max-w-[200px] py-1 px-3 text-xs"
              />
            ) : (
              <span className="font-bold text-text-primary">{transaction.vehicleId || 'VH-AUTO'}</span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary font-medium">Fueling Duration</span>
            <span className="font-semibold text-text-primary">{formatDuration(transaction.duration)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary font-medium">Average Flow Rate</span>
            <span className="font-semibold text-text-primary font-display">{parseFloat(transaction.flowRate || 0).toFixed(2)} L/min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary font-medium">Calibration Factor Sync</span>
            <span className="font-semibold text-text-primary font-display">{parseFloat(transaction.pricePerLitre || 106.31).toFixed(2)} ₹/L</span>
          </div>
        </div>

        <div className="divider" />

        {/* Action triggers */}
        <div className="flex justify-end gap-3 pt-2">
          {editing ? (
            <>
              <button 
                onClick={() => setEditing(false)} 
                className="btn-ghost text-xs"
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit} 
                className="btn-gold text-xs px-4 py-2"
                disabled={submitting}
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              {isSuperAdmin && (
                <>
                  <button 
                    onClick={() => {
                      setVehicleId(transaction.vehicleId || 'VH-AUTO');
                      setEditing(true);
                    }} 
                    className="btn-outline text-xs px-4 py-2 border-border-light hover:border-luxury-gold"
                  >
                    Edit Vehicle
                  </button>
                  <button 
                    onClick={handleDeleteRecord} 
                    className="btn-danger text-xs px-4 py-2 bg-red-500 hover:bg-red-600"
                    disabled={submitting}
                  >
                    Delete Record
                  </button>
                </>
              )}
              <button onClick={onClose} className="btn-gold text-xs px-4 py-2">
                Dismiss Detail
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
