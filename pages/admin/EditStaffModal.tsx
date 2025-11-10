import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Select } from '../../components/common/Select.tsx';
import { User, Organization, UserRole, Department } from '../../types.ts';
import { canAccessFeature } from '../../services/permissionService.ts';

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  organizations: Organization[];
  departments: Department[];
  onSave: (user: User & { organizationIds?: string[] }) => void;
  currentUser: User;
}

const allRoles = [
    { value: 'hcw', label: 'Healthcare Worker', feature: 'role_hcw' },
    { value: 'nurse', label: 'Nurse', feature: 'role_nurse' },
    { value: 'pharmacist', label: 'Pharmacist', feature: 'role_pharmacist' },
    { value: 'lab_technician', label: 'Lab Technician', feature: 'role_lab_technician' },
    { value: 'receptionist', label: 'Receptionist', feature: 'role_receptionist' },
    { value: 'logistics', label: 'Logistics', feature: 'role_logistics' },
    { value: 'admin', label: 'Administrator', feature: 'admin_dashboard' },
];

export const EditStaffModal: React.FC<EditStaffModalProps> = ({ isOpen, onClose, user, organizations, departments, onSave, currentUser }) => {
  const [formData, setFormData] = useState({ ...user });
  const [isLoading, setIsLoading] = useState(false);
  const [assignedOrgIds, setAssignedOrgIds] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
        setFormData({ ...user });
        setAssignedOrgIds(user.organizations.map(org => org.id));
    }
  }, [user]);

  const availableRoles = useMemo(() => {
    return allRoles.filter(role => canAccessFeature(currentUser, role.feature));
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, options } = e.target as HTMLSelectElement;
    if (name === 'departmentIds') {
        const selectedDepartmentIds = Array.from(options)
            .filter(option => option.selected)
            .map(option => option.value);
        setFormData(prev => ({ ...prev, departmentIds: selectedDepartmentIds }));
    } else {
      setFormData({ ...formData, [name]: value as UserRole });
    }
  };

  const handleOrgChange = (orgId: string, isChecked: boolean) => {
    setAssignedOrgIds(prev => 
        isChecked ? [...prev, orgId] : prev.filter(id => id !== orgId)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      onSave({ ...formData, organizationIds: assignedOrgIds });
      setIsLoading(false);
    }, 1000);
  };

  const footer = (
    <>
      <Button onClick={onClose} type="button" style={{backgroundColor: 'var(--background-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)'}}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} isLoading={isLoading} type="submit" form="editStaffForm">Save Changes</Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Staff: ${user.name}`} footer={footer}>
      <form id="editStaffForm" onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} />
        <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} />
        <Select label="Role" name="role" value={formData.role} onChange={handleChange}>
            {availableRoles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
        </Select>
        
        {['hcw', 'nurse'].includes(formData.role) && (
            <div className="w-full">
                <label htmlFor="departmentIds" className="form-label">
                    Assigned Departments
                </label>
                <select
                    id="departmentIds"
                    name="departmentIds"
                    multiple
                    value={formData.departmentIds || []}
                    onChange={handleChange}
                    className="form-input h-32"
                >
                    {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-text-secondary">Hold Ctrl/Cmd to select multiple.</p>
            </div>
        )}
        
        <div>
            <label className="form-label">Accessible Organizations</label>
            <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border border-border-primary p-3 bg-background-tertiary">
                {organizations.map(org => (
                    <div key={org.id} className="flex items-center">
                        <input
                            type="checkbox"
                            id={`org-${org.id}`}
                            checked={assignedOrgIds.includes(org.id)}
                            onChange={(e) => handleOrgChange(org.id, e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`org-${org.id}`} className="ml-3 text-sm text-text-primary">
                            {org.name} <span className="text-text-secondary">({org.type})</span>
                        </label>
                    </div>
                ))}
            </div>
        </div>
      </form>
    </Modal>
  );
};