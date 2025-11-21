import React, { useState, useRef } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { useToasts } from '../../hooks/useToasts.ts';
import * as Icons from '../../components/icons/index.tsx';

interface ImportPatientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedCount: number) => void;
  organizationId: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

export const ImportPatientsModal: React.FC<ImportPatientsModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  organizationId: _organizationId // Will be used for API integration
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToasts();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setImportResult(null);
        parsePreview(selectedFile);
      } else {
        addToast('Please select a CSV file', 'error');
        e.target.value = '';
      }
    }
  };

  const parsePreview = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Parse first 5 rows for preview
      const preview = lines.slice(1, 6).map((line, index) => {
        const values = parseCSVLine(line);
        const row: any = { _rowNumber: index + 2 };
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      });
      
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      console.error('Error parsing preview:', error);
      addToast('Error reading file preview', 'error');
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const validatePatientData = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!data.name || data.name.trim() === '') {
      errors.push('Name is required');
    }
    
    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
      errors.push('Valid email is required');
    }
    
    if (data.dateOfBirth) {
      const dob = new Date(data.dateOfBirth);
      if (isNaN(dob.getTime())) {
        errors.push('Invalid date of birth format (use YYYY-MM-DD)');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const handleImport = async () => {
    if (!file) {
      addToast('Please select a file first', 'error');
      return;
    }

    setIsProcessing(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        addToast('CSV file must contain headers and at least one data row', 'error');
        setIsProcessing(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
      
      // Validate required headers
      const requiredHeaders = ['name', 'email'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        addToast(`Missing required columns: ${missingHeaders.join(', ')}`, 'error');
        setIsProcessing(false);
        return;
      }

      const result: ImportResult = {
        success: 0,
        failed: 0,
        errors: []
      };

      // Process each row
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const patientData: any = {};
        
        headers.forEach((header, index) => {
          patientData[header] = values[index] || '';
        });

        // Validate the data
        const validation = validatePatientData(patientData);
        
        if (!validation.isValid) {
          result.failed++;
          validation.errors.forEach(error => {
            result.errors.push({
              row: i + 1,
              field: 'validation',
              message: error
            });
          });
          continue;
        }

        // Simulate API call to import patient
        try {
          // In real implementation, this would call your API
          // await api.importPatient(organizationId, patientData);
          
          // Simulate processing delay
          await new Promise(resolve => setTimeout(resolve, 50));
          
          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            row: i + 1,
            field: 'import',
            message: error instanceof Error ? error.message : 'Import failed'
          });
        }
      }

      setImportResult(result);
      
      if (result.success > 0) {
        addToast(`Successfully imported ${result.success} patient record(s)`, 'success');
        onImportSuccess(result.success);
      }
      
      if (result.failed > 0) {
        addToast(`Failed to import ${result.failed} record(s). Check details below.`, 'error');
      }

    } catch (error) {
      console.error('Import error:', error);
      addToast('Error processing CSV file', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = `name,email,dateOfBirth,phone,address,city,state,country,postalCode,gender,bloodType,allergies,chronicConditions,emergencyContactName,emergencyContactPhone
John Doe,john.doe@example.com,1985-05-15,+234 801 234 5678,123 Main Street,Lagos,Lagos State,Nigeria,100001,Male,O+,Penicillin,Hypertension,Jane Doe,+234 802 345 6789
Mary Smith,mary.smith@example.com,1990-08-20,+234 803 456 7890,456 Oak Avenue,Abuja,FCT,Nigeria,900001,Female,A+,None,Diabetes,John Smith,+234 804 567 8901`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'patient_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addToast('Template downloaded successfully', 'success');
  };

  const handleReset = () => {
    setFile(null);
    setImportResult(null);
    setShowPreview(false);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const footer = (
    <div className="flex items-center justify-between w-full">
      <Button 
        onClick={handleDownloadTemplate}
        style={{ backgroundColor: 'var(--background-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
      >
        <Icons.ArrowDownIcon className="w-4 h-4 mr-2" />
        Download Template
      </Button>
      <div className="flex gap-3">
        <Button 
          onClick={handleClose}
          style={{ backgroundColor: 'var(--background-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
        >
          Cancel
        </Button>
        {importResult ? (
          <Button onClick={handleReset}>
            Import Another File
          </Button>
        ) : (
          <Button 
            onClick={handleImport}
            isLoading={isProcessing}
            disabled={!file || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Import Patients'}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Import Patient Data" 
      footer={footer}

    >
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-3">
            <Icons.AlertCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Import Patient Records</h4>
              <p className="text-sm text-blue-800 mb-2">
                Upload patient records from other facilities in CSV format.
              </p>
              <p className="text-xs text-blue-700">
                <strong>Support for Excel, PDF, and DOCS is coming soon.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        {!importResult && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Select CSV File
            </label>
            <div className="border-2 border-dashed border-border-primary rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer flex flex-col items-center"
              >
                <Icons.UploadCloudIcon className="w-12 h-12 text-text-secondary mb-3" />
                {file ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-text-primary">{file.name}</p>
                    <p className="text-xs text-text-secondary">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <Button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleReset();
                      }}
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      Choose Different File
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-text-primary mb-1">
                      <span className="text-primary font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-text-secondary">CSV files only</p>
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {showPreview && previewData.length > 0 && !importResult && (
          <div>
            <h4 className="font-semibold text-text-primary mb-3">Data Preview (First 5 Rows)</h4>
            <div className="border border-border-primary rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-border-primary">
                <thead className="bg-background-secondary">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-text-primary">Row</th>
                    {Object.keys(previewData[0]).filter(k => k !== '_rowNumber').map(key => (
                      <th key={key} className="px-3 py-2 text-left text-xs font-semibold text-text-primary">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary">
                  {previewData.map((row, index) => (
                    <tr key={index} className="hover:bg-background-secondary">
                      <td className="px-3 py-2 text-xs text-text-secondary">{row._rowNumber}</td>
                      {Object.entries(row).filter(([k]) => k !== '_rowNumber').map(([key, value]) => (
                        <td key={key} className="px-3 py-2 text-xs text-text-primary">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icons.CheckCircleIcon className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-900">{importResult.success}</p>
                    <p className="text-sm text-green-700">Successfully Imported</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icons.XCircleIcon className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-900">{importResult.failed}</p>
                    <p className="text-sm text-red-700">Failed to Import</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Details */}
            {importResult.errors.length > 0 && (
              <div>
                <h4 className="font-semibold text-text-primary mb-3">Import Errors</h4>
                <div className="max-h-60 overflow-y-auto border border-border-primary rounded-lg">
                  <table className="min-w-full divide-y divide-border-primary">
                    <thead className="bg-background-secondary sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-text-primary">Row</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-text-primary">Field</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-text-primary">Error Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-primary">
                      {importResult.errors.map((error, index) => (
                        <tr key={index} className="hover:bg-background-secondary">
                          <td className="px-4 py-2 text-sm text-text-primary">{error.row}</td>
                          <td className="px-4 py-2 text-sm text-text-secondary">{error.field}</td>
                          <td className="px-4 py-2 text-sm text-red-600">{error.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Required Fields Info */}
        {!importResult && (
          <div className="bg-background-secondary p-4 rounded-lg">
            <h4 className="font-semibold text-text-primary mb-2 text-sm">Required CSV Columns:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <Icons.CheckCircleIcon className="w-3 h-3 text-green-600" />
                <span>name (required)</span>
              </div>
              <div className="flex items-center gap-2">
                <Icons.CheckCircleIcon className="w-3 h-3 text-green-600" />
                <span>email (required)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-text-tertiary" />
                <span>dateOfBirth (YYYY-MM-DD)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-text-tertiary" />
                <span>phone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-text-tertiary" />
                <span>address</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-text-tertiary" />
                <span>gender</span>
              </div>
            </div>
            <p className="text-xs text-text-tertiary mt-3">
              Download the template to see all available columns and proper formatting.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
