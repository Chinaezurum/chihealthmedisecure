import React, { useEffect, useState, useCallback } from 'react';
import { User, Encounter, Bill, InsuranceClaim, PaymentTransaction, BillingCode } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToast } from '../../contexts/ToastContext.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { FullScreenLoader } from '../../components/common/FullScreenLoader.tsx';
import { Button } from '../../components/common/Button.tsx';
import { CreditCardIcon, CheckCircleIcon, ClockIcon, DocumentTextIcon } from '../../components/icons/index.tsx';
import { BillGenerationModal } from './BillGenerationModal.tsx';
import { PaymentModal } from './PaymentModal.tsx';
import { InsuranceClaimModal } from './InsuranceClaimModal.tsx';
import { PricingCatalogView } from './PricingCatalogView.tsx';

interface AccountantDashboardProps {
  user: User;
}

type AccountantView = 'overview' | 'encounters' | 'bills' | 'claims' | 'pricing' | 'analytics' | 'settings';

interface DashboardData {
  pendingEncounters: Encounter[];
  draftBills: Bill[];
  pendingBills: Bill[];
  paidBills: Bill[];
  recentTransactions: PaymentTransaction[];
  pendingClaims: InsuranceClaim[];
  billingCodes: BillingCode[];
  insuranceProviders: any[];
  patients: User[];
  stats: {
    totalRevenue: number;
    pendingRevenue: number;
    insuranceRevenue: number;
    cashRevenue: number;
    pendingEncountersCount: number;
    pendingBillsCount: number;
    pendingClaimsCount: number;
  };
}

export const AccountantDashboard: React.FC<AccountantDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<AccountantView>('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.fetchAccountantData();
      setData(response);
    } catch (error) {
      console.error('Failed to fetch accountant data:', error);
      addToast('Failed to load billing data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateBill = (encounter: Encounter) => {
    setSelectedEncounter(encounter);
    setShowBillModal(true);
  };

  const handleProcessPayment = (bill: Bill) => {
    setSelectedBill(bill);
    setShowPaymentModal(true);
  };

  const handleSubmitClaim = (bill: Bill) => {
    setSelectedBill(bill);
    setShowClaimModal(true);
  };

  const renderOverview = () => {
    if (!data) return null;

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="content-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Revenue</p>
                <p className="text-2xl font-bold text-text-primary">₦{data.stats.totalRevenue.toLocaleString()}</p>
              </div>
              <CreditCardIcon className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="content-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Pending Revenue</p>
                <p className="text-2xl font-bold text-text-primary">₦{data.stats.pendingRevenue.toLocaleString()}</p>
              </div>
              <ClockIcon className="w-10 h-10 text-amber-500" />
            </div>
          </div>

          <div className="content-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Pending Encounters</p>
                <p className="text-2xl font-bold text-text-primary">{data.stats.pendingEncountersCount}</p>
              </div>
              <DocumentTextIcon className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="content-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Pending Claims</p>
                <p className="text-2xl font-bold text-text-primary">{data.stats.pendingClaimsCount}</p>
              </div>
              <CheckCircleIcon className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Pending Encounters */}
        <div className="content-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-text-primary">Pending Encounters - Awaiting Billing</h3>
            <span className="text-sm text-text-secondary">{data.pendingEncounters.length} encounters</span>
          </div>
          {data.pendingEncounters.length > 0 ? (
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Services</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingEncounters.slice(0, 5).map(encounter => (
                  <tr key={encounter.id}>
                    <td>{new Date(encounter.date).toLocaleDateString()}</td>
                    <td>{encounter.patientName}</td>
                    <td>{encounter.doctorName}</td>
                    <td>
                      <div className="text-sm">
                        {encounter.servicesRendered.slice(0, 2).join(', ')}
                        {encounter.servicesRendered.length > 2 && ` +${encounter.servicesRendered.length - 2} more`}
                      </div>
                    </td>
                    <td className="font-mono">₦{encounter.totalAmount.toLocaleString()}</td>
                    <td>
                      <Button onClick={() => handleGenerateBill(encounter)} size="sm">
                        Generate Bill
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-text-secondary py-4">No pending encounters</p>
          )}
        </div>

        {/* Pending Bills */}
        <div className="content-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-text-primary">Pending Bills</h3>
            <span className="text-sm text-text-secondary">{data.pendingBills.length} bills</span>
          </div>
          {data.pendingBills.length > 0 ? (
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Patient</th>
                  <th>Amount</th>
                  <th>Payment Type</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingBills.slice(0, 10).map(bill => {
                  const patient = data.patients.find(p => p.id === bill.patientId);
                  return (
                    <tr key={bill.id}>
                      <td className="font-mono">{bill.invoiceNumber}</td>
                      <td>{patient?.name || 'Unknown'}</td>
                      <td className="font-mono">₦{bill.amount.toLocaleString()}</td>
                      <td>
                        <span className={`status-chip ${bill.paymentType === 'Cash' ? 'status-chip-blue' : bill.paymentType === 'Insurance' ? 'status-chip-purple' : 'status-chip-amber'}`}>
                          {bill.paymentType}
                        </span>
                      </td>
                      <td>
                        <span className={`status-chip ${bill.status === 'Due' ? 'status-chip-amber' : 'status-chip-gray'}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td>{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <div className="flex gap-2">
                          <Button onClick={() => handleProcessPayment(bill)} size="sm">
                            Process Payment
                          </Button>
                          {bill.paymentType !== 'Cash' && !bill.insuranceClaimId && (
                            <Button onClick={() => handleSubmitClaim(bill)} size="sm" variant="secondary">
                              Submit Claim
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-text-secondary py-4">No pending bills</p>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="content-card">
          <h3 className="text-xl font-bold text-text-primary mb-4">Recent Transactions</h3>
          {data.recentTransactions.length > 0 ? (
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map(txn => (
                  <tr key={txn.id}>
                    <td>{new Date(txn.paymentDate).toLocaleDateString()}</td>
                    <td className="font-mono">{txn.transactionId}</td>
                    <td className="font-mono">₦{txn.amount.toLocaleString()}</td>
                    <td>{txn.paymentMethod}</td>
                    <td>
                      <span className={`status-chip ${txn.status === 'Completed' ? 'status-chip-green' : txn.status === 'Pending' ? 'status-chip-amber' : 'status-chip-red'}`}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-text-secondary py-4">No recent transactions</p>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!data) return null;

    switch (activeView) {
      case 'overview':
        return renderOverview();
      case 'pricing':
        return <PricingCatalogView billingCodes={data.billingCodes} onRefresh={fetchData} />;
      default:
        return renderOverview();
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: CreditCardIcon },
    { id: 'pricing', label: 'Pricing Catalog', icon: DocumentTextIcon },
  ];

  if (isLoading || !data) {
    return <FullScreenLoader message="Loading billing dashboard..." />;
  }

  return (
    <DashboardLayout
      user={props.user}
      activeView={activeView}
      onViewChange={(view) => setActiveView(view as AccountantView)}
      navItems={navItems}
    >
      {renderContent()}

      {/* Modals */}
      {showBillModal && selectedEncounter && (
        <BillGenerationModal
          encounter={selectedEncounter}
          billingCodes={data.billingCodes}
          patient={data.patients.find(p => p.id === selectedEncounter.patientId)!}
          onClose={() => {
            setShowBillModal(false);
            setSelectedEncounter(null);
          }}
          onSuccess={() => {
            setShowBillModal(false);
            setSelectedEncounter(null);
            fetchData();
            addToast('Bill generated successfully', 'success');
          }}
        />
      )}

      {showPaymentModal && selectedBill && (
        <PaymentModal
          bill={selectedBill}
          patient={data.patients.find(p => p.id === selectedBill.patientId)!}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedBill(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setSelectedBill(null);
            fetchData();
            addToast('Payment processed successfully', 'success');
          }}
        />
      )}

      {showClaimModal && selectedBill && (
        <InsuranceClaimModal
          bill={selectedBill}
          patient={data.patients.find(p => p.id === selectedBill.patientId)!}
          insuranceProviders={data.insuranceProviders}
          onClose={() => {
            setShowClaimModal(false);
            setSelectedBill(null);
          }}
          onSuccess={() => {
            setShowClaimModal(false);
            setSelectedBill(null);
            fetchData();
            addToast('Insurance claim submitted successfully', 'success');
          }}
        />
      )}
    </DashboardLayout>
  );
};
