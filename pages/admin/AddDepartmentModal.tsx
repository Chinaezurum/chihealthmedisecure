import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';

interface AddDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export const AddDepartmentModal: React.FC<AddDepartmentModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsLoading(true);
    onCreate(name);
    setIsLoading(false);
    setName('');
  };

  const footer = (
    <>
      <Button onClick={onClose} type="button" className="btn-secondary">Cancel</Button>
      <Button type="submit" form="addDeptForm" isLoading={isLoading}>Create</Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Department" footer={footer}>
      <form id="addDeptForm" onSubmit={handleSubmit} className="space-y-4">
        <Input label="Department Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Cardiology" required />
      </form>
    </Modal>
  );
};
