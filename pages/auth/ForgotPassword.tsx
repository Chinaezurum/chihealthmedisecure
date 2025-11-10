import React, { useState } from 'react';
import { Input } from '../../components/common/Input.tsx';
import { Button } from '../../components/common/Button.tsx';
import { CheckCircleIcon } from '../../components/icons/index.tsx';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        setError('Please enter a valid email address.');
        return;
    }
    
    setIsLoading(true);
    // Simulate API call to send reset email
    setTimeout(() => {
        setIsLoading(false);
        setIsSubmitted(true);
    }, 1000);
  };

  if (isSubmitted) {
    return (
      <div className="auth-card text-center">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-text-primary">Check Your Email</h2>
        <p className="text-text-secondary mt-2">
            If an account with the email <strong>{email}</strong> exists, we've sent instructions to reset your password.
        </p>
        <Button onClick={onBackToLogin} fullWidth style={{ marginTop: '1.5rem' }}>
            Back to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Forgot Your Password?</h1>
        <p className="text-text-secondary mt-2">No problem. Enter your email below and we'll send you a reset link.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input 
          name="email" 
          type="email" 
          label="Email Address" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          error={error}
          autoComplete="email" 
          required 
        />
        <Button type="submit" isLoading={isLoading} fullWidth>
          Send Reset Link
        </Button>
      </form>
      <div className="mt-6 text-center">
        <button onClick={onBackToLogin} className="auth-card__link">
          &larr; Back to Sign In
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;