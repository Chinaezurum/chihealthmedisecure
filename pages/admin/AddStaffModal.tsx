import React, { useState, useMemo } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Select } from '../../components/common/Select.tsx';
import { Organization, UserRole, Department, User } from '../../types.ts';
import { canAccessFeature } from '../../services/permissionService.ts';
import { useToasts } from '../../hooks/useToasts.ts';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizations: Organization[];
  departments: Department[];
  onSave: (staffData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    departmentIds?: string[];
    organizationIds?: string[];
  }) => Promise<void>;
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

export const AddStaffModal: React.FC<AddStaffModalProps> = ({ 
  isOpen, 
  onClose, 
  organizations, 
  departments, 
  onSave, 
  currentUser 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'hcw' as UserRole,
    departmentIds: [] as string[],
  });
  const [assignedOrgIds, setAssignedOrgIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addToast } = useToasts();

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'hcw' as UserRole,
        departmentIds: [],
      });
      setAssignedOrgIds([]);
      setErrors({});
    }
  }, [isOpen]);

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
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleOrgChange = (orgId: string, isChecked: boolean) => {
    setAssignedOrgIds(prev => 
        isChecked ? [...prev, orgId] : prev.filter(id => id !== orgId)
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    // Validate departments for roles that require them
    if (['hcw', 'nurse'].includes(formData.role) && formData.departmentIds.length === 0) {
      newErrors.departmentIds = 'At least one department must be selected for this role';
    }

    // Validate organizations
    if (assignedOrgIds.length === 0) {
      newErrors.organizations = 'At least one organization must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        departmentIds: formData.departmentIds.length > 0 ? formData.departmentIds : undefined,
        organizationIds: assignedOrgIds.length > 0 ? assignedOrgIds : undefined,
      });
      addToast('Staff member created successfully!', 'success');
      onClose();
    } catch (error: any) {
      console.error('Failed to create staff member:', error);
      const errorMessage = error?.message || 'Failed to create staff member. Please try again.';
      addToast(errorMessage, 'error');
      // Set a general error if it's a validation error from the backend
      if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        setErrors(prev => ({ ...prev, email: errorMessage }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <>
      <Button 
        onClick={onClose} 
        type="button" 
        style={{
          backgroundColor: 'var(--background-secondary)', 
          color: 'var(--text-primary)', 
          border: '1px solid var(--border-primary)'
        }}
        disabled={isLoading}
      >
        Cancel
      </Button>
      <Button 
        onClick={handleSubmit} 
        isLoading={isLoading} 
        type="submit" 
        form="addStaffForm"
      >
        Create Staff Member
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Staff Member" footer={footer}>
      <form id="addStaffForm" onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Full Name" 
          name="name" 
          value={formData.name} 
          onChange={handleChange}
          error={errors.name}
          required
        />
        <Input 
          label="Email Address" 
          name="email" 
          type="email" 
          value={formData.email} 
          onChange={handleChange}
          error={errors.email}
          required
        />
        <Input 
          label="Password" 
          name="password" 
          type="password" 
          value={formData.password} 
          onChange={handleChange}
          error={errors.password}
          required
        />
        <Input 
          label="Confirm Password" 
          name="confirmPassword" 
          type="password" 
          value={formData.confirmPassword} 
          onChange={handleChange}
          error={errors.confirmPassword}
          required
        />
        <Select 
          label="Role" 
          name="role" 
          value={formData.role} 
          onChange={handleChange}
          error={errors.role}
          required
        >
          <option value="">Select a role...</option>
          {availableRoles.map(role => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </Select>
        
        {['hcw', 'nurse'].includes(formData.role) && (
            <div className="w-full">
                <label htmlFor="departmentIds" className="form-label">
                    Assigned Departments {['hcw', 'nurse'].includes(formData.role) && <span className="text-red-500">*</span>}
                </label>
                <select
                    id="departmentIds"
                    name="departmentIds"
                    multiple
                    value={formData.departmentIds}
                    onChange={handleChange}
                    className={`form-input h-32 ${errors.departmentIds ? 'form-input-error' : ''}`}
                >
                    {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                </select>
                {errors.departmentIds && (
                  <p className="form-error-text">{errors.departmentIds}</p>
                )}
                <p className="mt-1 text-xs text-text-secondary">Hold Ctrl/Cmd to select multiple.</p>
            </div>
        )}
        
        <div>
            <label className="form-label">
              Accessible Organizations <span className="text-red-500">*</span>
            </label>
            {errors.organizations && (
              <p className="form-error-text">{errors.organizations}</p>
            )}
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

