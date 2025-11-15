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

  // Helper to find the form submit button by accessible name (ensures it's inside a <form>)
  const findSubmitButtonByName = (name: RegExp | string) => {
    return screen.getAllByRole('button', { name }).find(b => b.closest('form') !== null);
  };

  // Helper to find the tab button (auth-tab) by accessible name
  const findTabButtonByName = (name: RegExp | string) => {
    return screen.getAllByRole('button', { name }).find(b => b.classList.contains('auth-tab'));
  };

  it('renders the Sign In form by default', () => {
    renderWithProvider(<AuthForm onSsoSuccess={onSsoSuccess} onForgotPassword={onForgotPassword} onAuthSuccess={onAuthSuccess} />);
  // There are multiple buttons with the text "Sign In" (tab and submit). Ensure the submit button exists.
  const signInSubmit = findSubmitButtonByName(/sign in/i);
  expect(signInSubmit).toBeInTheDocument();
  // Check for the absence of a submit button labeled 'Create Account'
  const createAccountSubmit = findSubmitButtonByName(/create account/i);
  expect(createAccountSubmit).toBeUndefined();
  });

  it('switches to the Create Account form when tab is clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider(<AuthForm onSsoSuccess={onSsoSuccess} onForgotPassword={onForgotPassword} onAuthSuccess={onAuthSuccess} />);

  // Click the Create Account tab (there is also a submit with the same text)
  const createTab = findTabButtonByName(/create account/i);
  await user.click(createTab as HTMLElement);

  // Check for the submit button specifically (submit lives inside a form)
  const createSubmit = findSubmitButtonByName(/create account/i);
  expect(createSubmit).toBeInTheDocument();
  const signInSubmitAfter = findSubmitButtonByName(/sign in/i);
  expect(signInSubmitAfter).toBeUndefined();
  });

  it('handles successful login', async () => {
    const user = userEvent.setup();
    (authService.signInWithEmail as any).mockResolvedValue({ user: mockUser, token: 'fake-token' });

    renderWithProvider(<AuthForm onSsoSuccess={onSsoSuccess} onForgotPassword={onForgotPassword} onAuthSuccess={onAuthSuccess} />);

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
  const signInSubmitBtn = findSubmitButtonByName(/sign in/i);
  await user.click(signInSubmitBtn as HTMLElement);

    expect(authService.signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(api.setAuthToken).toHaveBeenCalledWith('fake-token');
    expect(onAuthSuccess).toHaveBeenCalledWith(mockUser);
  });
  
  it('displays an error message on failed login', async () => {
    const user = userEvent.setup();
    (authService.signInWithEmail as any).mockRejectedValue(new Error('Invalid email or password.'));

    renderWithProvider(<AuthForm onSsoSuccess={onSsoSuccess} onForgotPassword={onForgotPassword} onAuthSuccess={onAuthSuccess} />);
    
  await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
  // Password input is labeled 'Password'
  await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
  const signInSubmitBtn2 = findSubmitButtonByName(/sign in/i);
  await user.click(signInSubmitBtn2 as HTMLElement);

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
    expect(onAuthSuccess).not.toHaveBeenCalled();
  });

  it('handles successful registration and notifies user', async () => {
    const user = userEvent.setup();
    (authService.registerWithEmail as any).mockResolvedValue({ user: mockUser });

    renderWithProvider(<AuthForm onSsoSuccess={onSsoSuccess} onForgotPassword={onForgotPassword} onAuthSuccess={onAuthSuccess} />);
    
  // Click the Create Account tab (choose the tab element)
  const createTab2 = findTabButtonByName(/create account/i);
  await user.click(createTab2 as HTMLElement);
    
    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPass1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass1!');
  const createSubmitBtn = findSubmitButtonByName(/create account/i);
  await user.click(createSubmitBtn as HTMLElement);

    expect(authService.registerWithEmail).toHaveBeenCalledWith('Test User', 'test@example.com', 'StrongPass1!');
    
  // Check if it switches back to login view by confirming the sign-in submit exists
  expect(findSubmitButtonByName(/sign in/i)).toBeInTheDocument();
  });

});