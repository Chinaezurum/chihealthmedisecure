import React, { useState } from 'react';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { BillingCode } from '../../types.ts';
import { AddBillingCodeModal } from './AddBillingCodeModal.tsx';
import { EditBillingCodeModal } from './EditBillingCodeModal.tsx';

interface PricingCatalogViewProps {
  billingCodes: BillingCode[];
  onRefresh?: () => void;
}

export const PricingCatalogView: React.FC<PricingCatalogViewProps> = ({ billingCodes, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCode, setEditingCode] = useState<BillingCode | null>(null);

  const filteredCodes = billingCodes.filter(code => {
    const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         code.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || code.category === categoryFilter;
    return matchesSearch && matchesCategory && code.isActive;
  });

  const categories = ['All', 'Consultation', 'Procedure', 'Lab', 'Imaging', 'Medication', 'Other'];

  const handleAddSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleEditSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
    setEditingCode(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">Pricing Catalog</h2>
        <Button onClick={() => setShowAddModal(true)}>
          Add Billing Code
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          label=""
          placeholder="Search by code or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="content-card">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Category</th>
              <th>Description</th>
              <th>Price</th>
              <th>Insurance Coverage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCodes.map(code => (
              <tr key={code.id}>
                <td className="font-mono font-semibold">{code.code}</td>
                <td>
                  <span className={`status-chip status-chip-blue`}>
                    {code.category}
                  </span>
                </td>
                <td>{code.description}</td>
                <td className="font-mono">₦{code.price.toLocaleString()}</td>
                <td>{code.insuranceCoverage}%</td>
                <td>
                  <Button onClick={() => setEditingCode(code)}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCodes.length === 0 && (
          <p className="text-center text-text-secondary py-8">No billing codes found</p>
        )}
      </div>

      {showAddModal && (
        <AddBillingCodeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {editingCode && (
        <EditBillingCodeModal
          billingCode={editingCode}
          onClose={() => setEditingCode(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};
