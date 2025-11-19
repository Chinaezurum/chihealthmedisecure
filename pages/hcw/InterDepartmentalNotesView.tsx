import React, { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { InterDepartmentalNote } from '../../types.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import * as api from '../../services/apiService.ts';
import { BellIcon, CheckCircleIcon, MessageSquareIcon } from '../../components/icons/index.tsx';

interface InterDepartmentalNotesViewProps {
  refreshTrigger?: number;
}

export const InterDepartmentalNotesView: React.FC<InterDepartmentalNotesViewProps> = ({ refreshTrigger }) => {
  const [notes, setNotes] = useState<InterDepartmentalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('unread');
  const { addToast } = useToasts();

  useEffect(() => {
    fetchNotes();
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
        return <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300">HIGH</span>;
      case 'Normal':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">NORMAL</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300">LOW</span>;
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-text-primary">Inter-Departmental Notes</h2>
          <p className="text-text-secondary mt-1">
            Messages from nurses, lab techs, and pharmacists
            {unreadCount > 0 && <span className="ml-2 px-2 py-1 text-xs font-bold rounded-full bg-red-500 text-white">{unreadCount} unread</span>}
          </p>
        </div>
        <Button onClick={fetchNotes}>
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border-primary">
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'unread'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
        <button
          onClick={() => setFilter('high')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'high'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          High Priority
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'all'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          All Notes ({notes.length})
        </button>
      </div>

      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={MessageSquareIcon}
          title={filter === 'unread' ? 'No Unread Notes' : 'No Notes'}
          message={filter === 'unread' ? 'You have no unread messages from other departments.' : 'There are no inter-departmental notes at this time.'}
        />
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`content-card p-6 ${!note.isRead ? 'border-l-4 border-l-primary bg-blue-50/50 dark:bg-blue-900/10' : ''} hover:shadow-lg transition-shadow`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {!note.isRead && <BellIcon className="w-5 h-5 text-primary animate-pulse" />}
                    <h3 className="text-lg font-bold text-text-primary">{note.subject}</h3>
                    {getPriorityBadge(note.priority)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-secondary">
                    <span className="font-medium">From: {getRoleLabel(note.fromRole)} - {note.fromUserName}</span>
                    {note.toUserName && (
                      <>
                        <span>•</span>
                        <span>To: {note.toUserName}</span>
                      </>
                    )}
                    {!note.toUserName && note.toRole && (
                      <>
                        <span>•</span>
                        <span>To: All {getRoleLabel(note.toRole)}s</span>
                      </>
                    )}
                    <span>•</span>
                    <span>Patient: {note.patientName}</span>
                    {getEntityTypeLabel(note.relatedEntityType) && (
                      <>
                        <span>•</span>
                        <span>{getEntityTypeLabel(note.relatedEntityType)}</span>
                      </>
                    )}
                  </div>
                </div>
                {!note.isRead && (
                  <Button
                    onClick={() => handleMarkAsRead(note.id)}
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Mark Read
                  </Button>
                )}
              </div>

              <div className="bg-background-secondary rounded-lg p-4 mb-3">
                <p className="text-text-primary whitespace-pre-wrap">{note.message}</p>
              </div>

              <div className="flex justify-between items-center text-xs text-text-tertiary">
                <span>{new Date(note.timestamp).toLocaleString()}</span>
                {note.isRead && <span className="text-green-600 dark:text-green-400">✓ Read</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
