import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Select } from '../../components/common/Select.tsx';
import { RoomType } from '../../types.ts';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, type: RoomType) => void;
}

export const AddRoomModal: React.FC<AddRoomModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<RoomType>('Patient Room');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type) return;
    setIsLoading(true);
    onCreate(name, type);
    setIsLoading(false);
    setName('');
    setType('Patient Room');
  };

  const footer = (
    <>
      <Button onClick={onClose} type="button" className="btn-secondary">Cancel</Button>
      <Button type="submit" form="addRoomForm" isLoading={isLoading}>Create</Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Room" footer={footer}>
      <form id="addRoomForm" onSubmit={handleSubmit} className="space-y-4">
        <Input label="Room Name / Number" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Room 301, Consulting 5" required />
        <Select label="Room Type" value={type} onChange={e => setType(e.target.value as RoomType)} required>
            <option value="Patient Room">Patient Room</option>
            <option value="Consulting Room">Consulting Room</option>
            <option value="Operating Theater">Operating Theater</option>
            <option value="Utility">Utility</option>
        </Select>
      </form>
    </Modal>
  );
};
