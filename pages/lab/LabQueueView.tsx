import React, { useState, useMemo } from 'react';
import { LabTest } from '../../types.ts';
import { EnterResultsModal } from './EnterResultsModal.tsx';
import { EditTestRequestModal } from './EditTestRequestModal.tsx';
import { CancelTestRequestModal } from './CancelTestRequestModal.tsx';
import { InterDepartmentalNotesModal } from '../../components/common/InterDepartmentalNotesModal.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { FlaskConicalIcon, SearchIcon, MessageSquareIcon, XCircleIcon } from '../../components/icons/index.tsx';

interface LabQueueViewProps {
  labTests: LabTest[];
  onUpdateTest: (testId: string, status: LabTest['status'], result?: string, notes?: string) => void;
  onEditTest: (testId: string, updates: Partial<LabTest>) => void;
  onCancelTest: (testId: string, reason: string) => void;
  currentUserId: string;
}

export const LabQueueView: React.FC<LabQueueViewProps> = ({ 
  labTests, 
  onUpdateTest, 
  onEditTest, 
  onCancelTest, 
  currentUserId 
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
    const [editingTest, setEditingTest] = useState<LabTest | null>(null);
    const [cancellingTest, setCancellingTest] = useState<LabTest | null>(null);
    const [messagingTest, setMessagingTest] = useState<LabTest | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<'all' | 'Urgent' | 'High' | 'Normal' | 'Low'>('all');
    const [sortBy, setSortBy] = useState<'date' | 'priority' | 'patient'>('priority');
    
    const pendingTests = labTests.filter(t => t.status === 'Ordered' || t.status === 'In-progress');
    const completedTests = labTests.filter(t => t.status === 'Completed');
    
    // Filter and sort tests
    const filteredPendingTests = useMemo(() => {
      let filtered = pendingTests;
      
      // Search filter
      if (searchTerm) {
        filtered = filtered.filter(t => 
          t.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.testName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Priority filter
      if (priorityFilter !== 'all') {
        filtered = filtered.filter(t => (t as any).priority === priorityFilter);
      }
      
      // Sort
      return filtered.sort((a, b) => {
        if (sortBy === 'priority') {
          const priorityOrder: Record<string, number> = { 'Urgent': 0, 'High': 1, 'Normal': 2, 'Low': 3 };
          return (priorityOrder[(a as any).priority || 'Normal'] || 2) - (priorityOrder[(b as any).priority || 'Normal'] || 2);
        } else if (sortBy === 'date') {
          return new Date(a.dateOrdered).getTime() - new Date(b.dateOrdered).getTime();
        } else {
          return a.patientName.localeCompare(b.patientName);
        }
      });
    }, [pendingTests, searchTerm, priorityFilter, sortBy]);

    const handleOpenModal = (test: LabTest) => {
        setSelectedTest(test);
        setIsModalOpen(true);
    };
    
    const handleSaveResult = (result: string, notes: string) => {
        if(selectedTest) {
            onUpdateTest(selectedTest.id, 'Completed', result, notes);
        }
        setIsModalOpen(false);
        setSelectedTest(null);
    };
    
    const handleEditTest = (updates: Partial<LabTest>) => {
      if (editingTest) {
        onEditTest(editingTest.id, updates);
        setEditingTest(null);
      }
    };
    
    const handleCancelTest = (reason: string) => {
      if (cancellingTest) {
        onCancelTest(cancellingTest.id, reason);
        setCancellingTest(null);
      }
    };
    
    const handleStartTest = (test: LabTest) => {
      // Audit logging
      const auditLog = {
        timestamp: new Date().toISOString(),
        userId: currentUserId,
        action: 'start_test',
        testId: test.id,
        testName: test.testName,
        patientId: test.patientId,
        previousStatus: test.status,
        newStatus: 'In-progress'
      };
      console.log('Lab Test Start Audit:', auditLog);
      
      onUpdateTest(test.id, 'In-progress');
    };
    
    const getPriorityColor = (priority?: string) => {
      switch (priority) {
        case 'Urgent': return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300';
        case 'High': return 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300';
        case 'Low': return 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300';
        default: return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300';
      }
    };

    return (
    <>
      {/* Filters and Search */}
      <div className="bg-background-secondary border border-border-primary rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Search
            </label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Patient name, ID, or test..."
                className="w-full pl-10 pr-3 py-2 bg-background-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Priority Filter
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-background-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-background-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="priority">Priority</option>
              <option value="date">Date Ordered</option>
              <option value="patient">Patient Name</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="space-y-8">
        <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400">Pending Tests</h3>
              <span className="text-sm text-text-secondary">
                {filteredPendingTests.length} test{filteredPendingTests.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="bg-background-secondary border border-border-primary rounded-xl shadow-lg overflow-hidden">
              {filteredPendingTests.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-background-tertiary">
                      <tr>
                        <th className="p-4 font-semibold text-text-primary">Priority</th>
                        <th className="p-4 font-semibold text-text-primary">Date Ordered</th>
                        <th className="p-4 font-semibold text-text-primary">Patient</th>
                        <th className="p-4 font-semibold text-text-primary">Test Name</th>
                        <th className="p-4 font-semibold text-text-primary">Status</th>
                        <th className="p-4 font-semibold text-text-primary">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-primary">
                      {filteredPendingTests.map(test => (
                        <tr key={test.id} className="hover:bg-background-tertiary/50">
                          <td className="p-4">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor((test as any).priority)}`}>
                              {(test as any).priority || 'Normal'}
                            </span>
                          </td>
                          <td className="p-4 text-text-secondary">{new Date(test.dateOrdered).toLocaleDateString()}</td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-text-primary">{test.patientName}</p>
                              <p className="text-sm text-text-tertiary">{test.patientId}</p>
                            </div>
                          </td>
                          <td className="p-4 font-medium text-text-primary">{test.testName}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              test.status === 'Ordered' 
                                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' 
                                : 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300'
                            }`}>
                              {test.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2 flex-wrap">
                              {test.status === 'Ordered' && (
                                <button
                                  onClick={() => handleStartTest(test)}
                                  className="px-3 py-1.5 text-sm bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                                >
                                  Start Test
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenModal(test)}
                                className="px-3 py-1.5 text-sm bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors"
                              >
                                Enter Results
                              </button>
                              <button
                                onClick={() => setEditingTest(test)}
                                className="px-3 py-1.5 text-sm bg-background-tertiary text-text-primary hover:bg-background-primary rounded-lg transition-colors"
                                title="Edit Request"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setMessagingTest(test)}
                                className="p-1.5 text-text-tertiary hover:text-primary transition-colors"
                                title="Send Message"
                              >
                                <MessageSquareIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setCancellingTest(test)}
                                className="p-1.5 text-text-tertiary hover:text-red-500 transition-colors"
                                title="Cancel Test"
                              >
                                <XCircleIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon={FlaskConicalIcon} title="No Pending Tests" message="New lab test orders from clinicians will appear here." />
              )}
            </div>
        </div>

        <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400">Completed - Awaiting Pickup</h3>
              <span className="text-sm text-text-secondary">
                {completedTests.length} test{completedTests.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="bg-background-secondary border border-border-primary rounded-xl shadow-lg overflow-hidden">
              {completedTests.length > 0 ? (
                <table className="w-full text-left">
                    <thead className="bg-background-tertiary">
                        <tr>
                            <th className="p-4 font-semibold text-text-primary">Patient</th>
                            <th className="p-4 font-semibold text-text-primary">Test Name</th>
                            <th className="p-4 font-semibold text-text-primary">Result</th>
                            <th className="p-4 font-semibold text-text-primary">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-primary">
                    {completedTests.map(test => (
                        <tr key={test.id} className="hover:bg-background-tertiary/50">
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-text-primary">{test.patientName}</p>
                                <p className="text-sm text-text-tertiary">{test.patientId}</p>
                              </div>
                            </td>
                            <td className="p-4 font-medium text-text-primary">{test.testName}</td>
                            <td className="p-4 font-mono text-text-primary">{test.result}</td>
                            <td className="p-4">
                                <button
                                  onClick={() => onUpdateTest(test.id, 'Awaiting Pickup')}
                                  className="px-3 py-1.5 text-sm bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors"
                                >
                                  Request Pickup
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              ) : (
                 <EmptyState icon={FlaskConicalIcon} title="No Completed Tests" message="Completed tests ready for logistics pickup will appear here." />
              )}
            </div>
        </div>
      </div>

      {isModalOpen && selectedTest && (
        <EnterResultsModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            test={selectedTest}
            onSave={handleSaveResult}
            currentUserId={currentUserId}
        />
      )}
      
      {editingTest && (
        <EditTestRequestModal
          isOpen={!!editingTest}
          onClose={() => setEditingTest(null)}
          test={editingTest}
          onSave={handleEditTest}
          currentUserId={currentUserId}
        />
      )}
      
      {cancellingTest && (
        <CancelTestRequestModal
          isOpen={!!cancellingTest}
          onClose={() => setCancellingTest(null)}
          test={cancellingTest}
          onCancel={handleCancelTest}
          currentUserId={currentUserId}
        />
      )}
      
      {messagingTest && (
        <InterDepartmentalNotesModal
          isOpen={!!messagingTest}
          onClose={() => setMessagingTest(null)}
          patientId={messagingTest.patientId}
          patientName={messagingTest.patientName}
          relatedEntityId={messagingTest.id}
          relatedEntityType="lab"
          currentUserId={currentUserId}
          currentUserRole="lab_technician"
          onSendNote={(note) => {
            // Audit logging for message
            const auditLog = {
              timestamp: new Date().toISOString(),
              userId: currentUserId,
              action: 'send_interdepartmental_message',
              testId: messagingTest.id,
              patientId: messagingTest.patientId,
              subject: note.subject,
              toRole: note.toRole
            };
            console.log('Interdepartmental Message Audit:', auditLog);
            setMessagingTest(null);
          }}
        />
      )}
    </>
  );
};