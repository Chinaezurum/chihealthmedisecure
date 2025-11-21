import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, User } from '../../types.ts';
import { VideoIcon } from '../icons/index.tsx';

interface TeamMessagingViewProps {
  messages: Message[];
  currentUser: User;
  staffContacts: User[]; // Staff members only, no patients
  onSendMessage: (recipientId: string, content: string) => void;
  onStartCall?: (contact: User) => void;
}

export const TeamMessagingView: React.FC<TeamMessagingViewProps> = (props) => {
  const { messages, currentUser, staffContacts, onSendMessage, onStartCall } = props;
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Filter to show only staff (non-patient) contacts
  const teamMembers = useMemo(() => 
    staffContacts.filter(c => c.role !== 'patient' && c.id !== currentUser.id), 
    [staffContacts, currentUser.id]
  );

  useEffect(() => {
    if(!selectedContact && teamMembers.length > 0) {
        setSelectedContact(teamMembers[0]);
    }
  }, [teamMembers, selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedContact]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !selectedContact) return;
    
    onSendMessage(selectedContact.id, messageContent);
    setMessageContent('');
  };
  
  // Filter messages between current user and selected contact (direct messages, no patient channel)
  const currentChatMessages = useMemo(() => {
    if (!selectedContact) return [];
    return messages
        .filter(m => 
            !m.patientId && ( // No patient channel - direct staff communication
                (m.senderId === currentUser.id && m.recipientId === selectedContact.id) ||
                (m.senderId === selectedContact.id && m.recipientId === currentUser.id)
            )
        )
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, selectedContact, currentUser.id]);

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'admin': 'text-purple-600 dark:text-purple-400',
      'hcw': 'text-blue-600 dark:text-blue-400',
      'nurse': 'text-green-600 dark:text-green-400',
      'pharmacist': 'text-orange-600 dark:text-orange-400',
      'lab_technician': 'text-cyan-600 dark:text-cyan-400',
      'receptionist': 'text-pink-600 dark:text-pink-400',
      'logistics': 'text-yellow-600 dark:text-yellow-400',
      'accountant': 'text-indigo-600 dark:text-indigo-400',
      'command_center': 'text-red-600 dark:text-red-400',
    };
    return colors[role] || 'text-gray-600 dark:text-gray-400';
  };

  const getRoleBadge = (role: string) => {
    const labels: Record<string, string> = {
      'admin': 'Admin',
      'hcw': 'Doctor',
      'nurse': 'Nurse',
      'pharmacist': 'Pharmacist',
      'lab_technician': 'Lab Tech',
      'receptionist': 'Reception',
      'logistics': 'Logistics',
      'accountant': 'Accountant',
      'command_center': 'Command',
    };
    return labels[role] || role;
  };

  return (
    <div className="messaging-container">
      <aside className="contact-list">
        <div className="contact-list-header">
          <h2 className="text-xl font-bold">Team Members</h2>
          <p className="text-xs text-text-secondary mt-1">Staff Communication</p>
        </div>
        <ul>
          {teamMembers.map((staff) => (
            <li 
              key={staff.id} 
              onClick={() => setSelectedContact(staff)} 
              className={`contact-item ${selectedContact?.id === staff.id ? 'active' : ''}`}
            >
               <img src={`https://i.pravatar.cc/150?u=${staff.id}`} alt={staff.name} />
              <div className="contact-item-info">
                <h3>{staff.name}</h3>
                <p className={getRoleColor(staff.role)}>{getRoleBadge(staff.role)}</p>
              </div>
            </li>
          ))}
          {teamMembers.length === 0 && (
            <li className="p-4 text-center text-text-secondary text-sm">
              No team members available
            </li>
          )}
        </ul>
      </aside>
      <main className="chat-window">
        {selectedContact ? (
          <>
            <header className="chat-header">
              <div>
                <h3>{selectedContact.name}</h3>
                <p className={`text-sm ${getRoleColor(selectedContact.role)}`}>
                  {getRoleBadge(selectedContact.role)}
                </p>
              </div>
              {onStartCall && (
                <button className="btn btn-secondary" onClick={() => onStartCall(selectedContact)}>
                  <VideoIcon className="w-5 h-5 mr-2" />
                  Start Video Call
                </button>
              )}
            </header>
            <div className="message-area">
                {currentChatMessages.length > 0 ? (
                    currentChatMessages.map(msg => {
                        const isOwnMessage = msg.senderId === currentUser.id;
                        const sender = isOwnMessage ? currentUser : selectedContact;
                        
                        // Format timestamp
                        const messageDate = new Date(msg.timestamp);
                        const timeString = messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        const dateString = messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const isToday = messageDate.toDateString() === new Date().toDateString();
                        const displayTime = isToday ? timeString : `${dateString} ${timeString}`;
                        
                        return (
                            <div key={msg.id} className={`message-bubble-wrapper ${isOwnMessage ? 'sent' : 'received'}`}>
                                {!isOwnMessage && (
                                    <div className="flex items-center gap-2 mb-1">
                                        <img src={`https://i.pravatar.cc/150?u=${sender?.id}`} className="w-6 h-6 rounded-full" />
                                        <span className="text-xs font-bold text-text-secondary">{msg.senderName || sender?.name}</span>
                                        <span className="text-xs text-text-secondary opacity-75">{displayTime}</span>
                                    </div>
                                )}
                                <div className="message-bubble">
                                    {msg.content}
                                    {isOwnMessage && (
                                        <div className="text-xs text-right mt-1 opacity-75">{displayTime}</div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                        <VideoIcon className="w-16 h-16 mb-4 text-text-secondary" />
                        <p className="text-text-secondary">No messages yet</p>
                        <p className="text-sm text-text-secondary mt-2">Start a conversation with {selectedContact?.name}</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="message-input-form">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <input 
                  type="text" 
                  placeholder="Type a message to your team member..." 
                  value={messageContent} 
                  onChange={(e) => setMessageContent(e.target.value)} 
                  style={{ flex: 1 }} 
                />
                <button type="submit" className="btn btn-primary">Send</button>
              </div>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Select a team member to begin messaging.</p>
          </div>
        )}
      </main>
    </div>
  );
};
