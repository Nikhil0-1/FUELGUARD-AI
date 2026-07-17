import React from 'react';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  startIndex,
  endIndex
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 px-2">
      {/* Items Range display */}
      <span className="text-xs font-semibold text-text-secondary">
        Showing <span className="text-text-primary">{startIndex}</span> to{' '}
        <span className="text-text-primary">{endIndex}</span> of{' '}
        <span className="text-text-primary">{totalItems}</span> transactions
      </span>

      {/* Button Controls */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 border border-border-light bg-card-white text-text-secondary rounded-xl hover:bg-russian-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <RiArrowLeftSLine size={18} />
        </button>

        <span className="text-xs font-bold text-text-primary px-3">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 border border-border-light bg-card-white text-text-secondary rounded-xl hover:bg-russian-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <RiArrowRightSLine size={18} />
        </button>
      </div>
    </div>
  );
};
