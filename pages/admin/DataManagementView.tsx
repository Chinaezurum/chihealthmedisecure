import React, { useState, useRef } from 'react';
import { Button } from '../../components/common/Button.tsx';
import { useToasts } from '../../hooks/useToasts.ts';
import { UploadCloudIcon, DownloadCloudIcon, CheckCircleIcon, AlertTriangleIcon } from '../../components/icons/index.tsx';

type ImportStatus = 'idle' | 'uploading' | 'validating' | 'importing' | 'complete' | 'error';
type ExportStatus = 'idle' | 'preparing' | 'generating' | 'downloading' | 'complete';


const IMPORT_STATUS_MESSAGES: Record<Exclude<ImportStatus, 'idle' | 'complete' | 'error'>, string> = {
    uploading: 'Uploading file...',
    validating: 'Validating CSV format...',
    importing: 'Importing patient records...',
};

const EXPORT_STATUS_MESSAGES: Record<Exclude<ExportStatus, 'idle' | 'complete'>, string> = {
    preparing: 'Preparing data...',
    generating: 'Generating CSV file...',
    downloading: 'Finalizing export...',
};


export const DataManagementView: React.FC = () => {
    const { addToast } = useToasts();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Import states
    const [fileName, setFileName] = useState<string | null>(null);
    const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
    const [importProgress, setImportProgress] = useState(0);
    const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
    
    // Export states
    const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
    const [exportProgress, setExportProgress] = useState(0);
    const [selectedExportModules, setSelectedExportModules] = useState<string[]>([]);

    const handleImportReset = () => {
        setImportStatus('idle');
        setImportProgress(0);
        setImportResult(null);
        setFileName(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const handleExportReset = () => {
        setExportStatus('idle');
        setExportProgress(0);
        setSelectedExportModules([]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleImportReset();
        if (e.target.files && e.target.files.length > 0) {
            setFileName(e.target.files[0].name);
        }
    };

    const handleImport = () => {
        if (!fileName) {
            addToast('Please select a file to import.', 'error');
            return;
        }

        setImportStatus('uploading');
        setImportProgress(10);

        setTimeout(() => {
            setImportProgress(25);
            setImportStatus('validating');
            setTimeout(() => {
                setImportProgress(50);
                setImportStatus('importing');
                setTimeout(() => {
                    setImportProgress(75);
                    setTimeout(() => {
                        const isError = Math.random() > 0.8;
                        if (isError) {
                            setImportStatus('error');
                            setImportResult({ success: 15, failed: 10 });
                        } else {
                            setImportStatus('complete');
                            setImportResult({ success: 25, failed: 0 });
                        }
                        setImportProgress(100);
                    }, 1500);
                }, 1000);
            }, 800);
        }, 500);
    };
    
    const handleExportModulesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, checked } = e.target;
        setSelectedExportModules(prev =>
            checked ? [...prev, id] : prev.filter(item => item !== id)
        );
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
    
    const isImporting = ['uploading', 'validating', 'importing'].includes(importStatus);

    const renderImportContent = () => {
        if (importStatus === 'complete' || importStatus === 'error') {
            const isSuccess = importStatus === 'complete' && importResult?.failed === 0;
            const isPartial = importStatus === 'complete' && importResult?.failed !== 0;
            const title = isSuccess ? "Import Successful" : isPartial ? "Import Partially Complete" : "Import Failed";
            const Icon = isSuccess ? CheckCircleIcon : AlertTriangleIcon;
            
            return (
                 <div className={`import-result-summary ${isSuccess ? 'success' : 'error'}`}>
                    <Icon className="import-result-icon" style={{color: isSuccess ? 'var(--success-color)' : 'var(--error-color)'}} />
                    <h4 className="import-result-title">{title}</h4>
                    {importResult && (
                        <p className="import-result-details">
                            {importResult.success} records imported successfully. <br />
                            {importResult.failed > 0 && `${importResult.failed} records failed due to errors.`}
                        </p>
                    )}
                    <Button onClick={handleImportReset} style={{marginTop: '1.5rem'}}>Start Over</Button>
                </div>
            );
        }

        if (isImporting) {
            return (
                <div className="import-progress-container">
                    <div className="import-progress-bar-background">
                        <div className="import-progress-bar" style={{ width: `${importProgress}%` }}></div>
                    </div>
                    <p className="import-status-text">
                        <span>{IMPORT_STATUS_MESSAGES[importStatus as keyof typeof IMPORT_STATUS_MESSAGES]}</span>
                    </p>
                </div>
            );
        }

        return (
            <>
                <div className={`data-management-dropzone ${isImporting ? 'disabled' : ''}`}>
                    <UploadCloudIcon className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                    <input type="file" id="file-upload" className="hidden" accept=".csv" onChange={handleFileChange} ref={fileInputRef} disabled={isImporting}/>
                    <label htmlFor="file-upload" className="font-semibold text-primary cursor-pointer hover:underline">
                        Choose a file
                    </label>
                    <p className="text-xs text-text-secondary mt-1">
                        {fileName ? fileName : 'or drag and drop. CSV up to 10MB.'}
                    </p>
                </div>
                 <p className="text-xs text-text-secondary mt-4">
                    Required CSV columns: <strong>name, email, dateOfBirth, lastVisit</strong>
                </p>
                <Button onClick={handleImport} disabled={!fileName} fullWidth style={{marginTop: '1rem'}}>
                    Import Data
                </Button>
            </>
        );
    };

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
                    {renderImportContent()}
                </div>

                {/* Export Section */}
                <div className="content-card p-6 flex flex-col">
                    <h3 className="text-xl font-semibold text-primary mb-4">Export System Data</h3>
                     {renderExportContent()}
                </div>
            </div>
        </>
    );
};