import React, { useState } from 'react';
import { Department, Room, Bed } from '../../types.ts';
import { Button } from '../../components/common/Button.tsx';
import { useToasts } from '../../hooks/useToasts.ts';
import * as api from '../../services/apiService.ts';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { AddDepartmentModal } from './AddDepartmentModal.tsx';
import { AddRoomModal } from './AddRoomModal.tsx';
import { AddBedModal } from './AddBedModal.tsx';

interface FacilityManagementViewProps {
  data: {
    departments: Department[];
    rooms: Room[];
    beds: Bed[];
  };
  onUpdate: () => void;
}

const DepartmentManager: React.FC<{ departments: Department[], onAdd: () => void }> = ({ departments, onAdd }) => (
    <div className="content-card">
        <div className="p-6 border-b border-border-primary flex justify-between items-center">
            <h3 className="text-xl font-semibold text-text-primary">Departments</h3>
            <Button onClick={onAdd}>Add Department</Button>
        </div>
        <div className="p-6">
            {departments.length > 0 ? (
                <ul className="space-y-2">
                    {departments.map(dept => <li key={dept.id} className="p-3 bg-background-tertiary rounded-md font-medium">{dept.name}</li>)}
                </ul>
            ) : <EmptyState title="No Departments" message="Add your facility's departments." />}
        </div>
    </div>
);

const RoomManager: React.FC<{ rooms: Room[], beds: Bed[], onAddRoom: () => void, onAddBed: (roomId: string) => void }> = ({ rooms, beds, onAddRoom, onAddBed }) => (
    <div className="content-card">
        <div className="p-6 border-b border-border-primary flex justify-between items-center">
            <h3 className="text-xl font-semibold text-text-primary">Rooms & Resources</h3>
            <Button onClick={onAddRoom}>Add Room</Button>
        </div>
        <div className="p-6 space-y-4">
            {rooms.length > 0 ? rooms.map(room => (
                <div key={room.id} className="p-4 border border-border-primary rounded-lg">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-text-primary">{room.name} <span className="text-sm font-normal text-text-secondary">({room.type})</span></h4>
                        {room.type === 'Patient Room' && <Button onClick={() => onAddBed(room.id)} className="btn-secondary">Add Bed</Button>}
                    </div>
                    {room.type === 'Patient Room' && (
                        <div className="pl-4 mt-2 border-l-2 border-border-primary space-y-1">
                            {beds.filter(b => b.roomId === room.id).map(bed => (
                                <p key={bed.id} className="text-sm text-text-secondary">{bed.name}</p>
                            ))}
                        </div>
                    )}
                </div>
            )) : <EmptyState title="No Rooms" message="Add patient rooms, consulting rooms, etc." />}
        </div>
    </div>
);


export const FacilityManagementView: React.FC<FacilityManagementViewProps> = ({ data, onUpdate }) => {
    const { addToast } = useToasts();

    const [modalState, setModalState] = useState<{ type: 'dept' | 'room' | 'bed'; data?: any } | null>(null);

    const handleCreateDepartment = async (name: string) => {
        await api.createDepartment(name);
        addToast('Department created successfully.', 'success');
        onUpdate();
        setModalState(null);
    };

    const handleCreateRoom = async (name: string, type: string) => {
        await api.createRoom(name, type);
        addToast('Room created successfully.', 'success');
        onUpdate();
        setModalState(null);
    };
    
    const handleCreateBed = async (name: string, roomId: string) => {
        await api.createBed(name, roomId);
        addToast('Bed created successfully.', 'success');
        onUpdate();
        setModalState(null);
    };

    return (
        <>
            <h2 className="text-3xl font-bold text-text-primary mb-6">Facility Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <DepartmentManager departments={data.departments} onAdd={() => setModalState({ type: 'dept' })} />
                <RoomManager rooms={data.rooms} beds={data.beds} onAddRoom={() => setModalState({ type: 'room' })} onAddBed={(roomId) => setModalState({ type: 'bed', data: { roomId } })}/>
            </div>

            <AddDepartmentModal 
                isOpen={modalState?.type === 'dept'}
                onClose={() => setModalState(null)}
                onCreate={handleCreateDepartment}
            />
            <AddRoomModal
                isOpen={modalState?.type === 'room'}
                onClose={() => setModalState(null)}
                onCreate={handleCreateRoom}
            />
            {modalState?.type === 'bed' && (
                <AddBedModal
                    isOpen={true}
                    onClose={() => setModalState(null)}
                    onCreate={handleCreateBed}
                    roomId={modalState.data.roomId}
                />
            )}
        </>
    );
};
