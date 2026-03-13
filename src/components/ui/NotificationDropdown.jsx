import React, { useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { cn } from '../../utils/cn';

const NotificationDropdown = ({ isOpen, onClose }) => {
    const { notifications, unreadCount, markAllAsRead, handleNotificationClick } = useNotification();
    const dropdownRef = useRef(null);

    // Click-outside to close
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                onClose();
            }
        };
        // Use setTimeout to avoid closing immediately on the same click that opens it
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Escape to close
    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div ref={dropdownRef} className="absolute right-0 top-16 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Notifications ({unreadCount})</h3>
                <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-xs text-slate-500 hover:text-accent transition-colors"
                        >
                            Mark all as read
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="Close notifications"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No new notifications</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "p-4 hover:bg-slate-50 transition-colors cursor-pointer",
                                    !notification.isRead && "bg-blue-50/60"
                                )}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={cn("text-sm font-medium", !notification.isRead ? "text-slate-900" : "text-slate-600")}>
                                        {notification.title || "Notification"}
                                    </h4>
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                        {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 line-clamp-2">{notification.message}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationDropdown;
