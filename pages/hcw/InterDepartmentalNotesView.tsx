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
      // Audit logging
      const note = notes.find(n => n.id === noteId);
      const auditLog = {
        timestamp: new Date().toISOString(),
        action: 'mark_interdepartmental_note_read',
        noteId,
        fromUser: note?.fromUserName,
        fromRole: note?.fromRole,
        subject: note?.subject,
        priority: note?.priority
      };
      console.log('Interdepartmental Note Read Audit:', auditLog);
      
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-red-100 text-red-700 border border-red-200">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            High
          </span>
        );
      case 'Normal':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-700 border border-blue-200">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Normal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 border border-gray-200">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
            </svg>
            Low
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
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquareIcon className="h-6 w-6 text-indigo-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Inter-Departmental Notes</h1>
                <p className="text-xs text-gray-500 mt-0.5">Secure team communication</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {unreadCount} unread
                </span>
              )}
              <button
                onClick={() => setComposeModalOpen(true)}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <MessageSquareIcon className="h-4 w-4" />
                <span>Compose</span>
              </button>
              <button
                onClick={fetchNotes}
                className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pill Filter Buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Unread {filter === 'unread' && unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === 'high'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            High Priority {filter === 'high' && `(${filteredNotes.length})`}
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            All {filter === 'all' && `(${filteredNotes.length})`}
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            {filter === 'all' ? 'All Messages' : filter === 'unread' ? 'Unread Messages' : 'High Priority Messages'}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{filteredNotes.length} {filteredNotes.length === 1 ? 'message' : 'messages'}</p>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <EmptyState
              icon={MessageSquareIcon}
              title={filter === 'unread' ? 'All Caught Up! 🎉' : 'No Notes Yet'}
              message={filter === 'unread' ? 'You have no unread messages. Great job staying on top of communications!' : 'There are no inter-departmental notes at this time.'}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`bg-white rounded-lg border transition-all p-4 cursor-pointer ${
                  !note.isRead
                    ? 'border-indigo-300 bg-indigo-50/50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-0.5">
                      {!note.isRead ? (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <BellIcon className="h-4 w-4 text-indigo-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <MessageSquareIcon className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {note.subject}
                        </h3>
                        {!note.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 bg-indigo-600 rounded-full"></span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                        <span className="font-medium">{getRoleLabel(note.fromRole)} - {note.fromUserName}</span>
                        {note.toUserName && (
                          <>
                            <span className="text-gray-400">→</span>
                            <span className="font-medium text-green-700">{note.toUserName}</span>
                          </>
                        )}
                        {!note.toUserName && note.toRole && (
                          <>
                            <span className="text-gray-400">→</span>
                            <span className="font-medium text-purple-700">All {getRoleLabel(note.toRole)}s</span>
                          </>
                        )}
                        <span className="text-gray-400">•</span>
                        <span className="text-blue-700 font-medium">{note.patientName}</span>
                        {getEntityTypeLabel(note.relatedEntityType) && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>{getEntityTypeLabel(note.relatedEntityType)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                    {getPriorityBadge(note.priority)}
                    {!note.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(note.id);
                        }}
                        className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                      >
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        <span>Mark Read</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-3 ml-11">
                  <p className="text-sm text-gray-700 line-clamp-2">{note.message}</p>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100 ml-11">
                  <div className="flex items-center space-x-3 text-gray-500">
                    <div className="flex items-center space-x-1">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {note.isRead && (
                    <span className="text-green-600 font-medium flex items-center space-x-1">
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      <span>Read</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
