import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Select } from '../../components/common/Select.tsx';
import { Organization } from '../../types.ts';

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (orgData: Omit<Organization, 'id'>) => void;
}

export const CreateOrgModal: React.FC<CreateOrgModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const phoneNumbers = [];
    const primaryPhone = formData.get('primaryPhone') as string;
    const secondaryPhone = formData.get('secondaryPhone') as string;
    if (primaryPhone) phoneNumbers.push(primaryPhone);
    if (secondaryPhone) phoneNumbers.push(secondaryPhone);
    
    const emails = [];
    const primaryEmail = formData.get('primaryEmail') as string;
    const secondaryEmail = formData.get('secondaryEmail') as string;
    if (primaryEmail) emails.push(primaryEmail);
    if (secondaryEmail) emails.push(secondaryEmail);
    
    const orgData = {
      name: formData.get('name') as string,
      type: formData.get('type') as Organization['type'],
      planId: 'basic' as const,
      address: formData.get('address') as string || undefined,
      city: formData.get('city') as string || undefined,
      state: formData.get('state') as string || undefined,
      country: formData.get('country') as string || undefined,
      postalCode: formData.get('postalCode') as string || undefined,
      phoneNumbers: phoneNumbers.length > 0 ? phoneNumbers : undefined,
      emails: emails.length > 0 ? emails : undefined,
      website: formData.get('website') as string || undefined,
    };

    if (!orgData.name || !orgData.type) {
        alert("Please fill all required fields");
        return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        onCreate(orgData);
        setIsLoading(false);
    }, 1000);
  };

  const footer = (
    <>
      <Button onClick={onClose} type="button" style={{backgroundColor: 'var(--background-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)'}}>
        Cancel
      </Button>
      <Button type="submit" form="createOrgForm" isLoading={isLoading}>
        Create Organization
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Organization" footer={footer}>
      <form id="createOrgForm" onSubmit={handleSubmit} className="space-y-4" style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '1rem'}}>
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border-primary pb-2">Basic Information</h3>
          <Input label="Organization Name" name="name" required />
          <Select label="Organization Type" name="type" required>
              <option value="">Select type...</option>
              <option value="Hospital">Hospital</option>
              <option value="Clinic">Clinic</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Laboratory">Laboratory</option>
              <option value="Headquarters">Headquarters</option>
          </Select>
        </div>

        <div className="space-y-4 mt-6">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border-primary pb-2">Contact Information</h3>
          <Input label="Primary Phone Number" name="primaryPhone" type="tel" placeholder="+234 XXX XXX XXXX" />
          <Input label="Secondary Phone Number (Optional)" name="secondaryPhone" type="tel" placeholder="+234 XXX XXX XXXX" />
          <Input label="Primary Email" name="primaryEmail" type="email" placeholder="contact@organization.com" />
          <Input label="Secondary Email (Optional)" name="secondaryEmail" type="email" placeholder="info@organization.com" />
          <Input label="Website (Optional)" name="website" type="url" placeholder="https://www.organization.com" />
        </div>

        <div className="space-y-4 mt-6">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border-primary pb-2">Address</h3>
          <Input label="Street Address" name="address" placeholder="123 Main Street" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" name="city" placeholder="Lagos" />
            <Input label="State/Province" name="state" placeholder="Lagos State" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Country" name="country" placeholder="Nigeria" />
            <Input label="Postal Code" name="postalCode" placeholder="100001" />
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border-primary pb-2">Administrator Account</h3>
          <Input label="Administrator Email (to be invited)" name="adminEmail" type="email" placeholder="e.g. admin@organization.com" required />
        </div>
      </form>
    </Modal>
  );
};