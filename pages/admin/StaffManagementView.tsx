import React, { useState } from 'react';
import { User, UserRole, Organization, Department } from '../../types.ts';
import { Button } from '../../components/common/Button.tsx';
import { EditStaffModal } from './EditStaffModal.tsx';
import { AddStaffModal } from './AddStaffModal.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { UsersIcon } from '../../components/icons/index.tsx';
import * as api from '../../services/apiService.ts';

interface StaffManagementViewProps {
  staff: User[];
  organizations: Organization[];
  departments: Department[];
  onUpdateUser: (user: User) => void;
  currentUser: User;
  onRefresh?: () => void;
}

const roleDisplay: Record<UserRole, string> = {
  admin: 'Administrator',
  hcw: 'Healthcare Worker',
  nurse: 'Nurse',
  patient: 'Patient',
  pharmacist: 'Pharmacist',
  lab_technician: 'Lab Technician',
  receptionist: 'Receptionist',
  logistics: 'Logistics',
  command_center: 'Command Center',
  accountant: 'Accountant',
  radiologist: 'Radiologist',
  dietician: 'Dietician',
  it_support: 'IT Support',
};export const StaffManagementView: React.FC<StaffManagementViewProps> = ({ 
  staff, 
  organizations, 
  departments, 
  onUpdateUser, 
  currentUser,
  onRefresh 
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  // ...existing code...

  const handleEdit = (user: User) => {
    setSelectedStaff(user);
    setIsEditModalOpen(true);
  };

  const handleEditSave = (updatedUser: User) => {
    onUpdateUser(updatedUser);
    setIsEditModalOpen(false);
    setSelectedStaff(null);
  };

  const handleAddStaff = async (staffData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    departmentIds?: string[];
    organizationIds?: string[];
  }): Promise<void> => {
    try {
      await api.createStaff(staffData);
      // Refresh the staff list
      if (onRefresh) {
        onRefresh();
      } else {
        // Fallback: reload the page if no refresh callback
        window.location.reload();
      }
    } catch (error: any) {
      // Error is already handled in AddStaffModal, but re-throw so modal can handle it
      throw error;
    }
  };
  
  const getDepartmentNames = (departmentIds?: string[]) => {
    if (!departmentIds || departmentIds.length === 0) return 'Unassigned';
    return departmentIds
      .map(id => departments.find(d => d.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-text-primary">Staff Management</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>Add New Staff Member</Button>
      </div>
      <div className="content-card">
        {staff.length > 0 ? (
          <table className="styled-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Certification</th>
                <th>Status</th>
                <th>Departments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(user => (
                <tr key={user.id}>
                  <td className="font-medium">{user.name}</td>
                  <td>{user.email}</td>
                  <td className="text-sm">{user.phoneNumbers?.[0] || 'N/A'}</td>
                  <td>{roleDisplay[user.role]}</td>
                  <td className="text-sm">
                    {user.certificationId ? (
                      <span title={user.certificationId}>{user.certificationId.substring(0, 10)}...</span>
                    ) : 'N/A'}
                  </td>
                  <td>
                    {user.certificationStatus && (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.certificationStatus === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        user.certificationStatus === 'Expired' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        user.certificationStatus === 'Pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                      }`}>
                        {user.certificationStatus}
                      </span>
                    )}
                  </td>
                  <td className="text-sm">{getDepartmentNames(user.departmentIds)}</td>
                  <td>
                    <Button onClick={() => handleEdit(user)}>Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState icon={UsersIcon} title="No Staff Members Found" message="You can add new staff members using the button above." />
        )}
      </div>

      <AddStaffModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        organizations={organizations}
        departments={departments}
        onSave={handleAddStaff}
        currentUser={currentUser}
      />
      
      {selectedStaff && (
        <EditStaffModal 
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedStaff(null);
            }}
            user={selectedStaff}
            organizations={organizations}
            departments={departments}
            onSave={handleEditSave}
            currentUser={currentUser}
        />
      )}
    </>
  );
};