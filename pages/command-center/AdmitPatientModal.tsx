import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Select } from '../../components/common/Select.tsx';
import { Patient, Bed, Room } from '../../types.ts';

interface AdmitPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdmit: (patientId: string, reason: string) => void;
  patients: Patient[];
  beds: Bed[];
  rooms: Room[];
  selectedBedId?: string | null;
}

export const AdmitPatientModal: React.FC<AdmitPatientModalProps> = ({ isOpen, onClose, onAdmit, patients, beds, rooms, selectedBedId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [bedId, setBedId] = useState('');
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedBedId) {
      setBedId(selectedBedId);
    }
    if (!isOpen) { // Reset on close
        setPatientId('');
        setBedId('');
        setReason('');
        setSearchTerm('');
    }
  }, [selectedBedId, isOpen]);

  const filteredPatients = useMemo(() => 
    patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [patients, searchTerm]
  );
  
  const getRoomName = (roomId: string) => rooms.find(r => r.id === roomId)?.name || 'Unknown Room';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !bedId || !reason) {
      alert('Please fill all fields');
      return;
    }
    setIsLoading(true);
    // onAdmit will handle API call and state updates
    onAdmit(patientId, reason);
    setIsLoading(false);
  };

  const footer = (
    <>
      <Button onClick={onClose} type="button" className="btn-secondary">Cancel</Button>
      <Button type="submit" form="admitForm" isLoading={isLoading} disabled={!patientId || !bedId || !reason}>
        Confirm Admission
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Admit Patient" footer={footer}>
      <form id="admitForm" onSubmit={handleSubmit} className="space-y-4">
        <div>
            <Input label="Search Patient" name="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Type to search..." />
            <div className="searchable-select-list">
                {filteredPatients.map(p => (
                    <div key={p.id} onClick={() => setPatientId(p.id)} className={`searchable-select-item ${patientId === p.id ? 'selected' : ''}`}>
                        {p.name} ({p.id})
                    </div>
                ))}
            </div>
        </div>
        
        <Select label="Assign Bed" name="bedId" value={bedId} onChange={e => setBedId(e.target.value)} required>
          <option value="">Select an available bed...</option>
          {beds.map(bed => (
            <option key={bed.id} value={bed.id}>
              {getRoomName(bed.roomId)} - {bed.name}
            </option>
          ))}
        </Select>

        <Input label="Reason for Admission" name="reason" value={reason} onChange={e => setReason(e.target.value)} required />
      </form>
    </Modal>
  );
};
