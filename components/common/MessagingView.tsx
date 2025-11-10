import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, User, Patient } from '../../types.ts';
import { VideoIcon, BotMessageSquareIcon } from '../icons/index.tsx';

interface MessagingViewProps {
  messages: Message[];
  currentUser: User | Patient;
  contacts: (User | Patient)[]; // Will be filtered to show only patients for HCWs
  onSendMessage: (recipientId: string, content: string, patientId?: string) => void;
  onStartCall: (contact: User | Patient) => void;
  onAiChannelCommand?: (command: string, patientId: string) => void;
}

export const MessagingView: React.FC<MessagingViewProps> = (props) => {
  const { messages, currentUser, contacts, onSendMessage, onStartCall, onAiChannelCommand } = props;
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // For HCWs, the "contacts" are the patients they can open channels for.
  const patientContacts = useMemo(() => contacts.filter(c => c.role === 'patient'), [contacts]);

  useEffect(() => {
    if(!selectedPatient && patientContacts.length > 0) {
        setSelectedPatient(patientContacts[0] as Patient);
    }
  }, [patientContacts, selectedPatient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedPatient]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !selectedPatient) return;
    
    if (messageContent.startsWith('@ai ') && onAiChannelCommand) {
        const command = messageContent.substring(4);
        onAiChannelCommand(command, selectedPatient.id);
    } else {
        // Broadcast to a channel - in this mock, we send to the first other non-patient user.
        // A real implementation would have channel IDs.
        const recipient = contacts.find(c => c.role !== 'patient' && c.id !== currentUser.id);
        onSendMessage(recipient?.id || 'group', messageContent, selectedPatient.id);
    }
    setMessageContent('');
  };
  
  const currentChatMessages = useMemo(() => {
    if (!selectedPatient) return [];
    // Filter messages for the selected patient's channel
    return messages
        .filter(m => m.patientId === selectedPatient.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, selectedPatient]);

  return (
    <div className="messaging-container">
      <aside className="contact-list">
        <div className="contact-list-header">
          <h2 className="text-xl font-bold">Patient Channels</h2>
        </div>
        <ul>
          {patientContacts.map((patient) => (
            <li key={patient.id} onClick={() => setSelectedPatient(patient as Patient)} className={`contact-item ${selectedPatient?.id === patient.id ? 'active' : ''}`}>
               <img src={`https://i.pravatar.cc/150?u=${patient.id}`} alt={patient.name} />
              <div className="contact-item-info">
                <h3>{patient.name}</h3>
                <p>Patient Channel</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>
      <main className="chat-window">
        {selectedPatient ? (
          <>
            <header className="chat-header">
              <h3>Care Coordination: {selectedPatient.name}</h3>
              <button className="btn btn-secondary" onClick={() => onStartCall(selectedPatient)}>
                <VideoIcon className="w-5 h-5 mr-2" />
                Start Video Call
              </button>
            </header>
            <div className="message-area">
                {currentChatMessages.map(msg => {
                    const isOwnMessage = msg.senderId === currentUser.id;
                    const isAiMessage = msg.senderId === 'ai-assistant';
                    const sender = isOwnMessage ? currentUser : contacts.find(c => c.id === msg.senderId);
                    
                    return (
                        <div key={msg.id} className={`message-bubble-wrapper ${isOwnMessage ? 'sent' : 'received'}`}>
                            {!isOwnMessage && (
                                <div className="flex items-center gap-2 mb-1">
                                    {isAiMessage ? (
                                        <BotMessageSquareIcon className="w-5 h-5 text-primary" />
                                    ) : (
                                        <img src={`https://i.pravatar.cc/150?u=${sender?.id}`} className="w-6 h-6 rounded-full" />
                                    )}
                                    <span className="text-xs font-bold text-text-secondary">{msg.senderName || sender?.name}</span>
                                </div>
                            )}
                            <div className={`message-bubble ${isAiMessage ? 'bg-primary-light-bg text-text-primary' : ''}`}>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="message-input-form">
              <input type="text" placeholder="Type a message or use '@ai' for assistance..." value={messageContent} onChange={(e) => setMessageContent(e.target.value)} />
              <button type="submit" className="btn btn-primary">Send</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Select a patient channel to begin.</p>
          </div>
        )}
      </main>
    </div>
  );
};