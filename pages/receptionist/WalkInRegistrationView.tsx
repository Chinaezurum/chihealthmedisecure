import React, { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Select } from '../../components/common/Select.tsx';
import { useToasts } from '../../hooks/useToasts.ts';
import { registerWithEmail } from '../../services/authService.ts';
import { UserPlusIcon } from '../../components/icons/index.tsx';

interface WalkInRegistrationViewProps {
  onRegistrationComplete: (patientId?: string) => void;
  prefillData?: {
    name?: string;
    dateOfBirth?: string;
    allergies?: string;
    currentMedications?: string;
  };
}

export const WalkInRegistrationView: React.FC<WalkInRegistrationViewProps> = ({ onRegistrationComplete, prefillData }) => {
  const { addToast } = useToasts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dateOfBirth: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    bloodType: '',
    allergies: '',
    currentMedications: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (prefillData) {
      setFormData(prev => ({
        ...prev,
        ...prefillData
      }));
    }
  }, [prefillData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Patient name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast('Please fill in all required fields correctly', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-10) + 'Aa1!';
      
      const response = await registerWithEmail(formData.name, formData.email, tempPassword);

      addToast(`Patient registered successfully! Temporary password: ${tempPassword}`, 'success');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        dateOfBirth: '',
        phone: '',
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
        bloodType: '',
        allergies: '',
        currentMedications: ''
      });

      onRegistrationComplete(response?.user?.id);
    } catch (error: any) {
      console.error('Walk-in registration failed:', error);
      addToast(error?.message || 'Failed to register patient. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      dateOfBirth: '',
      phone: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      bloodType: '',
      allergies: '',
      currentMedications: ''
    });
    setErrors({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-text-primary">Walk-In Patient Registration</h2>
          <p className="text-text-secondary mt-1">Register a new patient who has walked into the facility</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" onClick={handleReset} style={{ backgroundColor: 'var(--background-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}>
            Clear Form
          </Button>
        </div>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="content-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-text-primary mb-4 pb-2 border-b border-border-primary">
              Personal Information
            </h3>
          </div>

          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            placeholder="John Doe"
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            placeholder="john.doe@example.com"
          />

          <Input
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
            error={errors.dateOfBirth}
            required
          />

          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            required
            placeholder="+234 XXX XXX XXXX"
          />

          <div className="md:col-span-2">
            <label className="form-label">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="form-input"
              rows={2}
              placeholder="Full residential address"
            />
          </div>

          {/* Emergency Contact */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4 pb-2 border-b border-border-primary">
              Emergency Contact
            </h3>
          </div>

          <Input
            label="Emergency Contact Name"
            name="emergencyContact"
            value={formData.emergencyContact}
            onChange={handleChange}
            placeholder="Next of kin name"
          />

          <Input
            label="Emergency Contact Phone"
            name="emergencyPhone"
            type="tel"
            value={formData.emergencyPhone}
            onChange={handleChange}
            placeholder="+234 XXX XXX XXXX"
          />

          {/* Medical Information */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4 pb-2 border-border-primary">
              Medical Information (Optional)
            </h3>
          </div>

          <Select
            label="Blood Type"
            name="bloodType"
            value={formData.bloodType}
            onChange={handleChange}
          >
            <option value="">Select blood type...</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </Select>

          <div className="md:col-span-2">
            <label className="form-label">Known Allergies</label>
            <textarea
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              className="form-input"
              rows={2}
              placeholder="List any known allergies (medications, food, etc.)"
            />
          </div>

          <div className="md:col-span-2">
            <label className="form-label">Current Medications</label>
            <textarea
              name="currentMedications"
              value={formData.currentMedications}
              onChange={handleChange}
              className="form-input"
              rows={2}
              placeholder="List any current medications and dosages"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 pt-6 border-t border-border-primary flex justify-end gap-3">
          <Button
            type="button"
            onClick={handleReset}
            style={{ backgroundColor: 'var(--background-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            <UserPlusIcon className="w-5 h-5" />
            <span>{isSubmitting ? 'Registering...' : 'Register Patient'}</span>
          </Button>
        </div>

        {/* Information Note */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> A temporary password will be generated for the patient. Please inform them to check their email for login credentials and instructions to change their password.
          </p>
        </div>
      </form>
    </div>
  );
};
