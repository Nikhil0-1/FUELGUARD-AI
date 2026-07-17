import React from 'react';
import { exportToCSV, exportToExcel, exportToPDF } from '../../services/exportService';
import { RiFileTextLine, RiFileExcelLine, RiFilePdfLine } from 'react-icons/ri';
import { formatDateTime } from '../../utils/formatters';

export const ExportButtons = ({ data }) => {
  
  const handleCSV = () => {
    // Flatten logs for easy csv usage
    const flat = data.map(t => ({
      'Transaction ID': t.id,
      'Device ID': t.deviceId,
      'Vehicle ID': t.vehicleId || 'VH-AUTO',
      'Fuel Volume (L)': t.fuel,
      'Fuel Cost (INR)': t.price,
      'Price Per Litre': t.pricePerLitre,
      'Duration (sec)': t.duration,
      'Flow Rate (L/m)': t.flowRate,
      'Start Time': formatDateTime(t.startTime),
      'End Time': formatDateTime(t.endTime),
      'Status': t.status
    }));
    exportToCSV(flat);
  };

  const handleExcel = () => {
    const flat = data.map(t => ({
      'Transaction ID': t.id,
      'Device ID': t.deviceId,
      'Vehicle ID': t.vehicleId || 'VH-AUTO',
      'Fuel Volume (L)': t.fuel,
      'Fuel Cost (INR)': t.price,
      'Price Per Litre': t.pricePerLitre,
      'Duration (sec)': t.duration,
      'Flow Rate (L/m)': t.flowRate,
      'Start Time': formatDateTime(t.startTime),
      'End Time': formatDateTime(t.endTime),
      'Status': t.status
    }));
    exportToExcel(flat);
  };

  const handlePDF = () => {
    const cols = ['ID', 'Device', 'Vehicle', 'Fuel (L)', 'Cost (INR)', 'Duration', 'Date/Time'];
    const rows = data.map(t => [
      t.id.slice(0, 8),
      t.deviceId,
      t.vehicleId || 'VH-AUTO',
      t.fuel.toFixed(2),
      t.price.toFixed(2),
      `${t.duration}s`,
      formatDateTime(t.startTime)
    ]);
    exportToPDF(cols, rows, 'FuelGuard AI Delivery Logs Report');
  };

  return (
    <div className="flex items-center gap-2 w-full md:w-auto">
      <button 
        onClick={handleCSV} 
        className="btn-outline flex-grow md:flex-grow-0 py-2.5 px-4 text-xs font-semibold border-border-light hover:border-luxury-gold flex items-center justify-center gap-1.5"
      >
        <RiFileTextLine size={16} />
        Export CSV
      </button>
      <button 
        onClick={handleExcel} 
        className="btn-outline flex-grow md:flex-grow-0 py-2.5 px-4 text-xs font-semibold border-border-light hover:border-luxury-gold flex items-center justify-center gap-1.5"
      >
        <RiFileExcelLine size={16} />
        Export Excel
      </button>
      <button 
        onClick={handlePDF} 
        className="btn-gold flex-grow md:flex-grow-0 py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-1.5"
      >
        <RiFilePdfLine size={16} />
        Export PDF
      </button>
    </div>
  );
};
