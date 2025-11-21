import React, { useState } from 'react';
import * as Icons from '../../components/icons';
import { DispensingDetailsModal } from './DispensingDetailsModal.tsx';

interface DispensedRecord {
  id: string;
  date: string;
  patientName: string;
  patientId: string;
  medicationName: string;
  quantity: number;
  unit: string;
  dispensedBy: string;
  prescriptionId: string;
}

export const DispensingHistoryView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [viewingRecord, setViewingRecord] = useState<DispensedRecord | null>(null);

  // Mock data
  const mockHistory: DispensedRecord[] = [
    { id: 'DISP001', date: '2024-01-15T10:30:00', patientName: 'John Doe', patientId: 'P12345', medicationName: 'Amoxicillin 250mg', quantity: 21, unit: 'capsules', dispensedBy: 'Pharmacist A', prescriptionId: 'RX1001' },
    { id: 'DISP002', date: '2024-01-15T11:15:00', patientName: 'Jane Smith', patientId: 'P12346', medicationName: 'Paracetamol 500mg', quantity: 30, unit: 'tablets', dispensedBy: 'Pharmacist B', prescriptionId: 'RX1002' },
    { id: 'DISP003', date: '2024-01-14T14:20:00', patientName: 'Bob Johnson', patientId: 'P12347', medicationName: 'Metformin 500mg', quantity: 60, unit: 'tablets', dispensedBy: 'Pharmacist A', prescriptionId: 'RX1003' },
    { id: 'DISP004', date: '2024-01-14T09:45:00', patientName: 'Alice Williams', patientId: 'P12348', medicationName: 'Omeprazole 20mg', quantity: 14, unit: 'capsules', dispensedBy: 'Pharmacist C', prescriptionId: 'RX1004' },
    { id: 'DISP005', date: '2024-01-13T16:00:00', patientName: 'Charlie Brown', patientId: 'P12349', medicationName: 'Ibuprofen 400mg', quantity: 20, unit: 'tablets', dispensedBy: 'Pharmacist B', prescriptionId: 'RX1005' },
  ];

  const dateRangeOptions = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '3months', label: 'Last 3 Months' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const filteredHistory = mockHistory.filter(record => {
    const matchesSearch = record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.medicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.prescriptionId.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date filtering
    const recordDate = new Date(record.date);
    const now = new Date();
    let matchesDate = true;

    if (dateRange === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = recordDate >= sevenDaysAgo;
    } else if (dateRange === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = recordDate >= thirtyDaysAgo;
    } else if (dateRange === '3months') {
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      matchesDate = recordDate >= threeMonthsAgo;
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999); // Include full end date
      matchesDate = recordDate >= startDate && recordDate <= endDate;
    }

    return matchesSearch && matchesDate;
  });

  const totalDispensed = filteredHistory.length;
  const uniquePatients = new Set(filteredHistory.map(r => r.patientId)).size;

  const handlePrint = (record: DispensedRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dispensing Record - ${record.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
          .section { margin: 20px 0; }
          .label { font-weight: bold; color: #4b5563; }
          .value { margin-left: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border: 1px solid #e5e7eb; }
          th { background-color: #f3f4f6; }
          .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Dispensing Record</h1>
        
        <div class="section">
          <p><span class="label">Dispensing ID:</span><span class="value">${record.id}</span></p>
          <p><span class="label">Date & Time:</span><span class="value">${new Date(record.date).toLocaleString()}</span></p>
        </div>

        <div class="section">
          <h3>Patient Information</h3>
          <p><span class="label">Name:</span><span class="value">${record.patientName}</span></p>
          <p><span class="label">Patient ID:</span><span class="value">${record.patientId}</span></p>
        </div>

        <div class="section">
          <h3>Medication Details</h3>
          <table>
            <tr>
              <th>Medication</th>
              <th>Quantity</th>
              <th>Prescription ID</th>
            </tr>
            <tr>
              <td>${record.medicationName}</td>
              <td>${record.quantity} ${record.unit}</td>
              <td>${record.prescriptionId}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <p><span class="label">Dispensed By:</span><span class="value">${record.dispensedBy}</span></p>
        </div>

        <div class="footer">
          <p>ChiHealth MediSecure - Pharmacy System</p>
          <p>Printed on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const exportReport = () => {
    const csvData = filteredHistory.map(record => ({
      'Dispensing ID': record.id,
      'Date': new Date(record.date).toLocaleDateString(),
      'Time': new Date(record.date).toLocaleTimeString(),
      'Patient Name': record.patientName,
      'Patient ID': record.patientId,
      'Medication': record.medicationName,
      'Quantity': `${record.quantity} ${record.unit}`,
      'Dispensed By': record.dispensedBy,
      'Prescription ID': record.prescriptionId,
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Dispensing_History_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dispensing History</h2>
          <p className="text-sm text-gray-600 mt-1">Track all dispensed prescriptions and patient records</p>
        </div>
        <button 
          onClick={exportReport}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
        >
          <Icons.DownloadCloudIcon className="h-4 w-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.PillIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Dispensed</p>
              <p className="text-2xl font-bold text-gray-900">{totalDispensed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.UsersIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unique Patients</p>
              <p className="text-2xl font-bold text-gray-900">{uniquePatients}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icons.ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg. Per Day</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(totalDispensed / 7)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Icons.SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient, medication, or prescription ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {dateRangeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Custom Date Range */}
        {dateRange === 'custom' && (
          <div className="flex gap-4 items-center pt-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Medication
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Dispensed By
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Prescription
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistory.map(record => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(record.date).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Icons.UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{record.patientName}</div>
                        <div className="text-xs text-gray-500">{record.patientId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Icons.PillIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm text-gray-900">{record.medicationName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {record.quantity} {record.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {record.dispensedBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                      {record.prescriptionId}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => setViewingRecord(record)}
                      className="text-blue-600 hover:text-blue-800 font-semibold mr-3"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => handlePrint(record)}
                      className="text-gray-600 hover:text-gray-800 font-semibold"
                    >
                      Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredHistory.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Icons.ClipboardListIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">No dispensing records found</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {viewingRecord && (
        <DispensingDetailsModal
          record={viewingRecord}
          onClose={() => setViewingRecord(null)}
          onPrint={() => {
            handlePrint(viewingRecord);
            setViewingRecord(null);
          }}
        />
      )}
    </div>
  );
};
