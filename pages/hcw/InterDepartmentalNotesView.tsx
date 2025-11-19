import React, { useState, useEffect } from 'react';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { InterDepartmentalNote, User } from '../../types.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import * as api from '../../services/apiService.ts';
import { BellIcon, CheckCircleIcon, MessageSquareIcon } from '../../components/icons/index.tsx';
import { InterDepartmentalNotesModal } from '../../components/common/InterDepartmentalNotesModal.tsx';

interface InterDepartmentalNotesViewProps {
  refreshTrigger?: number;
}

export const InterDepartmentalNotesView: React.FC<InterDepartmentalNotesViewProps> = ({ refreshTrigger }) => {
  const [notes, setNotes] = useState<InterDepartmentalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('unread');
  const [isComposeModalOpen, setComposeModalOpen] = useState(false);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const { addToast } = useToasts();

  useEffect(() => {
    fetchNotes();
    fetchStaffUsers();
  }, [refreshTrigger]);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const data = await api.getInterDepartmentalNotes();
      setNotes(data);
    } catch (error) {
      console.error('Failed to fetch inter-departmental notes:', error);
      addToast('Failed to load notes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      const staff = await api.fetchStaffUsers();
      setStaffUsers(staff);
    } catch (error) {
      console.error('Failed to fetch staff users:', error);
    }
  };

  const handleMarkAsRead = async (noteId: string) => {
    try {
      await api.markNoteAsRead(noteId);
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === noteId ? { ...note, isRead: true } : note
        )
      );
      addToast('Note marked as read', 'success');
    } catch (error) {
      console.error('Failed to mark note as read:', error);
      addToast('Failed to update note', 'error');
    }
  };

  const getFilteredNotes = () => {
    switch (filter) {
      case 'unread':
        return notes.filter(n => !n.isRead);
      case 'high':
        return notes.filter(n => n.priority === 'High');
      default:
        return notes;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            HIGH PRIORITY
          </span>
        );
      case 'Normal':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            NORMAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-500/30">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
            </svg>
            LOW
          </span>
        );
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'hcw': 'Doctor',
      'nurse': 'Nurse',
      'lab_technician': 'Lab Technician',
      'pharmacist': 'Pharmacist',
      'receptionist': 'Receptionist',
      'admin': 'Administrator',
      'patient': 'Patient'
    };
    return labels[role] || role;
  };

  const getEntityTypeLabel = (type?: string) => {
    if (!type || type === 'general') return null;
    const labels: Record<string, string> = {
      'lab': '🧪 Lab Test',
      'prescription': '💊 Prescription',
      'vitals': '❤️ Vitals'
    };
    return labels[type] || type;
  };

  const filteredNotes = getFilteredNotes();
  const unreadCount = notes.filter(n => !n.isRead).length;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 rounded-2xl p-8 shadow-xl">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <MessageSquareIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Inter-Departmental Notes</h2>
              <p className="text-blue-100 dark:text-purple-100 mt-2 text-lg">
                Collaborate seamlessly across all departments
              </p>
              {unreadCount > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                  <BellIcon className="w-4 h-4" />
                  {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setComposeModalOpen(true)}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-blue-600 font-semibold px-6 py-3 rounded-xl shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <MessageSquareIcon className="w-5 h-5" />
              Compose Note
            </button>
            <button
              onClick={fetchNotes}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold px-5 py-3 rounded-xl transition-all hover:scale-105 border border-white/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-background-primary rounded-xl shadow-md border border-border-primary overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 px-6 py-4 font-semibold text-sm transition-all ${
              filter === 'unread'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                : 'text-text-secondary hover:bg-background-secondary'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BellIcon className={`w-4 h-4 ${filter === 'unread' ? 'animate-pulse' : ''}`} />
              <span>Unread</span>
              {unreadCount > 0 && filter === 'unread' && (
                <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs">{unreadCount}</span>
              )}
            </div>
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`flex-1 px-6 py-4 font-semibold text-sm transition-all ${
              filter === 'high'
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md'
                : 'text-text-secondary hover:bg-background-secondary'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>High Priority</span>
            </div>
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-6 py-4 font-semibold text-sm transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md'
                : 'text-text-secondary hover:bg-background-secondary'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageSquareIcon className="w-4 h-4" />
              <span>All Notes</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${filter === 'all' ? 'bg-white/30' : 'bg-background-tertiary'}`}>
                {notes.length}
              </span>
            </div>
          </button>
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="bg-background-primary rounded-2xl shadow-lg border border-border-primary p-12">
          <EmptyState
            icon={MessageSquareIcon}
            title={filter === 'unread' ? 'All Caught Up! 🎉' : 'No Notes Yet'}
            message={filter === 'unread' ? 'You have no unread messages. Great job staying on top of communications!' : 'There are no inter-departmental notes at this time.'}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`group bg-background-primary rounded-2xl shadow-md border transition-all duration-200 hover:shadow-xl hover:scale-[1.01] ${
                !note.isRead 
                  ? 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-purple-50/30 dark:from-blue-900/20 dark:to-purple-900/10 border-blue-200 dark:border-blue-800' 
                  : 'border-border-primary hover:border-primary/50'
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {!note.isRead && (
                        <div className="bg-blue-500 text-white p-2 rounded-lg animate-pulse">
                          <BellIcon className="w-5 h-5" />
                        </div>
                      )}
                      <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors">
                        {note.subject}
                      </h3>
                      {getPriorityBadge(note.priority)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <div className="flex items-center gap-2 bg-background-secondary px-3 py-1.5 rounded-lg">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium text-text-primary">
                          {getRoleLabel(note.fromRole)} - {note.fromUserName}
                        </span>
                      </div>
                      {note.toUserName && (
                        <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-lg">
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className="text-green-700 dark:text-green-300 font-medium">{note.toUserName}</span>
                        </div>
                      )}
                      {!note.toUserName && note.toRole && (
                        <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg">
                          <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-purple-700 dark:text-purple-300 font-medium">All {getRoleLabel(note.toRole)}s</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-blue-700 dark:text-blue-300 font-medium">{note.patientName}</span>
                      </div>
                      {getEntityTypeLabel(note.relatedEntityType) && (
                        <span className="bg-background-tertiary px-3 py-1.5 rounded-lg text-text-secondary font-medium">
                          {getEntityTypeLabel(note.relatedEntityType)}
                        </span>
                      )}
                    </div>
                  </div>
                  {!note.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(note.id)}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-4 py-2 rounded-xl transition-all hover:scale-105 shadow-md hover:shadow-lg"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      Mark Read
                    </button>
                  )}
                </div>

                <div className="bg-background-secondary rounded-xl p-5 mb-4 border border-border-primary">
                  <p className="text-text-primary leading-relaxed whitespace-pre-wrap">{note.message}</p>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-text-tertiary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{new Date(note.timestamp).toLocaleString()}</span>
                  </div>
                  {note.isRead && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Read</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compose Note Modal */}
      <InterDepartmentalNotesModal
        isOpen={isComposeModalOpen}
        onClose={() => setComposeModalOpen(false)}
        patientId="general"
        patientName="General Communication"
        availableUsers={staffUsers}
        relatedEntityType="general"
        onSendNote={() => {
          setComposeModalOpen(false);
          fetchNotes();
        }}
      />
    </div>
  );
};
