import React from 'react';
import { Button } from '../../components/common/Button.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import * as Icons from '../../components/icons/index.tsx';

interface DispensingDetailsModalProps {
  record: {
    id: string;
    date: string;
    patientName: string;
    patientId: string;
    medicationName: string;
    quantity: number;
    unit: string;
    dispensedBy: string;
    prescriptionId: string;
  };
  onClose: () => void;
  onPrint: () => void;
}

export const DispensingDetailsModal: React.FC<DispensingDetailsModalProps> = ({ 
  record, 
  onClose,
  onPrint 
}) => {
  return (
    <Modal isOpen={true} title="Dispensing Record Details" onClose={onClose}>
      <div className="space-y-4">
        {/* Record Header */}
        <div className="flex items-start justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Icons.ClipboardListIcon className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">Dispensing ID: {record.id}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(record.date).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Icons.UserIcon className="h-5 w-5 text-gray-500" />
            Patient Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Name</label>
              <p className="text-sm font-semibold text-gray-900 mt-1">{record.patientName}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Patient ID</label>
              <p className="text-sm font-semibold text-gray-900 mt-1 font-mono">{record.patientId}</p>
            </div>
          </div>
        </div>

        {/* Medication Information */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Icons.PillIcon className="h-5 w-5 text-blue-600" />
            Medication Details
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500 uppercase">Medication</label>
              <p className="text-base font-bold text-gray-900 mt-1">{record.medicationName}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Quantity Dispensed</label>
              <p className="text-lg font-bold text-blue-600 mt-1">
                {record.quantity} {record.unit}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Prescription ID</label>
              <p className="text-sm font-semibold text-gray-900 mt-1 font-mono">{record.prescriptionId}</p>
            </div>
          </div>
        </div>

        {/* Dispensing Information */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Icons.CheckCircleIcon className="h-5 w-5 text-green-600" />
            Dispensing Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Dispensed By</label>
              <p className="text-sm font-semibold text-gray-900 mt-1">{record.dispensedBy}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Date & Time</label>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(record.date).toLocaleDateString()}
                <span className="text-gray-500 ml-2">
                  {new Date(record.date).toLocaleTimeString()}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <Icons.CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm font-semibold text-green-800">Successfully Dispensed</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={onPrint}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Icons.FileTextIcon className="h-4 w-4 mr-2" />
            Print Record
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
