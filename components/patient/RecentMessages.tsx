import React, { useMemo } from 'react';
import { Message, User, Patient } from '../../types.ts';
// Fix: Add .tsx extension to local module import.
import { PatientView } from '../../pages/patient/PatientDashboard.tsx';
import { ArrowRightIcon } from '../icons/index.tsx';

interface RecentMessagesProps {
    messages: Message[];
    contacts: (User | Patient)[];
    currentUser: Patient;
    setActiveView: (view: PatientView) => void;
}

export const RecentMessages: React.FC<RecentMessagesProps> = ({ messages, contacts, currentUser, setActiveView }) => {
    const recentConversations = useMemo(() => {
        const conversations = new Map<string, Message>();
        messages.forEach(msg => {
            const otherParticipantId = msg.senderId === currentUser.id ? msg.recipientId : msg.senderId;
            const existingMsg = conversations.get(otherParticipantId);
            if (!existingMsg || new Date(msg.timestamp) > new Date(existingMsg.timestamp)) {
                conversations.set(otherParticipantId, msg);
            }
        });

        return Array.from(conversations.values())
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 3)
            .map(msg => {
                const otherParticipantId = msg.senderId === currentUser.id ? msg.recipientId : msg.senderId;
                const contact = contacts.find(c => c.id === otherParticipantId);
                return { msg, contact };
            });

    }, [messages, contacts, currentUser.id]);

    return (
        <div className="recent-messages-card">
            <h3 className="font-semibold text-text-primary mb-4">Recent Messages</h3>
            {recentConversations.length > 0 ? (
                <ul className="space-y-4">
                    {recentConversations.map(({ msg, contact }) => (
                        <li key={msg.id} className="message-preview-item">
                            <img src={`https://i.pravatar.cc/150?u=${contact?.id}`} alt={contact?.name} className="message-preview-avatar" />
                            <div className="message-preview-content">
                                <p className="message-preview-name">{contact?.name || 'Unknown Contact'}</p>
                                <p className="message-preview-text">
                                    {msg.senderId === currentUser.id && 'You: '}{msg.content}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-text-secondary">No recent messages.</p>
            )}
            <button onClick={() => setActiveView('messages')} className="recent-messages-view-all">
                View All Messages <ArrowRightIcon className="w-4 h-4" />
            </button>
        </div>
    );
};