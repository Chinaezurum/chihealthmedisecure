import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/apiService';

// Query keys for consistent cache management
export const queryKeys = {
  patientData: (userId?: string) => ['patientData', userId],
  hcwData: (userId?: string) => ['hcwData', userId],
  staffUsers: ['staffUsers'],
  billingCodes: ['billingCodes'],
  insuranceProviders: ['insuranceProviders'],
  interDepartmentalNotes: ['interDepartmentalNotes'],
  externalLabResults: (patientId?: string) => ['externalLabResults', patientId],
  incomingReferrals: ['incomingReferrals'],
};

// Patient Dashboard Queries
export function usePatientData(userId?: string) {
  return useQuery({
    queryKey: queryKeys.patientData(userId),
    queryFn: () => api.fetchPatientData(),
    staleTime: 30000, // Fresh for 30 seconds
    gcTime: 120000, // Keep in cache for 2 minutes
  });
}

// HCW Dashboard Queries
export function useHcwData(userId?: string) {
  return useQuery({
    queryKey: queryKeys.hcwData(userId),
    queryFn: () => api.fetchHcwData(),
    staleTime: 30000,
    gcTime: 120000,
  });
}

// Staff Users (used across multiple dashboards)
export function useStaffUsers() {
  return useQuery({
    queryKey: queryKeys.staffUsers,
    queryFn: () => api.fetchStaffUsers(),
    staleTime: 60000, // Fresh for 1 minute
    gcTime: 300000, // Keep for 5 minutes
  });
}

// Billing Codes
export function useBillingCodes() {
  return useQuery({
    queryKey: queryKeys.billingCodes,
    queryFn: () => api.getBillingCodes(),
    staleTime: 300000, // Fresh for 5 minutes (rarely changes)
    gcTime: 600000, // Keep for 10 minutes
  });
}

// Insurance Providers
export function useInsuranceProviders() {
  return useQuery({
    queryKey: queryKeys.insuranceProviders,
    queryFn: () => api.getInsuranceProviders(),
    staleTime: 300000,
    gcTime: 600000,
  });
}

// Inter-Departmental Notes
export function useInterDepartmentalNotes() {
  return useQuery({
    queryKey: queryKeys.interDepartmentalNotes,
    queryFn: () => api.getInterDepartmentalNotes(),
    staleTime: 20000, // Fresh for 20 seconds
    gcTime: 120000,
  });
}

// External Lab Results
export function useExternalLabResults(patientId?: string) {
  return useQuery({
    queryKey: queryKeys.externalLabResults(patientId),
    queryFn: () => api.getExternalLabResults(patientId),
    staleTime: 60000,
    enabled: !!patientId, // Only fetch if patientId is provided
  });
}

// Incoming Referrals
export function useIncomingReferrals() {
  return useQuery({
    queryKey: queryKeys.incomingReferrals,
    queryFn: () => api.getIncomingReferrals(),
    staleTime: 30000,
  });
}

// Mutations with automatic cache invalidation
export function useBookAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (appointmentData: any) => api.bookAppointment(appointmentData),
    onSuccess: () => {
      // Invalidate related caches
      queryClient.invalidateQueries({ queryKey: queryKeys.patientData() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hcwData() });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (appointmentId: string) => api.deleteAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patientData() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hcwData() });
    },
  });
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (prescriptionData: any) => api.createPrescription(prescriptionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patientData() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hcwData() });
    },
  });
}

export function useAddInterDepartmentalNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (noteData: any) => api.createInterDepartmentalNote(noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.interDepartmentalNotes });
    },
  });
}

export function useCreateIncomingReferral() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (referralData: any) => api.createIncomingReferral(referralData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incomingReferrals });
    },
  });
}

// Prefetch utilities for performance optimization
export function usePrefetchPatientData(userId: string) {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.patientData(userId),
      queryFn: () => api.fetchPatientData(),
    });
  };
}

export function usePrefetchHcwData(userId: string) {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.hcwData(userId),
      queryFn: () => api.fetchHcwData(),
    });
  };
}

