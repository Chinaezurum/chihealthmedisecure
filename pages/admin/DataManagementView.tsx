import React, { useState } from 'react';
import { Button } from '../../components/common/Button.tsx';
import { useToasts } from '../../hooks/useToasts.ts';
import { UploadCloudIcon, DownloadCloudIcon, CheckCircleIcon } from '../../components/icons/index.tsx';
import { ImportPatientsModal } from './ImportPatientsModal.tsx';

type ExportStatus = 'idle' | 'preparing' | 'generating' | 'downloading' | 'complete';


const EXPORT_STATUS_MESSAGES: Record<Exclude<ExportStatus, 'idle' | 'complete'>, string> = {
    preparing: 'Preparing data...',
    generating: 'Generating CSV file...',
    downloading: 'Finalizing export...',
};


export const DataManagementView: React.FC = () => {
    const { addToast } = useToasts();

    // Import state
    const [showImportModal, setShowImportModal] = useState(false);
    
    // Export states
    const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
    const [exportProgress, setExportProgress] = useState(0);
    const [selectedExportModules, setSelectedExportModules] = useState<string[]>([]);
    
    const handleExportReset = () => {
        setExportStatus('idle');
        setExportProgress(0);
        setSelectedExportModules([]);
    };

    // Old import handlers removed - using ImportPatientsModal now

    const handleExportModulesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, checked } = e.target;
        setSelectedExportModules(prev =>
            checked ? [...prev, id] : prev.filter(item => item !== id)
        );
    };

    const handleImportSuccess = (count: number) => {
        addToast(`Successfully imported ${count} patient records`, 'success');
        setShowImportModal(false);
    };

    const handleExport = () => {
        if (selectedExportModules.length === 0) {
            addToast('Please select at least one data module to export.', 'error');
            return;
        }

        setExportStatus('preparing');
        setExportProgress(10);

        setTimeout(() => {
            setExportStatus('generating');
            setExportProgress(40);
            setTimeout(() => {
                setExportStatus('downloading');
                setExportProgress(80);
                setTimeout(() => {
                    setExportStatus('complete');
                    setExportProgress(100);
                    addToast('Data export complete. Your download will begin shortly.', 'success');
                }, 1000);
            }, 1200);
        }, 800);
    };
    
    // Old import function removed - now using ImportPatientsModal

    const renderExportContent = () => {
        const isExporting = ['preparing', 'generating', 'downloading'].includes(exportStatus);

        if (exportStatus === 'complete') {
            return (
                <div className="import-result-summary success">
                    <CheckCircleIcon className="import-result-icon" style={{ color: 'var(--success-color)' }} />
                    <h4 className="import-result-title">Export Complete</h4>
                    <p className="import-result-details">
                        Your file has been generated and the download will begin shortly.
                    </p>
                    <Button onClick={handleExportReset} style={{ marginTop: '1.5rem' }}>Start New Export</Button>
                </div>
            );
        }

        if (isExporting) {
            return (
                <div className="import-progress-container">
                    <div className="import-progress-bar-background">
                        <div className="import-progress-bar" style={{ width: `${exportProgress}%` }}></div>
                    </div>
                    <p className="import-status-text">
                        <span>{EXPORT_STATUS_MESSAGES[exportStatus as keyof typeof EXPORT_STATUS_MESSAGES]}</span>
                    </p>
                </div>
            );
        }

        return (
             <>
                <p className="text-sm text-text-secondary mb-4">
                    Generate a secure export of system data. Select the data sets you wish to include in the CSV export.
                </p>
                <div className="space-y-3">
                    {['Patients', 'Appointments', 'Prescriptions', 'Lab Tests', 'Billing Records'].map(item => (
                        <div key={item} className="flex items-center">
                            <input
                                id={item}
                                name={item}
                                type="checkbox"
                                className="h-4 w-4 text-primary focus:ring-primary border-border-secondary rounded"
                                checked={selectedExportModules.includes(item)}
                                onChange={handleExportModulesChange}
                            />
                            <label htmlFor={item} className="ml-3 block text-sm font-medium text-text-primary">
                                {item}
                            </label>
                        </div>
                    ))}
                </div>
                <Button onClick={handleExport} disabled={selectedExportModules.length === 0} fullWidth style={{marginTop: '1.5rem'}}>
                     <DownloadCloudIcon className="w-5 h-5 mr-2" />
                    Export Selected Data
                </Button>
            </>
        );
    };


    return (
        <>
            <h2 className="text-3xl font-bold text-text-primary mb-6">Data Management</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Import Section */}
                <div className="content-card p-6 flex flex-col">
                    <h3 className="text-xl font-semibold text-primary mb-4">Import Patient Data</h3>
                    <p className="text-sm text-text-secondary mb-4">
                        Upload patient records from other facilities in CSV format. Support for Excel, PDF, and DOCS is coming soon.
                    </p>
                    <div className="flex-1 flex flex-col justify-center items-center py-8">
                        <UploadCloudIcon className="w-16 h-16 text-text-tertiary mb-4" />
                        <h4 className="font-semibold text-text-primary mb-2">Import Patient Records</h4>
                        <p className="text-sm text-text-secondary text-center mb-6 max-w-md">
                            Easily transfer patient data from other facilities using our CSV import tool. Validate and import records in bulk.
                        </p>
                        <Button onClick={() => setShowImportModal(true)}>
                            <UploadCloudIcon className="w-4 h-4 mr-2" />
                            Start Import
                        </Button>
                    </div>
                </div>

                {/* Export Section */}
                <div className="content-card p-6 flex flex-col">
                    <h3 className="text-xl font-semibold text-primary mb-4">Export System Data</h3>
                     {renderExportContent()}
                </div>
            </div>

            {/* Import Patients Modal */}
            <ImportPatientsModal 
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportSuccess={handleImportSuccess}
                organizationId="org-1"
            />
        </>
    );
};