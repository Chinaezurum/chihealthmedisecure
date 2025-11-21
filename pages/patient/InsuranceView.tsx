import React, { useState, useEffect } from 'react';
import * as Icons from '../../components/icons/index.tsx';
import * as api from '../../services/apiService.ts';
import { Patient } from '../../types.ts';

interface InsuranceViewProps {
  patient: Patient;
}

export const InsuranceView: React.FC<InsuranceViewProps> = ({ patient }) => {
  const [insuranceInfo, setInsuranceInfo] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInsuranceData();
  }, [patient.id]);

  const fetchInsuranceData = async () => {
    try {
      setIsLoading(true);
      // Fetch patient's insurance information and claims
      const [insurance, claimsData] = await Promise.all([
        api.apiFetch(`/patients/${patient.id}/insurance`).catch(() => null),
        api.apiFetch(`/patients/${patient.id}/insurance-claims`).catch(() => []),
      ]);
      
      setInsuranceInfo(insurance);
      setClaims(claimsData || []);
    } catch (error) {
      console.error('Failed to fetch insurance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Pending':
      case 'Submitted':
        return 'bg-amber-100 text-amber-800';
      case 'Denied':
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Insurance Information Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Insurance Information</h2>
          {insuranceInfo && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              insuranceInfo.status === 'Active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {insuranceInfo.status || 'Active'}
            </span>
          )}
        </div>

        {insuranceInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-600">Insurance Provider</label>
              <p className="text-base font-semibold text-gray-900 mt-1">
                {insuranceInfo.providerName || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Policy Number</label>
              <p className="text-base font-mono font-semibold text-gray-900 mt-1">
                {insuranceInfo.policyNumber || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Plan Type</label>
              <p className="text-base text-gray-900 mt-1">
                {insuranceInfo.planType || 'Standard'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Coverage</label>
              <p className="text-base text-gray-900 mt-1">
                {insuranceInfo.coveragePercentage || 80}% coverage
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Effective Date</label>
              <p className="text-base text-gray-900 mt-1">
                {insuranceInfo.effectiveDate 
                  ? new Date(insuranceInfo.effectiveDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Expiry Date</label>
              <p className="text-base text-gray-900 mt-1">
                {insuranceInfo.expiryDate 
                  ? new Date(insuranceInfo.expiryDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Icons.ShieldCheckIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Insurance Information</h3>
            <p className="mt-2 text-sm text-gray-600">
              You don't have any insurance information on file. Contact your healthcare provider to add insurance details.
            </p>
          </div>
        )}
      </div>

      {/* Claims History */}
      {insuranceInfo && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-base font-semibold text-gray-900">Claims History</h3>
            <p className="text-sm text-gray-600 mt-0.5">Your insurance claims and their status</p>
          </div>

          {claims.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Claim Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Claim ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Covered Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(claim.dateFiled).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {claim.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {claim.serviceType || 'Medical Service'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ₦{claim.claimAmount?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₦{claim.approvedAmount?.toLocaleString() || '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Icons.FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">No claims filed yet</p>
            </div>
          )}
        </div>
      )}

      {/* Coverage Benefits */}
      {insuranceInfo && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <Icons.HeartPulseIcon className="h-8 w-8 text-blue-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Primary Care</p>
              <p className="text-xs text-gray-600 mt-1">Fully covered</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <Icons.ActivityIcon className="h-8 w-8 text-green-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Specialist Visits</p>
              <p className="text-xs text-gray-600 mt-1">{insuranceInfo.coveragePercentage || 80}% covered</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <Icons.PillIcon className="h-8 w-8 text-purple-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Prescriptions</p>
              <p className="text-xs text-gray-600 mt-1">{insuranceInfo.coveragePercentage || 80}% covered</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <Icons.ActivityIcon className="h-8 w-8 text-amber-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Lab Tests</p>
              <p className="text-xs text-gray-600 mt-1">{insuranceInfo.coveragePercentage || 80}% covered</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <Icons.AlertCircleIcon className="h-8 w-8 text-red-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Emergency Care</p>
              <p className="text-xs text-gray-600 mt-1">Fully covered</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <Icons.BedIcon className="h-8 w-8 text-indigo-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Hospitalization</p>
              <p className="text-xs text-gray-600 mt-1">{insuranceInfo.coveragePercentage || 80}% covered</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
