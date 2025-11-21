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
    // New demographic fields
    phoneNumbers?: string[];
    address?: string;
    emails?: string[];
    certificationId?: string;
    certificationStatus?: 'Active' | 'Expired' | 'Pending' | 'Suspended';
    certificationExpiry?: string;
    specialization?: string;
  }) => Promise<void>;
  currentUser: User;
}

const allRoles = [
    { value: 'hcw', label: 'Healthcare Worker', feature: 'role_hcw' },
    { value: 'nurse', label: 'Nurse', feature: 'role_nurse' },
    { value: 'pharmacist', label: 'Pharmacist', feature: 'role_pharmacist' },
    { value: 'lab_technician', label: 'Lab Technician', feature: 'role_lab_technician' },
    { value: 'receptionist', label: 'Receptionist', feature: 'role_receptionist' },
    { value: 'logistics', label: 'Logistics', feature: 'logistics' },
    { value: 'radiologist', label: 'Radiologist', feature: 'role_hcw' },
    { value: 'dietician', label: 'Dietician', feature: 'role_hcw' },
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
    // New demographic fields
    phoneNumber: '',
    secondaryPhoneNumber: '',
    secondaryEmail: '',
    address: '',
    certificationId: '',
    certificationStatus: '' as 'Active' | 'Expired' | 'Pending' | 'Suspended' | '',
    certificationExpiry: '',
    specialization: '',
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
        phoneNumber: '',
        secondaryPhoneNumber: '',
        secondaryEmail: '',
        address: '',
        certificationId: '',
        certificationStatus: '',
        certificationExpiry: '',
        specialization: '',
      });
      setAssignedOrgIds([]);
      setErrors({});
    }
  }, [isOpen]);

  const availableRoles = useMemo(() => {
    return allRoles.filter(role => canAccessFeature(currentUser, role.feature));
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const { name, value } = target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      const staffData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        departmentIds: formData.departmentIds.length > 0 ? formData.departmentIds : undefined,
        organizationIds: assignedOrgIds.length > 0 ? assignedOrgIds : undefined,
      };

      // Add demographic fields if provided
      if (formData.phoneNumber.trim() || formData.secondaryPhoneNumber.trim()) {
        const phones = [];
        if (formData.phoneNumber.trim()) phones.push(formData.phoneNumber.trim());
        if (formData.secondaryPhoneNumber.trim()) phones.push(formData.secondaryPhoneNumber.trim());
        staffData.phoneNumbers = phones;
      }
      if (formData.secondaryEmail.trim()) {
        staffData.emails = [formData.email.trim(), formData.secondaryEmail.trim()];
      }
      if (formData.address.trim()) {
        staffData.address = formData.address.trim();
      }
      if (formData.certificationId.trim()) {
        staffData.certificationId = formData.certificationId.trim();
      }
      if (formData.certificationStatus) {
        staffData.certificationStatus = formData.certificationStatus;
      }
      if (formData.certificationExpiry) {
        staffData.certificationExpiry = formData.certificationExpiry;
      }
      if (formData.specialization.trim()) {
        staffData.specialization = formData.specialization.trim();
      }

      await onSave(staffData);
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

        {/* Divider */}
        <div className="border-t border-border-primary pt-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Contact Information</h3>
        </div>

        <Input 
          label="Phone Number" 
          name="phoneNumber" 
          type="tel" 
          value={formData.phoneNumber} 
          onChange={handleChange}
          placeholder="e.g. +234 801 234 5678"
        />
        <Input 
          label="Secondary Phone Number (Optional)" 
          name="secondaryPhoneNumber" 
          type="tel" 
          value={formData.secondaryPhoneNumber} 
          onChange={handleChange}
          placeholder="e.g. +234 802 345 6789"
        />
        <Input 
          label="Secondary Email (Optional)" 
          name="secondaryEmail" 
          type="email" 
          value={formData.secondaryEmail} 
          onChange={handleChange}
          placeholder="e.g. secondary@example.com"
        />
        <div className="w-full">
          <label className="form-label">Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-border-primary rounded-md bg-background-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Street address, city, state, country"
          />
        </div>

        {/* Professional Credentials Section */}
        {['hcw', 'nurse', 'pharmacist', 'lab_technician', 'radiologist', 'dietician'].includes(formData.role) && (
          <>
            <div className="border-t border-border-primary pt-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Professional Credentials</h3>
            </div>
            
            <Input 
              label="Certification/License ID" 
              name="certificationId" 
              value={formData.certificationId} 
              onChange={handleChange}
              placeholder="e.g. MD12345 or RN67890"
            />
            <Select 
              label="Certification Status" 
              name="certificationStatus" 
              value={formData.certificationStatus} 
              onChange={handleChange}
            >
              <option value="">Select status...</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Expired">Expired</option>
              <option value="Suspended">Suspended</option>
            </Select>
            <Input 
              label="Certification Expiry Date" 
              name="certificationExpiry" 
              type="date" 
              value={formData.certificationExpiry} 
              onChange={handleChange}
            />
            <Input 
              label="Specialization" 
              name="specialization" 
              value={formData.specialization} 
              onChange={handleChange}
              placeholder="e.g. Cardiology, Pediatrics, etc."
            />
          </>
        )}

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
                <label className="form-label">
                    Assigned Departments {['hcw', 'nurse'].includes(formData.role) && <span className="text-red-500">*</span>}
                </label>
                {errors.departmentIds && (
                  <p className="form-error-text">{errors.departmentIds}</p>
                )}
                <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border border-border-primary p-3 bg-background-tertiary">
                    {departments.length > 0 ? departments.map(dept => (
                        <div key={dept.id} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`dept-${dept.id}`}
                                checked={formData.departmentIds.includes(dept.id)}
                                onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    setFormData(prev => ({
                                        ...prev,
                                        departmentIds: isChecked
                                            ? [...prev.departmentIds, dept.id]
                                            : prev.departmentIds.filter(id => id !== dept.id)
                                    }));
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor={`dept-${dept.id}`} className="ml-3 text-sm text-text-primary">
                                {dept.name}
                            </label>
                        </div>
                    )) : (
                        <p className="text-sm text-text-secondary">No departments available</p>
                    )}
                </div>
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

