import React, { useState, useEffect } from 'react';
import { ref, get, query, orderByKey } from 'firebase/database';
import { db } from '../config/firebase';
import { TransactionTable } from '../components/history/TransactionTable';
import { TransactionFilters } from '../components/history/TransactionFilters';
import { TransactionDetail } from '../components/history/TransactionDetail';
import { ExportButtons } from '../components/history/ExportButtons';
import { Pagination } from '../components/history/Pagination';
import { toast } from 'react-hot-toast';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  
  // Selected detail modal
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const dataRef = query(ref(db, 'FuelGuardAI/Transactions'), orderByKey());
      const snapshot = await get(dataRef);
      if (snapshot.exists()) {
        const raw = snapshot.val();
        const array = Object.entries(raw)
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => b.startTime - a.startTime);
        setTransactions(array);
        setFilteredList(array);
      } else {
        setTransactions([]);
        setFilteredList([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to read historical transaction logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Filter logs logic
  useEffect(() => {
    let result = [...transactions];

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.id.toLowerCase().includes(lower) || 
        t.deviceId.toLowerCase().includes(lower) ||
        (t.vehicleId && t.vehicleId.toLowerCase().includes(lower))
      );
    }

    if (deviceFilter) {
      result = result.filter(t => t.deviceId === deviceFilter);
    }

    if (statusFilter) {
      result = result.filter(t => t.status === statusFilter);
    }

    if (startDate) {
      const startMs = new Date(startDate).getTime();
      result = result.filter(t => t.startTime >= startMs);
    }

    if (endDate) {
      const endMs = new Date(endDate).getTime() + 86400000; // include full day
      result = result.filter(t => t.startTime <= endMs);
    }

    setFilteredList(result);
    setCurrentPage(1);
  }, [searchQuery, deviceFilter, statusFilter, startDate, endDate, transactions]);

  // Compute paginated subset
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedList = filteredList.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;

  // Extract unique list of devices for filters
  const uniqueDevices = Array.from(new Set(transactions.map(t => t.deviceId)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-primary">Transaction Logs</h1>
          <p className="text-sm text-text-secondary mt-1">Audit trail and export tools for fuel delivery history</p>
        </div>

        <ExportButtons data={filteredList} />
      </div>

      {/* Filter panel */}
      <TransactionFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        deviceFilter={deviceFilter}
        setDeviceFilter={setDeviceFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        deviceList={uniqueDevices}
      />

      {/* Main Table Card */}
      {loading ? (
        <div className="card text-center py-12">Parsing historical log caches...</div>
      ) : (
        <div className="space-y-4">
          <TransactionTable 
            list={paginatedList} 
            onSelectRow={setSelectedTransaction} 
          />
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredList.length}
            startIndex={startIndex + 1}
            endIndex={Math.min(startIndex + pageSize, filteredList.length)}
          />
        </div>
      )}

      {/* Details View Modal */}
      <TransactionDetail
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onRefresh={fetchHistory}
      />
    </div>
  );
}
