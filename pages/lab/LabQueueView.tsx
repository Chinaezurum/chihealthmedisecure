import React, { useState } from 'react';
import { Button } from '../../components/common/Button.tsx';
import { LabTest } from '../../types.ts';
import { EnterResultsModal } from './EnterResultsModal.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { FlaskConicalIcon } from '../../components/icons/index.tsx';

interface LabQueueViewProps {
  labTests: LabTest[];
  onUpdateTest: (testId: string, status: LabTest['status'], result?: string) => void;
}

export const LabQueueView: React.FC<LabQueueViewProps> = ({ labTests, onUpdateTest }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
    
    const pendingTests = labTests.filter(t => t.status === 'Ordered' || t.status === 'In-progress');
    const completedTests = labTests.filter(t => t.status === 'Completed');

    const handleOpenModal = (test: LabTest) => {
        setSelectedTest(test);
        setIsModalOpen(true);
    };
    
    const handleSaveResult = (result: string) => {
        if(selectedTest) {
            onUpdateTest(selectedTest.id, 'Completed', result);
        }
        setIsModalOpen(false);
        setSelectedTest(null);
    }

    return (
    <>
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6">Lab Test Queue</h2>
      
      <div className="space-y-8">
        <div>
            <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-3">Pending Tests</h3>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
              {pendingTests.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="p-4 font-semibold">Date Ordered</th>
                      <th className="p-4 font-semibold">Patient Name</th>
                      <th className="p-4 font-semibold">Test Name</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {pendingTests.map(test => (
                      <tr key={test.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="p-4">{new Date(test.dateOrdered).toLocaleDateString()}</td>
                        <td className="p-4">{test.patientName} ({test.patientId})</td>
                        <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{test.testName}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${test.status === 'Ordered' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300'}`}>
                            {test.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <Button onClick={() => handleOpenModal(test)}>Enter Results</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState icon={FlaskConicalIcon} title="No Pending Tests" message="New lab test orders from clinicians will appear here." />
              )}
            </div>
        </div>

        <div>
            <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-3">Completed - Awaiting Pickup</h3>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
              {completedTests.length > 0 ? (
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="p-4 font-semibold">Patient Name</th>
                            <th className="p-4 font-semibold">Test Name</th>
                            <th className="p-4 font-semibold">Result</th>
                            <th className="p-4 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {completedTests.map(test => (
                        <tr key={test.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <td className="p-4">{test.patientName}</td>
                            <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{test.testName}</td>
                            <td className="p-4 font-mono">{test.result}</td>
                            <td className="p-4">
                                <Button onClick={() => onUpdateTest(test.id, 'Awaiting Pickup')}>Request Pickup</Button>
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
        />
      )}
    </>
  );
};