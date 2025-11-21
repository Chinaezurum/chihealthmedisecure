import React from 'react';
import { Button } from '../../components/common/Button.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import * as Icons from '../../components/icons/index.tsx';

interface MedicationDetailsModalProps {
  medication: {
    id: string;
    name: string;
    category: string;
    stock: number;
    minStock: number;
    unit: string;
    expiryDate: string;
    batchNumber: string;
  };
  onClose: () => void;
  onEdit?: () => void;
}

export const MedicationDetailsModal: React.FC<MedicationDetailsModalProps> = ({ 
  medication, 
  onClose,
  onEdit 
}) => {
  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= minStock) return { label: 'Low Stock', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    if (stock <= minStock * 2) return { label: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    return { label: 'Good Stock', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
  };

  const daysUntilExpiry = Math.ceil((new Date(medication.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry <= 0;

  const status = getStockStatus(medication.stock, medication.minStock);

  return (
    <Modal isOpen={true} title="Medication Details" onClose={onClose}>
      <div className="space-y-4">
        {/* Medication Header */}
        <div className="flex items-start justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Icons.PillIcon className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">{medication.name}</h3>
              <p className="text-sm text-gray-600 mt-1">ID: {medication.id}</p>
            </div>
          </div>
        </div>

        {/* Stock Status Alert */}
        {medication.stock <= medication.minStock && (
          <div className={`p-3 rounded-lg border ${status.bgColor} ${status.borderColor}`}>
            <div className="flex items-center gap-2">
              <Icons.AlertTriangleIcon className={`h-5 w-5 ${status.color}`} />
              <p className={`text-sm font-semibold ${status.color}`}>
                {status.label} - Reorder Required
              </p>
            </div>
          </div>
        )}

        {/* Expiry Alert */}
        {(isExpiringSoon || isExpired) && (
          <div className={`p-3 rounded-lg border ${
            isExpired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center gap-2">
              <Icons.AlertCircleIcon className={`h-5 w-5 ${
                isExpired ? 'text-red-600' : 'text-amber-600'
              }`} />
              <p className={`text-sm font-semibold ${
                isExpired ? 'text-red-600' : 'text-amber-600'
              }`}>
                {isExpired 
                  ? 'Expired - Remove from stock' 
                  : `Expiring in ${daysUntilExpiry} days`
                }
              </p>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">Category</label>
            <p className="text-sm font-semibold text-gray-900">{medication.category}</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">Batch Number</label>
            <p className="text-sm font-semibold text-gray-900 font-mono">{medication.batchNumber}</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">Current Stock</label>
            <p className={`text-lg font-bold ${status.color}`}>
              {medication.stock} {medication.unit}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">Minimum Stock</label>
            <p className="text-lg font-bold text-gray-700">
              {medication.minStock} {medication.unit}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">Expiry Date</label>
            <p className={`text-sm font-semibold ${
              isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-gray-900'
            }`}>
              {new Date(medication.expiryDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">Stock Status</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.bgColor} ${status.borderColor} ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Stock Level Progress Bar */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase">Stock Level</label>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-gray-600">
                  {((medication.stock / (medication.minStock * 3)) * 100).toFixed(0)}% of capacity
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
              <div 
                style={{ width: `${Math.min((medication.stock / (medication.minStock * 3)) * 100, 100)}%` }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                  medication.stock <= medication.minStock 
                    ? 'bg-red-500' 
                    : medication.stock <= medication.minStock * 2 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
                }`}
              ></div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {onEdit && (
            <Button
              onClick={onEdit}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Edit Details
            </Button>
          )}
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
