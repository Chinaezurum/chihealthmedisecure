import React, { useState } from 'react';
import { User } from '../../types.ts';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { MfaSetupModal } from '../../components/auth/MfaSetupModal.tsx';
import { useToasts } from '../../hooks/useToasts.ts';

interface SecuritySettingsViewProps {
  user: User;
}

export const SecuritySettingsView: React.FC<SecuritySettingsViewProps> = ({ user: _user }) => {
    const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
    const { addToast } = useToasts();

    const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        addToast("Password updated successfully.", "success");
        // In a real app, you'd call an API here.
    };

    return (
        <div>
            <h3 className="text-xl font-semibold text-text-primary mb-6">Security Settings</h3>
            
            <div className="mb-8">
                <h4 className="text-lg font-semibold text-text-primary mb-4">Change Password</h4>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <Input label="Current Password" name="currentPassword" type="password" required />
                    <Input label="New Password" name="newPassword" type="password" required />
                    <Input label="Confirm New Password" name="confirmPassword" type="password" required />
                    <div className="flex justify-end">
                        <Button type="submit">Update Password</Button>
                    </div>
                </form>
            </div>
            
            <div>
                 <h4 className="text-lg font-semibold text-text-primary mb-4">Multi-Factor Authentication (MFA)</h4>
                 <div className="p-4 bg-background-tertiary rounded-md flex items-center justify-between">
                     <div>
                        <p className="font-medium text-text-primary">Authenticator App</p>
                        <p className="text-sm text-text-secondary">Status: Not enabled</p>
                     </div>
                     <Button onClick={() => setIsMfaModalOpen(true)}>Enable MFA</Button>
                 </div>
            </div>

            <MfaSetupModal 
                isOpen={isMfaModalOpen}
                onClose={() => setIsMfaModalOpen(false)}
            />
        </div>
    );
};
