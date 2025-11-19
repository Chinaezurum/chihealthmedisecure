import React, { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { IncomingReferral } from '../../types.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import * as api from '../../services/apiService.ts';
import { UsersIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '../../components/icons/index.tsx';

interface IncomingReferralsViewProps {
  onRegisterPatient?: (referral: IncomingReferral) => void;
}

export const IncomingReferralsView: React.FC<IncomingReferralsViewProps> = ({ onRegisterPatient }) => {
  const [referrals, setReferrals] = useState<IncomingReferral[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<IncomingReferral | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [responseNotes, setResponseNotes] = useState('');
  const { addToast } = useToasts();

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setIsLoading(true);
      const data = await api.getIncomingReferrals();
      setReferrals(data);
    } catch (error) {
      console.error('Failed to fetch incoming referrals:', error);
      addToast('Failed to load incoming referrals', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (referral: IncomingReferral) => {
    setSelectedReferral(referral);
    setResponseNotes('');
    setIsDetailsOpen(true);
  };

  const handleAcceptReferral = async () => {
    if (!selectedReferral) return;

    try {
      await api.updateIncomingReferralStatus(selectedReferral.id, 'Accepted', undefined, responseNotes);
      addToast('Referral accepted successfully', 'success');
      setIsDetailsOpen(false);
      fetchReferrals();
    } catch (error) {
      console.error('Failed to accept referral:', error);
      addToast('Failed to accept referral', 'error');
    }
  };

  const handleRejectReferral = async () => {
    if (!selectedReferral) return;

    if (!responseNotes.trim()) {
      addToast('Please provide a reason for rejection', 'error');
      return;
    }

    try {
      await api.updateIncomingReferralStatus(selectedReferral.id, 'Rejected', undefined, responseNotes);
      addToast('Referral rejected', 'info');
      setIsDetailsOpen(false);
      fetchReferrals();
    } catch (error) {
      console.error('Failed to reject referral:', error);
      addToast('Failed to reject referral', 'error');
    }
  };

  const handleRegisterPatient = () => {
    if (selectedReferral && onRegisterPatient) {
      onRegisterPatient(selectedReferral);
      setIsDetailsOpen(false);
    }
  };

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'Emergency':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300">EMERGENCY</span>;
      case 'Urgent':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">URGENT</span>;
      default:
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">ROUTINE</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Accepted':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300">Accepted</span>;
      case 'Rejected':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300">Rejected</span>;
      case 'Patient Registered':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">Registered</span>;
      default:
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">Pending</span>;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-text-primary">Incoming Referrals</h2>
        <p className="text-text-secondary mt-1">Patients referred from external healthcare facilities</p>
      </div>

      {referrals.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No Incoming Referrals"
          message="There are no patient referrals from external facilities at this time."
        />
      ) : (
        <div className="space-y-4">
          {referrals
            .sort((a, b) => {
              // Sort: Emergency > Urgent > Routine, then by date
              const urgencyOrder = { 'Emergency': 1, 'Urgent': 2, 'Routine': 3 };
              const urgencyDiff = urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
              if (urgencyDiff !== 0) return urgencyDiff;
              return new Date(b.referralDate).getTime() - new Date(a.referralDate).getTime();
            })
            .map((referral) => (
              <div key={referral.id} className="content-card p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-text-primary">{referral.patientName}</h3>
                      {getUrgencyBadge(referral.urgencyLevel)}
                      {getStatusBadge(referral.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-text-secondary">
                      <div><span className="font-medium">Age:</span> {referral.patientAge} years</div>
                      <div><span className="font-medium">Gender:</span> {referral.patientGender}</div>
                      <div><span className="font-medium">Specialty:</span> {referral.specialty}</div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{new Date(referral.referralDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => handleViewDetails(referral)}>
                    View Details
                  </Button>
                </div>

                <div className="pt-4 border-t border-border-primary">
                  <p className="text-sm font-medium text-text-primary mb-1">From: {referral.fromFacility}</p>
                  <p className="text-sm text-text-secondary">Dr. {referral.fromDoctor} • {referral.fromDoctorContact}</p>
                  <p className="text-sm text-text-primary mt-2 line-clamp-2">{referral.reason}</p>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedReferral && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`Referral: ${selectedReferral.patientName}`}
          footer={
            selectedReferral.status === 'Pending' ? (
              <>
                <Button
                  onClick={handleRejectReferral}
                  style={{ backgroundColor: 'var(--background-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                >
                  <XCircleIcon className="w-5 h-5" />
                  Reject
                </Button>
                <Button onClick={handleAcceptReferral}>
                  <CheckCircleIcon className="w-5 h-5" />
                  Accept Referral
                </Button>
              </>
            ) : selectedReferral.status === 'Accepted' ? (
              <Button onClick={handleRegisterPatient}>
                Register Patient
              </Button>
            ) : null
          }
        >
          <div className="space-y-6">
            {/* Patient Information */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-3">Patient Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-text-secondary">Name</label>
                  <p className="font-medium text-text-primary">{selectedReferral.patientName}</p>
                </div>
                <div>
                  <label className="text-text-secondary">Age</label>
                  <p className="font-medium text-text-primary">{selectedReferral.patientAge} years</p>
                </div>
                <div>
                  <label className="text-text-secondary">Gender</label>
                  <p className="font-medium text-text-primary">{selectedReferral.patientGender}</p>
                </div>
                <div>
                  <label className="text-text-secondary">Specialty</label>
                  <p className="font-medium text-text-primary">{selectedReferral.specialty}</p>
                </div>
              </div>
            </div>

            {/* Referring Facility */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-3">Referring Facility</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-text-secondary">Facility:</span> <span className="font-medium text-text-primary">{selectedReferral.fromFacility}</span></p>
                <p><span className="text-text-secondary">Doctor:</span> <span className="font-medium text-text-primary">Dr. {selectedReferral.fromDoctor}</span></p>
                <p><span className="text-text-secondary">Contact:</span> <span className="font-medium text-text-primary">{selectedReferral.fromDoctorContact}</span></p>
              </div>
            </div>

            {/* Clinical Information */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-3">Clinical Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-text-secondary">Reason for Referral</label>
                  <p className="text-text-primary mt-1">{selectedReferral.reason}</p>
                </div>
                
                {selectedReferral.transferNotes && (
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Transfer Notes</label>
                    <p className="text-text-primary mt-1 whitespace-pre-wrap">{selectedReferral.transferNotes}</p>
                  </div>
                )}

                {selectedReferral.medicalHistory && (
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Medical History</label>
                    <p className="text-text-primary mt-1">{selectedReferral.medicalHistory}</p>
                  </div>
                )}

                {selectedReferral.currentMedications && (
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Current Medications</label>
                    <p className="text-text-primary mt-1">{selectedReferral.currentMedications}</p>
                  </div>
                )}

                {selectedReferral.allergies && (
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Allergies</label>
                    <p className="text-text-primary mt-1">{selectedReferral.allergies}</p>
                  </div>
                )}

                {selectedReferral.vitalSigns && (
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Vital Signs</label>
                    <p className="text-text-primary mt-1">{selectedReferral.vitalSigns}</p>
                  </div>
                )}

                {selectedReferral.labResults && (
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Lab Results</label>
                    <p className="text-text-primary mt-1 whitespace-pre-wrap">{selectedReferral.labResults}</p>
                  </div>
                )}

                {selectedReferral.imagingReports && (
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Imaging Reports</label>
                    <p className="text-text-primary mt-1 whitespace-pre-wrap">{selectedReferral.imagingReports}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Response Section */}
            {selectedReferral.status === 'Pending' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Response Notes {selectedReferral.status === 'Pending' && <span className="text-text-tertiary">(Required for rejection)</span>}
                </label>
                <textarea
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-background-secondary border-2 border-border-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 resize-y"
                  placeholder="Add notes about accepting/rejecting this referral..."
                />
              </div>
            )}

            {/* Status Information */}
            {selectedReferral.status !== 'Pending' && (
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Status Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-text-secondary">Status:</span> {getStatusBadge(selectedReferral.status)}</p>
                  {selectedReferral.acceptedDate && (
                    <p><span className="text-text-secondary">Date:</span> <span className="font-medium text-text-primary">{new Date(selectedReferral.acceptedDate).toLocaleString()}</span></p>
                  )}
                  {selectedReferral.responseNotes && (
                    <div>
                      <label className="text-text-secondary">Response Notes</label>
                      <p className="text-text-primary mt-1">{selectedReferral.responseNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
