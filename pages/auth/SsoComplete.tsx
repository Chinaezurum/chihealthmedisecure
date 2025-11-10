import React, { useState, useEffect } from 'react';
import { Input } from '../../components/common/Input.tsx';
import { Button } from '../../components/common/Button.tsx';
import * as authService from '../../services/authService.ts';
import * as api from '../../services/apiService.ts';
import { Patient, User } from '../../types.ts';

interface SsoCompleteProps {
  user: Partial<Patient>;
  onCancel: () => void;
  onAuthSuccess: (user: User) => void;
}

const SsoComplete: React.FC<SsoCompleteProps> = ({ user, onCancel, onAuthSuccess }) => {
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    agreedToTerms: false,
  });
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // On component mount, extract the temporary token from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('tempToken');
    setTempToken(token);
    // Clean the URL
    window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) {
        setErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!tempToken) newErrors.form = 'Your session has expired. Please try signing in again.';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required.';
    if (!formData.agreedToTerms) newErrors.agreedToTerms = 'You must agree to the terms to continue.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      const { user: registeredUser, token } = await authService.completeSsoRegistration(tempToken!, { dateOfBirth: formData.dateOfBirth });
      api.setAuthToken(token);
      onAuthSuccess(registeredUser);
    } catch (error) {
      setErrors({ form: 'An unexpected error occurred. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card" style={{maxWidth: '32rem'}}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">One Last Step</h1>
          <p className="text-text-secondary mt-2">Welcome, {user.name}! Please confirm your details to complete your account.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input name="name" type="text" label="Full Name" value={user.name || ''} disabled />
            <Input name="email" type="email" label="Email Address" value={user.email || ''} disabled />
            <Input name="dateOfBirth" type="date" label="Date of Birth" value={formData.dateOfBirth} onChange={handleChange} error={errors.dateOfBirth} required />
            
            <div>
              <div className="flex items-start">
                  <div className="flex items-center h-5">
                      <input
                          id="agreedToTerms"
                          name="agreedToTerms"
                          type="checkbox"
                          checked={formData.agreedToTerms}
                          onChange={handleChange}
                          className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                      />
                  </div>
                  <div className="ml-3 text-sm">
                      <label htmlFor="agreedToTerms" className="font-medium text-text-primary">
                          I agree to the <a href="#" className="text-link hover:underline">Terms of Service</a> and <a href="#" className="text-link hover:underline">Privacy Policy</a>.
                      </label>
                  </div>
              </div>
              {errors.agreedToTerms && <p className="form-error-text">{errors.agreedToTerms}</p>}
            </div>

            {errors.form && <p className="form-error-text text-center">{errors.form}</p>}

            <div className="flex gap-4">
                <Button type="button" onClick={onCancel} fullWidth style={{backgroundColor: 'var(--background-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)'}}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isLoading} fullWidth>
                    Complete Registration
                </Button>
            </div>
        </form>
    </div>
  );
};

export default SsoComplete;