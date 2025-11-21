import React, { useState, useMemo } from 'react';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { LabTest } from '../../types.ts';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { FlaskConicalIcon, SearchIcon } from '../../components/icons/index.tsx';
import { EnterResultsModal } from './EnterResultsModal.tsx';

interface CompletedTestsViewProps {
  labTests: LabTest[];
  onUpdateTest: (testId: string, status: LabTest['status'], result?: string, notes?: string) => void;
  currentUserId: string;
}

export const CompletedTestsView: React.FC<CompletedTestsViewProps> = ({ 
  labTests, 
  onUpdateTest, 
  currentUserId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Completed' | 'Awaiting Pickup'>('all');
  const [dateFilter, setDateFilter] = useState('7');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  
  // Audit-logged handlers
  const handleSearchChange = (value: string) => {
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userRole: 'lab_technician',
      action: 'search_completed_tests',
      searchTerm: value,
      resultCount: completedTests.filter(t => 
        t.patientName.toLowerCase().includes(value.toLowerCase()) ||
        t.patientId.toLowerCase().includes(value.toLowerCase()) ||
        t.testName.toLowerCase().includes(value.toLowerCase())
      ).length
    };
    console.log('Completed Tests Search Audit:', auditLog);
    setSearchTerm(value);
  };

  const handleStatusFilterChange = (value: string) => {
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userRole: 'lab_technician',
      action: 'filter_completed_tests_by_status',
      filterValue: value,
      previousValue: statusFilter
    };
    console.log('Completed Tests Status Filter Audit:', auditLog);
    setStatusFilter(value as any);
  };

  const handleDateFilterChange = (value: string) => {
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userRole: 'lab_technician',
      action: 'filter_completed_tests_by_date',
      filterValue: value,
      previousValue: dateFilter
    };
    console.log('Completed Tests Date Filter Audit:', auditLog);
    setDateFilter(value);
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userRole: 'lab_technician',
      action: 'set_custom_date_range',
      dateType: type,
      dateValue: value
    };
    console.log('Completed Tests Custom Date Audit:', auditLog);
    if (type === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };
  
  const completedTests = labTests.filter(t => 
    t.status === 'Completed' || t.status === 'Awaiting Pickup'
  );
  
  const filteredTests = useMemo(() => {
    let filtered = completedTests;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.testName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    // Date filter
    const now = new Date();
    if (dateFilter === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => {
        const testDate = new Date(t.dateOrdered);
        return testDate >= start && testDate <= end;
      });
    } else if (dateFilter !== 'all') {
      const days = parseInt(dateFilter);
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.dateOrdered) >= cutoffDate);
    }
    
    return filtered.sort((a, b) => 
      new Date(b.dateOrdered).getTime() - new Date(a.dateOrdered).getTime()
    );
  }, [completedTests, searchTerm, statusFilter, dateFilter, startDate, endDate]);
  
  const handleExportCSV = () => {
    // Audit logging
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      action: 'export_completed_tests',
      recordCount: filteredTests.length,
      filters: { searchTerm, statusFilter, dateFilter }
    };
    console.log('Completed Tests Export Audit:', auditLog);
    
    const headers = ['Test ID', 'Patient Name', 'Patient ID', 'Test Name', 'Result', 'Status', 'Date Ordered', 'Completed Date'];
    const csvContent = [
      headers.join(','),
      ...filteredTests.map(t => [
        t.id,
        `"${t.patientName}"`,
        t.patientId,
        `"${t.testName}"`,
        `"${t.result || 'N/A'}"`,
        t.status,
        new Date(t.dateOrdered).toLocaleString(),
        'N/A'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `completed-tests-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  const handlePrintTest = (test: LabTest) => {
    // Audit logging
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      action: 'print_test_result',
      testId: test.id,
      testName: test.testName,
      patientId: test.patientId
    };
    console.log('Test Result Print Audit:', auditLog);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Lab Test Result - ${test.testName}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .section { margin: 15px 0; }
              .label { font-weight: bold; }
              .result { font-size: 18px; padding: 10px; background: #f0f0f0; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>ChiHealth Laboratory</h1>
              <h2>Test Result Report</h2>
            </div>
            <div class="section">
              <p><span class="label">Patient Name:</span> ${test.patientName}</p>
              <p><span class="label">Patient ID:</span> ${test.patientId}</p>
              <p><span class="label">Test Name:</span> ${test.testName}</p>
              <p><span class="label">Date Ordered:</span> ${new Date(test.dateOrdered).toLocaleString()}</p>
              <p><span class="label">Status:</span> ${test.status}</p>
            </div>
            <div class="section">
              <p class="label">Test Result:</p>
              <div class="result">${test.result || 'No result recorded'}</div>
            </div>
            <div class="section">
              <p style="font-size: 12px; color: #666;">Printed on: ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };
  
  const handleEditResult = (result: string, notes: string) => {
    if (editingTest) {
      onUpdateTest(editingTest.id, editingTest.status, result, notes);
      setEditingTest(null);
    }
  };
  
  return (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-text-primary mb-2">Completed Tests</h2>
        <p className="text-text-secondary">View and manage completed laboratory tests</p>
      </div>
      
      {/* Audit Warning */}
      <div className="mb-4 p-2.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          ⚠️ <strong>Audit Notice:</strong> Searches, filters, exports, and print actions are logged for compliance.
        </p>
      </div>
      
      {/* Filters */}
      <div className="bg-background-secondary border border-border-primary rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Search
            </label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Patient name, ID, or test..."
                className="w-full pl-10 pr-3 py-2 bg-background-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="w-full px-3 py-2 bg-background-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Awaiting Pickup">Awaiting Pickup</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => handleDateFilterChange(e.target.value)}
              className="w-full px-3 py-2 bg-background-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="all">All time</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <Button onClick={handleExportCSV} className="w-full">
              Export CSV
            </Button>
          </div>
        </div>
        
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
            />
            <Input
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
            />
          </div>
        )}
      </div>
      
      {/* Results count */}
      <div className="mb-4">
        <p className="text-sm text-text-secondary">
          Showing {filteredTests.length} of {completedTests.length} completed tests
        </p>
      </div>
      
      {/* Tests table */}
      <div className="bg-background-secondary border border-border-primary rounded-xl shadow-lg overflow-hidden">
        {filteredTests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-background-tertiary">
                <tr>
                  <th className="p-4 font-semibold text-text-primary">Date Completed</th>
                  <th className="p-4 font-semibold text-text-primary">Patient</th>
                  <th className="p-4 font-semibold text-text-primary">Test Name</th>
                  <th className="p-4 font-semibold text-text-primary">Result</th>
                  <th className="p-4 font-semibold text-text-primary">Status</th>
                  <th className="p-4 font-semibold text-text-primary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {filteredTests.map(test => (
                  <tr key={test.id} className="hover:bg-background-tertiary/50">
                    <td className="p-4 text-text-secondary">
                      {new Date(test.dateOrdered).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-text-primary">{test.patientName}</p>
                        <p className="text-sm text-text-tertiary">{test.patientId}</p>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-text-primary">{test.testName}</td>
                    <td className="p-4">
                      <span className="font-mono text-text-primary">{test.result || 'N/A'}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        test.status === 'Completed' 
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300'
                          : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                      }`}>
                        {test.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingTest(test)}
                          className="px-3 py-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                        >
                          Edit Result
                        </button>
                        <button
                          onClick={() => handlePrintTest(test)}
                          className="px-3 py-1.5 text-sm bg-background-tertiary text-text-primary hover:bg-background-primary rounded-lg transition-colors"
                          title="Print"
                        >
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState 
            icon={FlaskConicalIcon}
            title="No Completed Tests Found" 
            message="No completed tests match your search criteria. Try adjusting your filters." 
          />
        )}
      </div>
      
      {editingTest && (
        <EnterResultsModal
          isOpen={!!editingTest}
          onClose={() => setEditingTest(null)}
          test={editingTest}
          onSave={handleEditResult}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
};
