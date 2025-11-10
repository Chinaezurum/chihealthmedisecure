import React from 'react';
import { Notification } from '../../types.ts';

interface NotificationPanelProps {
    notifications: Notification[];
    onClose: () => void;
    onMarkAllAsRead: () => void;
}

const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const notificationDate = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onClose: _onClose, onMarkAllAsRead }) => {
    return (
        <div className="notification-panel">
            <div className="notification-panel-header">
                <h3>Notifications</h3>
                <button onClick={onMarkAllAsRead}>Mark all as read</button>
            </div>
            <div className="notification-panel-body">
                {notifications.length > 0 ? (
                    <ul>
                        {notifications.map(n => (
                            <li key={n.id} className={`notification-item ${!n.isRead ? 'unread' : ''}`}>
                                <p>{n.message}</p>
                                <div className="notification-timestamp">{formatTimeAgo(n.timestamp)}</div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="p-8 text-center text-text-secondary text-sm">
                        You have no notifications.
                    </div>
                )}
            </div>
        </div>
    );
};