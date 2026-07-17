import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToCSV = (data, filename = 'transactions_report') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
};

export const exportToExcel = (data, filename = 'transactions_report') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, `${filename}.xlsx`);
};

export const exportToPDF = (columns, rows, title = 'FuelGuard AI Transaction Report') => {
  const doc = new jsPDF();
  
  // Format Title
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
  doc.text("System: Smart Fuel Accuracy & Monitoring Platform", 14, 31);
  
  doc.autoTable({
    head: [columns],
    body: rows,
    startY: 38,
    theme: 'striped',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [201, 169, 110] } // Luxury Gold color
  });
  
  doc.save(`${title.toLowerCase().replace(/ /g, '_')}.pdf`);
};
