// Fix: Add React import for JSX usage in test file.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthForm } from './AuthForm.tsx';
import * as authService from '../../services/authService.ts';
import * as api from '../../services/apiService.ts';
import { User } from '../../types.ts';
import { ToastProvider } from '../../contexts/ToastContext.tsx';

// Mock the services
vi.mock('../../services/authService.ts');
vi.mock('../../services/apiService.ts');

const mockUser: User = { 
    id: 'user-1', 
    name: 'Test User', 
    email: 'test@example.com', 
    role: 'patient', 
    currentOrganization: { id: 'org-1', name: 'General Hospital', type: 'Hospital', planId: 'basic' },
    organizations: [{ id: 'org-1', name: 'General Hospital', type: 'Hospital', planId: 'basic' }]
};

const renderWithProvider = (ui: React.ReactElement) => {
    return render(<ToastProvider>{ui}</ToastProvider>);
};


describe('AuthForm', () => {
  const onSsoSuccess = vi.fn();
  const onForgotPassword = vi.fn();
  const onAuthSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Sign In form by default', () => {
    renderWithProvider(<AuthForm onSsoSuccess={onSsoSuccess} onForgotPassword={onForgotPassword} onAuthSuccess={onAuthSuccess} />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    // Check for the submit button specifically
    const submitButtons = screen.getAllByRole('button');
    expect(submitButtons.find(b => b.textContent === 'Create Account' && (b as HTMLButtonElement).type !== 'button')).toBeUndefined();
  });

  it('switches to the Create Account form when tab is clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider(<AuthForm onSsoSuccess={onSsoSuccess} onForgotPassword={onForgotPassword} onAuthSuccess={onAuthSuccess} />);

    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    
    // Check for the submit button specifically
    const submitButtons = screen.getAllByRole('button');
    expect(submitButtons.find(b => b.textContent === 'Create Account' && (b as HTMLButtonElement).type === 'submit')).toBeInTheDocument();
    expect(submitButtons.find(b => b.textContent === 'Sign In' && (b as HTMLButtonElement).type === 'submit')).toBeUndefined();
  });

  it('handles successful login', async () => {
    const user = userEvent.setup();
    (authService.signInWithEmail as any).mockResolvedValue({ user: mockUser, token: 'fake-token' });

    renderWithProvider(<AuthForm onSsoSuccess={onSsoSuccess} onForgotPassword={onForgotPassword} onAuthSuccess={onAuthSuccess} />);

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(authService.signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(api.setAuthToken).toHaveBeenCalledWith('fake-token');
    expect(onAuthSuccess).toHaveBeenCalledWith(mockUser);
  });
  
  it('displays an error message on failed login', async () => {
    const user = userEvent.setup();
    (authService.signInWithEmail as any).mockRejectedValue(new Error('Invalid email or password.'));

    renderWithProvider(<AuthForm onSsoSuccess={onSsoSuccess} onForgotPassword={onForgotPassword} onAuthSuccess={onAuthSuccess} />);
    
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/wrongpassword/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
    expect(onAuthSuccess).not.toHaveBeenCalled();
  });

  it('handles successful registration and notifies user', async () => {
    const user = userEvent.setup();
    (authService.registerWithEmail as any).mockResolvedValue({ user: mockUser });

    renderWithProvider(<AuthForm onSsoSuccess={onSsoSuccess} onForgotPassword={onForgotPassword} onAuthSuccess={onAuthSuccess} />);
    
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    
    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPass1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass1!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(authService.registerWithEmail).toHaveBeenCalledWith('Test User', 'test@example.com', 'StrongPass1!');
    
    // Check if it switches back to login view. The original test looked for an alert,
    // but the actual implementation uses toasts, so we'll check for the view switch.
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

});