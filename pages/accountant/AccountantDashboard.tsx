import React, { useEffect, useState, useCallback } from 'react';
import { User, Encounter, Bill, InsuranceClaim, PaymentTransaction, BillingCode } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToast } from '../../contexts/ToastContext.tsx';
import { FullScreenLoader } from '../../components/common/FullScreenLoader.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { DashboardHeader } from '../../components/common/DashboardHeader.tsx';
import { Logo } from '../../components/common/Logo.tsx';
import * as Icons from '../../components/icons/index.tsx';
import { CreditCardIcon, CheckCircleIcon, ClockIcon, DocumentTextIcon, LayoutDashboardIcon, SettingsIcon } from '../../components/icons/index.tsx';
import { BillGenerationModal } from './BillGenerationModal.tsx';
import { PaymentModal } from './PaymentModal.tsx';
import { InsuranceClaimModal } from './InsuranceClaimModal.tsx';
import { PricingCatalogView } from './PricingCatalogView.tsx';
import { SettingsView } from '../common/SettingsView.tsx';

interface AccountantDashboardProps {
  user: User;
  onSignOut: () => void;
  onSwitchOrganization: (orgId: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

type AccountantView = 'overview' | 'encounters' | 'bills' | 'payments' | 'claims' | 'transactions' | 'pricing' | 'reports' | 'settings';

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

const Sidebar: React.FC<{ activeView: AccountantView; setActiveView: (view: AccountantView) => void }> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboardIcon },
    { id: 'pricing', label: 'Pricing Catalog', icon: DocumentTextIcon },
  ];

  const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
    <button 
      onClick={() => setActiveView(item.id as AccountantView)} 
      className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}
    >
      <item.icon />
      <span>{item.label}</span>
    </button>
  );
  
  return (
    <aside className="sidebar">
      <button onClick={() => setActiveView('overview')} className="sidebar-logo-button">
        <Logo />
        <h1>ChiHealth</h1>
      </button>
      <nav className="flex-1 space-y-1">
        {navItems.map(item => <NavLink key={item.id} item={item} />)}
      </nav>
      <div>
        <button 
          onClick={() => setActiveView('settings')} 
          className={`sidebar-link ${activeView === 'settings' ? 'active' : ''}`}
        >
          <SettingsIcon />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 truncate">
                  ₦{data.stats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">+12% from last month</p>
              </div>
              <div className="flex-shrink-0 ml-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCardIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Pending Revenue Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Revenue</p>
                <p className="text-2xl font-bold text-gray-900 truncate">
                  ₦{data.stats.pendingRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-amber-600 mt-1">{data.stats.pendingBillsCount} bills</p>
              </div>
              <div className="flex-shrink-0 ml-3">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Pending Encounters Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Encounters</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.stats.pendingEncountersCount}
                </p>
                <p className="text-xs text-blue-600 mt-1">Awaiting billing</p>
              </div>
              <div className="flex-shrink-0 ml-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Pending Claims Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Claims</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.stats.pendingClaimsCount}
                </p>
                <p className="text-xs text-purple-600 mt-1">Insurance claims</p>
              </div>
              <div className="flex-shrink-0 ml-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Sources */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Revenue by Source</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Cash Payments</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ₦{data.stats.cashRevenue.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${(data.stats.cashRevenue / data.stats.totalRevenue) * 100}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Insurance Claims</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ₦{data.stats.insuranceRevenue.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${(data.stats.insuranceRevenue / data.stats.totalRevenue) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveView('pricing')}
                className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
              >
                <DocumentTextIcon className="w-8 h-8 text-indigo-600 mb-2" />
                <span className="text-sm font-medium text-indigo-900">Pricing Catalog</span>
              </button>
              <button
                onClick={fetchData}
                className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
              >
                <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-medium text-green-900">Refresh Data</span>
              </button>
              <button
                className="flex flex-col items-center justify-center p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
              >
                <svg className="w-8 h-8 text-amber-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-amber-900">Reports</span>
              </button>
              <button
                className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <svg className="w-8 h-8 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-900">Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pending Encounters Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Pending Encounters</h3>
                <p className="text-sm text-gray-600 mt-0.5">Awaiting billing - {data.pendingEncounters.length} total</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {data.pendingEncounters.length} pending
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            {data.pendingEncounters.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.pendingEncounters.slice(0, 5).map(encounter => (
                    <tr key={encounter.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(encounter.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{encounter.patientName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {encounter.doctorName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {encounter.servicesRendered.slice(0, 2).join(', ')}
                          {encounter.servicesRendered.length > 2 && ` +${encounter.servicesRendered.length - 2} more`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ₦{encounter.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleGenerateBill(encounter)}
                          className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Generate Bill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-12 text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">No pending encounters</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Bills Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Pending Bills</h3>
                <p className="text-sm text-gray-600 mt-0.5">Outstanding payments - {data.pendingBills.length} total</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                {data.pendingBills.length} pending
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            {data.pendingBills.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.pendingBills.slice(0, 10).map(bill => {
                    const patient = data.patients.find(p => p.id === bill.patientId);
                    return (
                      <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {bill.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{patient?.name || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ₦{bill.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            bill.paymentType === 'Cash' 
                              ? 'bg-blue-100 text-blue-800' 
                              : bill.paymentType === 'Insurance' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {bill.paymentType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            bill.status === 'Due' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                          <button
                            onClick={() => handleProcessPayment(bill)}
                            className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Process Payment
                          </button>
                          {bill.paymentType !== 'Cash' && !bill.insuranceClaimId && (
                            <button
                              onClick={() => handleSubmitClaim(bill)}
                              className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Submit Claim
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-12 text-center">
                <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">No pending bills</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-base font-semibold text-gray-900">Recent Transactions</h3>
            <p className="text-sm text-gray-600 mt-0.5">Latest payment activity</p>
          </div>
          <div className="overflow-x-auto">
            {data.recentTransactions.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.recentTransactions.map(txn => (
                    <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(txn.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {txn.transactionId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ₦{txn.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {txn.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          txn.status === 'Completed' 
                            ? 'bg-green-100 text-green-800' 
                            : txn.status === 'Pending' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-12 text-center">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">No recent transactions</p>
              </div>
            )}
          </div>
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
        return <PricingCatalogView billingCodes={data.billingCodes} />;
      case 'settings':
        return <SettingsView user={props.user} />;
      default:
        return renderOverview();
    }
  };

  if (isLoading || !data) {
    return <FullScreenLoader message="Loading billing dashboard..." />;
  }

  return (
    <DashboardLayout 
      onSignOut={props.onSignOut}
      sidebar={<Sidebar activeView={activeView} setActiveView={setActiveView} />}
      header={
        <DashboardHeader 
          user={props.user} 
          onSignOut={props.onSignOut} 
          onSwitchOrganization={props.onSwitchOrganization}
          notifications={[]}
          onMarkNotificationsAsRead={() => {}}
          title="Billing & Accounting"
          theme={props.theme}
          toggleTheme={props.toggleTheme}
        />
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </div>

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

export default AccountantDashboard;
