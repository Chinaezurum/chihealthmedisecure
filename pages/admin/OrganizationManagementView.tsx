import React, { useState } from 'react';
import { Organization, User } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { Button } from '../../components/common/Button.tsx';
import { CreateOrgModal } from './CreateOrgModal.tsx';
import { LinkOrgModal } from './LinkOrgModal.tsx';
import { useToasts } from '../../hooks/useToasts.ts';
import { canAccessFeature } from '../../services/permissionService.ts';

interface OrganizationManagementViewProps {
  organizations: Organization[];
  onUpdate: () => void;
  currentUser: User;
}

export const OrganizationManagementView: React.FC<OrganizationManagementViewProps> = ({ organizations, onUpdate, currentUser }) => {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isLinkModalOpen, setLinkModalOpen] = useState(false);
  const [orgToLink, setOrgToLink] = useState<Organization | null>(null);
  const { addToast } = useToasts();

  const handleCreate = async (_orgData: Omit<Organization, 'id' | 'planId'>) => {
    // This functionality is now on the backend
    addToast("Functionality not implemented in mock.", 'info');
    setCreateModalOpen(false);
  };

  const handleOpenLinkModal = (org: Organization) => {
    setOrgToLink(org);
    setLinkModalOpen(true);
  };
  
  const handleLink = async (parentId: string) => {
      if (!orgToLink) return;
      await api.linkOrganization(orgToLink.id, parentId);
      addToast("Organizations linked successfully", 'success');
      setLinkModalOpen(false);
      onUpdate();
  }
  
  const handleUnlink = async (childId: string) => {
      await api.unlinkOrganization(childId);
      addToast("Organization unlinked successfully", 'success');
      onUpdate();
  }
  
  const getParentName = (parentId?: string | null) => {
    if (!parentId) return 'None';
    return organizations.find(o => o.id === parentId)?.name || 'N/A';
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-text-primary">Organization Hierarchy</h2>
        {canAccessFeature(currentUser, 'multi_tenancy') && (
            <Button onClick={() => setCreateModalOpen(true)}>Create New Organization</Button>
        )}
      </div>
      <div className="content-card">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Organization Name</th>
              <th>Type</th>
              <th>Plan</th>
              <th>Parent HQ</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map(org => (
              <tr key={org.id}>
                <td className="font-medium">{org.name}</td>
                <td>{org.type}</td>
                <td><span className="status-chip status-chip-cyan">{org.planId}</span></td>
                <td>{getParentName(org.parentOrganizationId)}</td>
                <td className="flex gap-2">
                  {org.parentOrganizationId ? (
                    <Button onClick={() => handleUnlink(org.id)} className="btn-secondary">Unlink</Button>
                  ) : (
                    org.type !== 'Headquarters' && <Button onClick={() => handleOpenLinkModal(org)}>Link to Parent</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <CreateOrgModal 
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreate}
      />
      {orgToLink && (
        <LinkOrgModal
            isOpen={isLinkModalOpen}
            onClose={() => setLinkModalOpen(false)}
            childOrg={orgToLink}
            allOrgs={organizations}
            onLink={handleLink}
        />
      )}
    </>
  );
};
