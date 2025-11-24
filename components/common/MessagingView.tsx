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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageContent.trim() && !selectedImage) || !selectedPatient) return;
    
    let finalMessage = messageContent;
    if (selectedImage) {
      finalMessage = `${messageContent} [Image: ${selectedImage.name}]`.trim();
    }
    
    if (messageContent.startsWith('@ai ')) {
        const command = messageContent.substring(4).trim();
        if (command && onAiChannelCommand) {
            onAiChannelCommand(command, selectedPatient.id);
        }
    } else {
        // Broadcast to a channel - in this mock, we send to the first other non-patient user.
        // A real implementation would have channel IDs.
        const recipient = contacts.find(c => c.role !== 'patient' && c.id !== currentUser.id);
        onSendMessage(recipient?.id || 'group', finalMessage, selectedPatient.id);
    }
    setMessageContent('');
    handleRemoveImage();
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
                {currentChatMessages.length > 0 ? (
                    currentChatMessages.map(msg => {
                        const isOwnMessage = msg.senderId === currentUser.id;
                        const isAiMessage = msg.senderId === 'ai-assistant';
                        const sender = isOwnMessage ? currentUser : contacts.find(c => c.id === msg.senderId);
                        
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
                                        {isAiMessage ? (
                                            <BotMessageSquareIcon className="w-5 h-5 text-primary" />
                                        ) : (
                                            <img src={`https://i.pravatar.cc/150?u=${sender?.id}`} className="w-6 h-6 rounded-full" />
                                        )}
                                        <span className="text-xs font-bold text-text-secondary">{msg.senderName || sender?.name}</span>
                                        <span className="text-xs text-text-secondary opacity-75">{displayTime}</span>
                                    </div>
                                )}
                                <div className={`message-bubble ${isAiMessage ? 'bg-primary-light-bg text-text-primary' : ''}`}>
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
                        <BotMessageSquareIcon className="w-16 h-16 mb-4 text-text-secondary" />
                        <p className="text-text-secondary">No messages yet</p>
                        <p className="text-sm text-text-secondary mt-2">Start the conversation with {selectedPatient?.name}</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="message-input-form">
              {imagePreview && (
                <div className="image-preview-container" style={{ padding: '8px', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px' }} />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', minWidth: 'auto' }}
                  title="Upload image"
                >
                  📎
                </button>
                <input type="text" placeholder="Type a message or use '@ai' for assistance..." value={messageContent} onChange={(e) => setMessageContent(e.target.value)} style={{ flex: 1 }} />
                <button type="submit" className="btn btn-primary">Send</button>
              </div>
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