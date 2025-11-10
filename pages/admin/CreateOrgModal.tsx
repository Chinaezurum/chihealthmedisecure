import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Select } from '../../components/common/Select.tsx';
import { Organization } from '../../types.ts';

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (orgData: Omit<Organization, 'id'>) => void;
}

export const CreateOrgModal: React.FC<CreateOrgModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const orgData = {
      name: formData.get('name') as string,
      type: formData.get('type') as Organization['type'],
      // Fix: Add a default planId to satisfy the Organization type.
      planId: 'basic' as const,
    };

    if (!orgData.name || !orgData.type) {
        alert("Please fill all fields");
        return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        onCreate(orgData);
        setIsLoading(false);
    }, 1000);
  };

  const footer = (
    <>
      <Button onClick={onClose} type="button" style={{backgroundColor: 'var(--background-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)'}}>
        Cancel
      </Button>
      <Button type="submit" form="createOrgForm" isLoading={isLoading}>
        Create Organization
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Organization" footer={footer}>
      <form id="createOrgForm" onSubmit={handleSubmit} className="space-y-4">
        <Input label="Organization Name" name="name" required />
        <Select label="Organization Type" name="type" required>
            <option value="">Select type...</option>
            <option value="Hospital">Hospital</option>
            <option value="Clinic">Clinic</option>
            <option value="Pharmacy">Pharmacy</option>
            <option value="Laboratory">Laboratory</option>
            <option value="Headquarters">Headquarters</option>
        </Select>
        <Input label="Administrator Email (to be invited)" name="adminEmail" type="email" placeholder="e.g. new.admin@facility.com" required />
      </form>
    </Modal>
  );
};