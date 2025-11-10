import React, { useState, useMemo } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Select } from '../../components/common/Select.tsx';
import { Organization } from '../../types.ts';

interface LinkOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  childOrg: Organization;
  allOrgs: Organization[];
  onLink: (parentId: string) => void;
}

export const LinkOrgModal: React.FC<LinkOrgModalProps> = ({ isOpen, onClose, childOrg, allOrgs, onLink }) => {
  const [selectedParentId, setSelectedParentId] = useState('');

  const availableParents = useMemo(() => {
    return allOrgs.filter(o => o.type === 'Headquarters' && o.id !== childOrg.id);
  }, [allOrgs, childOrg]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedParentId) {
        onLink(selectedParentId);
    }
  };

  const footer = (
    <>
      <Button onClick={onClose} type="button" className="btn-secondary">Cancel</Button>
      <Button onClick={handleSubmit} type="submit" disabled={!selectedParentId}>Link Organization</Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Link ${childOrg.name}`} footer={footer}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-text-secondary">
          Select a Headquarters organization to set as the parent for <strong>{childOrg.name}</strong>.
        </p>
        <Select 
            label="Parent Headquarters"
            value={selectedParentId}
            onChange={(e) => setSelectedParentId(e.target.value)}
            required
        >
            <option value="">Select a headquarters...</option>
            {availableParents.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
            ))}
        </Select>
      </form>
    </Modal>
  );
};
