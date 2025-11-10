import React, { useState, useMemo } from 'react';
import { Input } from '../../components/common/Input.tsx';
import { Button } from '../../components/common/Button.tsx';
import { PasswordStrength } from '../../components/PasswordStrength.tsx';
import { checkPasswordStrength } from '../../utils/validation.ts';
import { Select } from '../../components/common/Select.tsx';
import * as api from '../../services/apiService.ts';
import { Organization } from '../../types.ts';
import { CheckCircleIcon } from '../../components/icons/index.tsx';

interface RegisterOrgProps {
  onNavigate: () => void;
}

const ProgressIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => (
    <div className="wizard-progress">
        <div className={`wizard-step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="wizard-step-number">1</div>
            <div className="wizard-step-label">Organization</div>
        </div>
        <div className={`wizard-step-line ${currentStep >= 2 ? 'active' : ''}`} />
        <div className={`wizard-step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="wizard-step-number">2</div>
            <div className="wizard-step-label">Administrator</div>
        </div>
         <div className={`wizard-step-line ${currentStep >= 3 ? 'active' : ''}`} />
        <div className={`wizard-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="wizard-step-number">
              {currentStep < 3 ? '3' : <CheckCircleIcon className="w-5 h-5" />}
            </div>
            <div className="wizard-step-label">Complete</div>
        </div>
    </div>
);


const RegisterOrg: React.FC<RegisterOrgProps> = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: '' as Organization['type'],
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [newOrgDetails, setNewOrgDetails] = useState<{ orgId: string, orgName: string } | null>(null);

  const passwordStrength = useMemo(() => checkPasswordStrength(formData.password), [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name] || errors.form) {
        setErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[e.target.name];
            delete newErrors.form;
            return newErrors;
        });
    }
  };
  
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.organizationName.trim()) newErrors.organizationName = 'Organization name is required';
    if (!formData.organizationType) newErrors.organizationType = 'Please select an organization type';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }
  
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.adminName.trim()) newErrors.adminName = 'Administrator name is required';
    if (!formData.adminEmail || !/\S+@\S+\.\S+/.test(formData.adminEmail)) {
      newErrors.adminEmail = 'A valid admin email is required';
    }
    if (passwordStrength.score < 3) newErrors.password = 'Password is not strong enough';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  }

  const handleBack = () => {
    setCurrentStep(1);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    
    setIsLoading(true);
    try {
      const { organization } = await api.registerOrganizationAndAdmin(
        { name: formData.organizationName, type: formData.organizationType },
        { name: formData.adminName, email: formData.adminEmail, password: formData.password }
      );
      setNewOrgDetails({ orgId: organization.id, orgName: organization.name });
      setCurrentStep(3);
    } catch (error) {
      console.error(error);
      // Fix: Check for a more generic 'email-already-in-use' message that the backend sends.
      if (error instanceof Error && error.message.includes('email-already-in-use')) {
        setErrors({ adminEmail: 'An account with this admin email already exists.' });
      } else {
        setErrors({ form: 'An unexpected error occurred during registration. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card" style={{maxWidth: '36rem'}}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Register Your Healthcare Facility</h1>
          <p className="text-text-secondary mt-2">Onboard your organization to the ChiHealth platform.</p>
        </div>
        
        <ProgressIndicator currentStep={currentStep} />

        <form onSubmit={handleSubmit} className="mt-8">
            <div className="form-steps-wrapper">
                <div className="form-steps-container" style={{ transform: `translateX(-${(currentStep - 1) * 100}%)` }}>
                    {/* Step 1 */}
                    <div className="form-step">
                        <div className="form-section">
                            <legend className="form-section-legend">Organization Details</legend>
                            <Input name="organizationName" type="text" label="Organization / Facility Name" value={formData.organizationName} onChange={handleChange} error={errors.organizationName} required />
                            <Select label="Organization Type" name="organizationType" value={formData.organizationType} onChange={handleChange} error={errors.organizationType} required>
                                <option value="">Select a type...</option>
                                <option value="Hospital">Hospital</option>
                                <option value="Clinic">Clinic</option>
                                <option value="Pharmacy">Pharmacy</option>
                                <option value="Laboratory">Laboratory</option>
                            </Select>
                        </div>
                    </div>
                    {/* Step 2 */}
                    <div className="form-step">
                        <div className="form-section">
                            <legend className="form-section-legend">Administrator Account</legend>
                            <Input name="adminName" type="text" label="Your Full Name" value={formData.adminName} onChange={handleChange} error={errors.adminName} required />
                            <Input name="adminEmail" type="email" label="Your Email Address" value={formData.adminEmail} onChange={handleChange} error={errors.adminEmail} required />
                            <div>
                                <Input name="password" type="password" label="Password" value={formData.password} onChange={handleChange} error={errors.password} required />
                                <PasswordStrength strength={passwordStrength} />
                            </div>
                            <Input name="confirmPassword" type="password" label="Confirm Password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required />
                        </div>
                    </div>
                    {/* Step 3: Success */}
                    <div className="form-step">
                        <div className="success-container">
                            <CheckCircleIcon className="success-icon" />
                            <h2 className="text-2xl font-bold text-text-primary">Registration Complete!</h2>
                            <p className="text-text-secondary mt-2">Your organization has been successfully created.</p>
                            <div className="success-details">
                                <p>Organization Name: <span>{newOrgDetails?.orgName}</span></p>
                                <p>Organization ID: <span>{newOrgDetails?.orgId}</span></p>
                                <p className="mt-2">You can now sign in with the administrator account you created.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {errors.form && <p className="form-error-text text-center mt-4">{errors.form}</p>}

            <div className="mt-8 flex gap-4">
                {currentStep === 1 && (
                    <Button type="button" onClick={handleNext} fullWidth>
                        Next: Create Admin Account
                    </Button>
                )}
                {currentStep === 2 && (
                    <>
                    <Button type="button" onClick={handleBack} fullWidth style={{backgroundColor: 'var(--background-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)'}}>
                        Back
                    </Button>
                    <Button type="submit" isLoading={isLoading} fullWidth>
                        Complete Registration
                    </Button>
                    </>
                )}
                {currentStep === 3 && (
                    <Button type="button" onClick={onNavigate} fullWidth>
                       Proceed to Sign In
                    </Button>
                )}
          </div>
        </form>
    </div>
  );
};

export default RegisterOrg;