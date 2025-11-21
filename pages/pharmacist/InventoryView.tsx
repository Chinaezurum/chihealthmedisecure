import React, { useState } from 'react';
import * as Icons from '../../components/icons';
import { AddMedicationModal } from './AddMedicationModal.tsx';
import { AdjustStockModal } from './AdjustStockModal.tsx';
import { MedicationDetailsModal } from './MedicationDetailsModal.tsx';

interface Medication {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  expiryDate: string;
  batchNumber: string;
}

export const InventoryView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [adjustingMed, setAdjustingMed] = useState<Medication | null>(null);
  const [viewingMed, setViewingMed] = useState<Medication | null>(null);

  // Mock data
  const mockInventory: Medication[] = [
    { id: 'MED001', name: 'Paracetamol 500mg', category: 'Analgesics', stock: 500, minStock: 100, unit: 'tablets', expiryDate: '2025-12-31', batchNumber: 'B2024001' },
    { id: 'MED002', name: 'Amoxicillin 250mg', category: 'Antibiotics', stock: 250, minStock: 50, unit: 'capsules', expiryDate: '2025-08-15', batchNumber: 'B2024002' },
    { id: 'MED003', name: 'Ibuprofen 400mg', category: 'Analgesics', stock: 30, minStock: 100, unit: 'tablets', expiryDate: '2025-06-20', batchNumber: 'B2024003' },
    { id: 'MED004', name: 'Omeprazole 20mg', category: 'Gastrointestinal', stock: 180, minStock: 50, unit: 'capsules', expiryDate: '2026-01-10', batchNumber: 'B2024004' },
    { id: 'MED005', name: 'Metformin 500mg', category: 'Antidiabetic', stock: 400, minStock: 100, unit: 'tablets', expiryDate: '2025-11-25', batchNumber: 'B2024005' },
  ];

  const categories = ['all', 'Analgesics', 'Antibiotics', 'Gastrointestinal', 'Antidiabetic'];

  const filteredInventory = mockInventory.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         med.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || med.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= minStock) return { label: 'Low Stock', color: 'bg-red-100 text-red-800 border-red-200' };
    if (stock <= minStock * 2) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { label: 'Good Stock', color: 'bg-green-100 text-green-800 border-green-200' };
  };

  const lowStockCount = mockInventory.filter(med => med.stock <= med.minStock).length;

  const handleAddSuccess = () => {
    console.log('Medication added successfully');
    // Refresh data here
  };

  const handleAdjustSuccess = () => {
    console.log('Stock adjusted successfully');
    // Refresh data here
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-sm text-gray-600 mt-1">Track medication stock levels and expiry dates</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
        >
          <Icons.UserPlusIcon className="h-4 w-4 mr-2" />
          Add Medication
        </button>
      </div>

      {/* Alert for low stock */}
      {lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <Icons.AlertTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-900">Low Stock Alert</h3>
            <p className="text-sm text-red-700 mt-1">
              {lowStockCount} medication{lowStockCount > 1 ? 's' : ''} below minimum stock level. Consider reordering.
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Icons.SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by medication name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Medication
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Batch / Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map(med => {
                const status = getStockStatus(med.stock, med.minStock);
                return (
                  <tr key={med.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Icons.PillIcon className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{med.name}</div>
                          <div className="text-xs text-gray-500">{med.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {med.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {med.stock} {med.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {med.minStock} {med.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>{med.batchNumber}</div>
                      <div className="text-xs text-gray-500">
                        Exp: {new Date(med.expiryDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button 
                        onClick={() => setAdjustingMed(med)}
                        className="text-blue-600 hover:text-blue-800 font-semibold mr-3"
                      >
                        Adjust Stock
                      </button>
                      <button 
                        onClick={() => setViewingMed(med)}
                        className="text-gray-600 hover:text-gray-800 font-semibold"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredInventory.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Icons.ArchiveIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">No medications found</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.ArchiveIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{mockInventory.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Icons.AlertTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icons.DollarSignIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">₦2.5M</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddMedicationModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {adjustingMed && (
        <AdjustStockModal
          medication={adjustingMed}
          onClose={() => setAdjustingMed(null)}
          onSuccess={handleAdjustSuccess}
        />
      )}

      {viewingMed && (
        <MedicationDetailsModal
          medication={viewingMed}
          onClose={() => setViewingMed(null)}
        />
      )}
    </div>
  );
};
