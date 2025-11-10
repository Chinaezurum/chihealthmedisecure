
import React from 'react';
import { Patient } from '../../types.ts';
import { Button } from '../../components/common/Button.tsx';

interface MyPatientsViewProps {
    patients: Patient[];
    onSelectPatient: (patient: Patient) => void;
}

const PatientCard: React.FC<{ patient: Patient; onSelect: (patient: Patient) => void }> = ({ patient, onSelect }) => {
    return (
        <div className="patient-card">
             <img 
                src={`https://i.pravatar.cc/150?u=${patient.id}`} 
                alt={patient.name}
                className="w-24 h-24 rounded-full mx-auto border-4 border-background-tertiary shadow-md"
            />
            <div className="text-center mt-4">
                <p className="font-bold text-lg text-text-primary">{patient.name}</p>
                <p className="text-sm text-text-secondary">DOB: {patient.dateOfBirth}</p>
                <p className="text-sm text-text-secondary">Last Visit: {patient.lastVisit}</p>
            </div>
            <div className="mt-6">
                 <Button onClick={() => onSelect(patient)} fullWidth>View EHR</Button>
            </div>
        </div>
    );
};


export const MyPatientsView: React.FC<MyPatientsViewProps> = ({ patients, onSelectPatient }) => {

  return (
    <>
      <h2 className="text-3xl font-bold text-text-primary mb-6">My Patients</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {patients.map(p => (
            <PatientCard key={p.id} patient={p} onSelect={onSelectPatient} />
        ))}
      </div>
    </>
  );
};