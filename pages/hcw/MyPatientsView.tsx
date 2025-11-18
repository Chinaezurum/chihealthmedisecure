
import React, { useState } from 'react';
import { Patient } from '../../types.ts';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { SearchIcon } from '../../components/icons/index.tsx';

interface MyPatientsViewProps {
    patients: Patient[];
    onSelectPatient: (patient: Patient) => void;
}

const PatientCard: React.FC<{ patient: Patient; onSelect: (patient: Patient) => void }> = ({ patient, onSelect }) => {
    return (
        <div className="content-card p-4 hover:shadow-lg transition-shadow duration-200">
             <img 
                src={`https://i.pravatar.cc/150?u=${patient.id}`} 
                alt={patient.name}
                className="w-20 h-20 rounded-full mx-auto border-4 border-primary shadow-md"
            />
            <div className="text-center mt-3">
                <p className="font-bold text-lg text-text-primary">{patient.name}</p>
                <p className="text-sm text-text-secondary">DOB: {patient.dateOfBirth || 'N/A'}</p>
                <p className="text-sm text-text-secondary">Last Visit: {patient.lastVisit || 'No visits'}</p>
            </div>
            <div className="mt-4">
                 <Button onClick={() => onSelect(patient)} fullWidth>View EHR</Button>
            </div>
        </div>
    );
};


export const MyPatientsView: React.FC<MyPatientsViewProps> = ({ patients, onSelectPatient }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-text-primary">My Patients</h2>
        <p className="text-text-secondary mt-1">View and manage your assigned patients</p>
      </div>

      {/* Search */}
      <div className="content-card p-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <Input
            label=""
            type="text"
            placeholder="Search patients by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Patient Grid */}
      {filteredPatients.length === 0 ? (
        <div className="content-card p-12 text-center">
          <p className="text-text-secondary text-lg">No patients found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPatients.map(p => (
              <PatientCard key={p.id} patient={p} onSelect={onSelectPatient} />
          ))}
        </div>
      )}
    </div>
  );
};