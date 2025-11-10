import React, { useState, useMemo } from 'react';
import { Input } from '../../components/common/Input.tsx';
import { Button } from '../../components/common/Button.tsx';
import * as authService from '../../services/authService.ts';
import { PasswordStrength } from '../../components/PasswordStrength.tsx';
import { checkPasswordStrength } from '../../utils/validation.ts';

interface RegisterFormProps {
    onSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const passwordStrength = useMemo(() => checkPasswordStrength(formData.password), [formData.password]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const validate = (): boolean => {
        if (!formData.fullName) {
            setError('Full name is required.');
            return false;
        }
        if (passwordStrength.score < 4) {
            setError('Password is not strong enough. It must contain an uppercase letter, a lowercase letter, a number, and a special character.');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!validate()) return;
        
        setIsLoading(true);
        try {
            await authService.registerWithEmail(formData.fullName, formData.email, formData.password);
            onSuccess();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            // Make the duplicate email check more flexible
            if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('exist')) {
                setError('An account with this email already exists.');
            } else {
                // Display the actual error from the backend
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="auth-form-body">
            <div className="form-field-container">
                <Input name="fullName" type="text" label="Full Name" value={formData.fullName} onChange={handleChange} autoComplete="name" required />
            </div>
            <div className="form-field-container">
                <Input name="email" type="email" label="Email Address" value={formData.email} onChange={handleChange} autoComplete="email" required />
            </div>
            <div className="form-field-container">
                <Input name="password" type="password" label="Password" value={formData.password} onChange={handleChange} autoComplete="new-password" required />
                <PasswordStrength strength={passwordStrength} />
            </div>
            <div className="form-field-container">
                <Input name="confirmPassword" type="password" label="Confirm Password" value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" required />
            </div>

            {error && <p className="form-error-text text-center">{error}</p>}
            
            <Button type="submit" isLoading={isLoading} fullWidth>
                Create Account
            </Button>
        </form>
    );
};