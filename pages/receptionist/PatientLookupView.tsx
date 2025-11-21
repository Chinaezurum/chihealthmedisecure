import React, { useState } from 'react';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { useToasts } from '../../hooks/useToasts.ts';
import * as api from '../../services/apiService.ts';
import { SearchIcon, UserIcon, PhoneIcon, CalendarIcon, MapPinIcon, AlertCircleIcon, PillIcon, HeartIcon, EnvelopeIcon } from '../../components/icons/index.tsx';
import type { User } from '../../types.ts';

interface PatientLookupViewProps {
  currentUserId?: string;
  onCheckInForTriage?: (patientId: string) => void;
}

export const PatientLookupView: React.FC<PatientLookupViewProps> = ({ currentUserId, onCheckInForTriage }) => {
  const { addToast } = useToasts();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      addToast('Please enter at least 2 characters to search', 'error');
      return;
    }

    setIsSearching(true);
    setSearchPerformed(true);
    try {
      // Audit logging
      const auditLog = {
        timestamp: new Date().toISOString(),
        userId: currentUserId || 'system',
        userRole: 'receptionist',
        action: 'search_patients',
        searchQuery: searchQuery
      };
      console.log('Patient Search Audit:', auditLog);
      
      const results = await api.searchPatients(searchQuery);
      setSearchResults(results);
      setSelectedPatient(null);
    } catch (error: any) {
      console.error('Search failed:', error);
      addToast(error?.message || 'Failed to search patients', 'error');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPatient = (patient: User) => {
    // Audit logging
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: currentUserId || 'system',
      userRole: 'receptionist',
      action: 'view_patient_details',
      patientId: patient.id,
      patientName: patient.name
    };
    console.log('Patient Details View Audit:', auditLog);
    
    setSelectedPatient(patient);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPatient(null);
    setSearchPerformed(false);
  };

  const formatDate = (dateString: string | Date) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-text-primary">Patient Lookup</h2>
        <p className="text-text-secondary mt-1">Search for existing patient records for returning patients</p>
      </div>
      
      {/* Audit Warning */}
      <div className="p-2.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          ⚠️ <strong>Audit Notice:</strong> All patient searches and record access are logged for HIPAA compliance.
        </p>
      </div>

      {/* Search Form */}
      <div className="content-card p-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <Input
              label="Search Patients"
              type="text"
              placeholder="Search by name, email, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary text-xl"
              >
                ✕
              </button>
            )}
          </div>
          <Button type="submit" isLoading={isSearching} disabled={!searchQuery.trim() || searchQuery.trim().length < 2}>
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </form>
      </div>

      {/* Search Results or Patient Details */}
      <div className="content-card p-6">
        {/* Loading State */}
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-text-secondary">Searching patients...</p>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && searchPerformed && searchResults.length === 0 && !selectedPatient && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserIcon className="w-16 h-16 text-text-secondary opacity-50 mb-4" />
            <p className="text-text-primary font-semibold mb-2">No patients found</p>
            <p className="text-text-secondary text-sm">No patients match "{searchQuery}"</p>
            <p className="text-text-secondary text-sm">Try searching with a different name, email, or phone number</p>
          </div>
        )}

        {/* Search Results List */}
        {!isSearching && !selectedPatient && searchResults.length > 0 && (
          <div>
            <div className="mb-4 pb-2 border-b border-border-primary">
              <h3 className="text-lg font-semibold text-text-primary">
                Search Results ({searchResults.length})
              </h3>
            </div>
            <div className="space-y-3">
              {searchResults.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className="flex items-center gap-4 p-4 border border-border-primary rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-background-secondary flex items-center justify-center overflow-hidden">
                    {(patient as any).profilePicture ? (
                      <img src={(patient as any).profilePicture} alt={patient.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-text-secondary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-text-primary">{patient.name}</h4>
                    <div className="flex gap-4 text-sm text-text-secondary mt-1">
                      <span className="flex items-center gap-1">
                        <EnvelopeIcon className="w-4 h-4" />
                        {patient.email}
                      </span>
                      {(patient as any).phoneNumber && (
                        <span className="flex items-center gap-1">
                          <PhoneIcon className="w-4 h-4" />
                          {(patient as any).phoneNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-primary text-2xl">→</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patient Details View */}
        {selectedPatient && (
          <div className="animate-fadeIn">
            <button
              onClick={() => setSelectedPatient(null)}
              className="mb-6 text-primary hover:underline flex items-center gap-1"
            >
              ← Back to Results
            </button>

            {/* Profile Header */}
            <div className="flex items-start gap-6 pb-6 mb-6 border-b border-border-primary">
              <div className="w-20 h-20 rounded-full bg-background-secondary flex items-center justify-center overflow-hidden">
                {(selectedPatient as any).profilePicture ? (
                  <img src={(selectedPatient as any).profilePicture} alt={selectedPatient.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-text-secondary" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-text-primary mb-1">{selectedPatient.name}</h2>
                <p className="text-text-secondary text-sm mb-2">Patient ID: {selectedPatient.id}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  (selectedPatient as any).isActive !== false 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {(selectedPatient as any).isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 bg-background-secondary rounded-lg">
                    <EnvelopeIcon className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <label className="text-xs text-text-secondary block mb-1">Email</label>
                      <p className="text-text-primary font-medium">{selectedPatient.email}</p>
                    </div>
                  </div>
                  {(selectedPatient as any).phoneNumber && (
                    <div className="flex gap-3 p-3 bg-background-secondary rounded-lg">
                      <PhoneIcon className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <label className="text-xs text-text-secondary block mb-1">Phone</label>
                        <p className="text-text-primary font-medium">{(selectedPatient as any).phoneNumber}</p>
                      </div>
                    </div>
                  )}
                  {(selectedPatient as any).address && (
                    <div className="flex gap-3 p-3 bg-background-secondary rounded-lg">
                      <MapPinIcon className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <label className="text-xs text-text-secondary block mb-1">Address</label>
                        <p className="text-text-primary font-medium">{(selectedPatient as any).address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Personal Information</h3>
                <div className="space-y-3">
                  {(selectedPatient as any).dateOfBirth && (
                    <div className="flex gap-3 p-3 bg-background-secondary rounded-lg">
                      <CalendarIcon className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <label className="text-xs text-text-secondary block mb-1">Date of Birth</label>
                        <p className="text-text-primary font-medium">{formatDate((selectedPatient as any).dateOfBirth)}</p>
                      </div>
                    </div>
                  )}
                  {(selectedPatient as any).bloodType && (
                    <div className="flex gap-3 p-3 bg-background-secondary rounded-lg">
                      <HeartIcon className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <label className="text-xs text-text-secondary block mb-1">Blood Type</label>
                        <p className="text-text-primary font-medium">{(selectedPatient as any).bloodType}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              {((selectedPatient as any).emergencyContactName || (selectedPatient as any).emergencyContactPhone) && (
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-3">Emergency Contact</h3>
                  <div className="space-y-3">
                    {(selectedPatient as any).emergencyContactName && (
                      <div className="flex gap-3 p-3 bg-background-secondary rounded-lg">
                        <UserIcon className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <label className="text-xs text-text-secondary block mb-1">Name</label>
                          <p className="text-text-primary font-medium">{(selectedPatient as any).emergencyContactName}</p>
                        </div>
                      </div>
                    )}
                    {(selectedPatient as any).emergencyContactPhone && (
                      <div className="flex gap-3 p-3 bg-background-secondary rounded-lg">
                        <PhoneIcon className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <label className="text-xs text-text-secondary block mb-1">Phone</label>
                          <p className="text-text-primary font-medium">{(selectedPatient as any).emergencyContactPhone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Medical Information - Limited to Safety Data Only (HIPAA Compliant) */}
              {((selectedPatient as any).allergies || (selectedPatient as any).currentMedications) && (
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-text-primary mb-3">
                    Safety Information
                    <span className="ml-2 text-xs font-normal text-text-secondary">(For Emergency Use Only)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(selectedPatient as any).allergies && (
                      <div className="flex gap-3 p-3 bg-background-secondary rounded-lg">
                        <AlertCircleIcon className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                          <label className="text-xs text-text-secondary block mb-1">Allergies</label>
                          <p className="text-text-primary font-medium">{(selectedPatient as any).allergies}</p>
                        </div>
                      </div>
                    )}
                    {(selectedPatient as any).currentMedications && (
                      <div className="flex gap-3 p-3 bg-background-secondary rounded-lg">
                        <PillIcon className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <label className="text-xs text-text-secondary block mb-1">Current Medications</label>
                          <p className="text-text-primary font-medium">{(selectedPatient as any).currentMedications}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-border-primary">
              {onCheckInForTriage && (
                <Button 
                  className="flex-1"
                  onClick={() => onCheckInForTriage(selectedPatient.id)}
                >
                  Check In for Triage
                </Button>
              )}
              
              {/* HIPAA Compliance Note */}
              <div className="flex-1 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>🔒 HIPAA Notice:</strong> Receptionists cannot access full medical history. Only demographic and safety information (allergies) are visible.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Initial State */}
        {!isSearching && !searchPerformed && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <SearchIcon className="w-16 h-16 text-text-secondary opacity-50 mb-4" />
            <p className="text-text-primary font-semibold mb-2">Search for Patients</p>
            <p className="text-text-secondary text-sm">Enter a patient's name, email, or phone number to search</p>
          </div>
        )}
      </div>
    </div>
  );
};
