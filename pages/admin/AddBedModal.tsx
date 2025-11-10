import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';

interface AddBedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, roomId: string) => void;
  roomId: string;
}

export const AddBedModal: React.FC<AddBedModalProps> = ({ isOpen, onClose, onCreate, roomId }) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsLoading(true);
    onCreate(name, roomId);
    setIsLoading(false);
    setName('');
  };

  const footer = (
    <>
      <Button onClick={onClose} type="button" className="btn-secondary">Cancel</Button>
      <Button type="submit" form="addBedForm" isLoading={isLoading}>Create</Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Bed to Room`} footer={footer}>
      <form id="addBedForm" onSubmit={handleSubmit} className="space-y-4">
        <Input label="Bed Name / Number" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Bed 1, Bed A" required />
      </form>
    </Modal>
  );
};
