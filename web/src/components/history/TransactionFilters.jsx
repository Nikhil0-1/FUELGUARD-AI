import React from 'react';
import { RiSearchLine, RiFilterLine } from 'react-icons/ri';

export const TransactionFilters = ({
  searchQuery,
  setSearchQuery,
  deviceFilter,
  setDeviceFilter,
  statusFilter,
  setStatusFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  deviceList
}) => {
  return (
    <div className="card p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Search query box */}
      <div className="relative">
        <RiSearchLine className="absolute left-3 top-3.5 text-text-muted" size={18} />
        <input
          type="text"
          placeholder="Search Trans ID, Vehicle..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Device Filter */}
      <div>
        <select
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
          className="select-field text-sm"
        >
          <option value="">All Devices</option>
          {deviceList.map(id => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select-field text-sm"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Start Date */}
      <div>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="input-field text-sm"
          placeholder="Start Date"
        />
      </div>

      {/* End Date */}
      <div>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="input-field text-sm"
          placeholder="End Date"
        />
      </div>
    </div>
  );
};
