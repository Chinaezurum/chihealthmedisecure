import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { LabTest } from '../../types.ts';

interface CreateLabTestRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRequest: (request: Omit<LabTest, 'id' | 'status'>) => void;
  currentUserId: string;
}

const commonLabTests = [
  "Complete Blood Count (CBC)",
  "Basic Metabolic Panel (BMP)",
  "Comprehensive Metabolic Panel (CMP)",
  "Lipid Panel",
  "Thyroid Stimulating Hormone (TSH)",
  "Hemoglobin A1c (HbA1c)",
  "Urinalysis",
  "Liver Function Tests (LFT)",
  "Kidney Function Tests (KFT)",
  "Blood Glucose Test",
  "Cholesterol Test",
  "COVID-19 PCR Test",
  "Malaria Test",
  "HIV Screening",
  "Pregnancy Test (HCG)",
  "Stool Analysis",
  "Sputum Culture",
  "Blood Culture",
  "Other (Specify below)"
];

export const CreateLabTestRequestModal: React.FC<CreateLabTestRequestModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreateRequest, 
  currentUserId 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [patientType, setPatientType] = useState<'existing' | 'walkin' | 'referred'>('walkin');
  const [selectedTest, setSelectedTest] = useState('');
  const [customTest, setCustomTest] = useState('');
  
  const [formData, setFormData] = useState({
    // Patient info
    patientId: '',
    patientName: '',
    patientAge: '',
    patientGender: 'Male' as 'Male' | 'Female' | 'Other',
    patientPhone: '',
    
    // Test info
    testName: '',
    priority: 'Normal',
    
    // Referral info (if applicable)
    referringFacility: '',
    referringDoctor: '',
    clinicalNotes: ''
  });
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.patientName.trim()) {
      alert('Please enter patient name.');
      return;
    }
    
    const finalTestName = selectedTest === 'Other (Specify below)' ? customTest : selectedTest;
    
    if (!finalTestName.trim()) {
      alert('Please select or specify a test name.');
      return;
    }
    
    // Audit logging
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      action: 'create_lab_test_request',
      patientType,
      patientInfo: {
        id: formData.patientId || `WALKIN-${Date.now()}`,
        name: formData.patientName,
        age: formData.patientAge,
        gender: formData.patientGender,
        phone: formData.patientPhone
      },
      testName: finalTestName,
      priority: formData.priority,
      referralInfo: patientType === 'referred' ? {
        facility: formData.referringFacility,
        doctor: formData.referringDoctor
      } : null
    };
    console.log('Lab Test Request Creation Audit:', auditLog);
    
    const newRequest = {
      patientId: formData.patientId || `WALKIN-${Date.now()}`,
      patientName: formData.patientName,
      testName: finalTestName,
      dateOrdered: new Date().toISOString().split('T')[0],
      orderedById: currentUserId,
      result: '',
      ...(formData.priority && { priority: formData.priority }),
      ...(formData.clinicalNotes && { notes: formData.clinicalNotes })
    };
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onCreateRequest(newRequest as any);
      onClose();
      // Reset form
      setFormData({
        patientId: '',
        patientName: '',
        patientAge: '',
        patientGender: 'Male',
        patientPhone: '',
        testName: '',
        priority: 'Normal',
        referringFacility: '',
        referringDoctor: '',
        clinicalNotes: ''
      });
      setSelectedTest('');
      setCustomTest('');
    }, 1000);
  };

  const footerContent = (
    <>
      <button
        onClick={onClose}
        type="button"
        className="inline-flex items-center justify-center px-6 py-3 border border-slate-600 text-base font-medium rounded-md text-slate-200 bg-slate-700 hover:bg-slate-600 transition-colors"
      >
        Cancel
      </button>
      <Button type="submit" form="createRequestForm" isLoading={isLoading}>
        Create Request
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Lab Test Request" footer={footerContent}>
      <div className="space-y-4">
        {/* Patient Type Selection */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Patient Type <span className="text-red-500">*</span>
          </label>
          <select
            value={patientType}
            onChange={(e) => setPatientType(e.target.value as any)}
            className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="existing">Existing Patient (Has ID)</option>
            <option value="walkin">Walk-in Patient (No ID)</option>
            <option value="referred">Referred from Another Facility</option>
          </select>
        </div>
        
        <form id="createRequestForm" onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Information */}
          <div className="bg-background-tertiary p-4 rounded-lg border border-border-primary">
            <h3 className="font-semibold text-text-primary mb-3">Patient Information</h3>
            
            {patientType === 'existing' && (
              <div className="mb-3">
                <Input
                  label="Patient ID"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  placeholder="Enter patient ID to look up"
                  required
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Full Name"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="Enter patient full name"
                required
              />
              
              <Input
                label="Age"
                type="number"
                value={formData.patientAge}
                onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                placeholder="Enter age"
              />
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Gender
                </label>
                <select
                  value={formData.patientGender}
                  onChange={(e) => setFormData({ ...formData, patientGender: e.target.value as any })}
                  className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <Input
                label="Phone Number"
                type="tel"
                value={formData.patientPhone}
                onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          
          {/* Referral Information */}
          {patientType === 'referred' && (
            <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
              <h3 className="font-semibold text-text-primary mb-3">Referral Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Referring Facility"
                  value={formData.referringFacility}
                  onChange={(e) => setFormData({ ...formData, referringFacility: e.target.value })}
                  placeholder="Name of referring facility"
                />
                
                <Input
                  label="Referring Doctor"
                  value={formData.referringDoctor}
                  onChange={(e) => setFormData({ ...formData, referringDoctor: e.target.value })}
                  placeholder="Name of referring doctor"
                />
              </div>
            </div>
          )}
          
          {/* Test Information */}
          <div className="bg-background-tertiary p-4 rounded-lg border border-border-primary">
            <h3 className="font-semibold text-text-primary mb-3">Test Information</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Test Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTest}
                  onChange={(e) => setSelectedTest(e.target.value)}
                  className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select a test...</option>
                  {commonLabTests.map(test => (
                    <option key={test} value={test}>{test}</option>
                  ))}
                </select>
              </div>
              
              {selectedTest === 'Other (Specify below)' && (
                <Input
                  label="Specify Test Name"
                  value={customTest}
                  onChange={(e) => setCustomTest(e.target.value)}
                  placeholder="Enter custom test name"
                  required
                />
              )}
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Clinical Notes / Reason for Test
                </label>
                <textarea
                  value={formData.clinicalNotes}
                  onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Enter clinical notes, symptoms, or reason for test"
                />
              </div>
            </div>
          </div>
        </form>
        
        {/* Audit UI Section */}
        <div className="border-t border-border-primary pt-4 mt-4">
          <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <span className="text-base">✓</span>
              <p className="text-xs font-semibold text-green-800 dark:text-green-200">
                Patient Registration - This action will be logged and tracked
              </p>
            </div>
          </div>
          <div className="bg-background-tertiary p-3 rounded-lg space-y-1">
            <p className="text-xs text-text-secondary">
              <span className="font-medium">Timestamp:</span> {new Date().toLocaleString()}
            </p>
            <p className="text-xs text-text-secondary">
              <span className="font-medium">Lab Technician ID:</span> {currentUserId}
            </p>
            <p className="text-xs text-text-secondary">
              <span className="font-medium">Action:</span> Create Lab Test Request ({patientType})
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
