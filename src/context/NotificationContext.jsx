import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import notificationService from '../api/services/notificationService';
import { useNavigate } from 'react-router-dom';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [connection, setConnection] = useState(null);
    const connectionRef = useRef(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Sound ref
    const audioRef = useRef(new Audio('/assets/sounds/notification.mp3'));

    // 1. Initial Fetch (Persistence)
    const loadNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const [data, count] = await Promise.all([
                notificationService.getNotifications(1, 20),
                notificationService.getUnreadCount()
            ]);
            setNotifications(data);
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    // 2. Real-time Connection (Socket.io)
    useEffect(() => {
        if (!isAuthenticated) return;

        // Prevent duplicate connections (React StrictMode)
        if (connectionRef.current) {
            connectionRef.current.disconnect();
            connectionRef.current = null;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            // Using Port 4000 as defined in the hr-realtime server
            const socketUrl = import.meta.env.VITE_REALTIME_URL || 'http://localhost:4000';
            
            const newSocket = io(socketUrl, {
                auth: { token },
                transports: ['websocket']
            });

            newSocket.on('connect', () => {
                console.log(`Socket.io Connected: ${newSocket.id} for User: ${user?.id}`);
            });

            newSocket.on('ReceiveNotification', (notification) => {
                console.log('Received notification via Socket.io:', notification);
                // Deduplicate: prevent adding the same notification twice
                setNotifications(prev => {
                    if (prev.some(n => n.id === notification.id)) return prev;
                    return [notification, ...prev];
                });
                setUnreadCount(prev => prev + 1);

                playNotificationSound();
                toast(notification.message, {
                    icon: '🔔',
                    duration: 4000
                });
            });

            // Listen for Feed events (we broadcast these to 'feed' room in FeedService)
            // Even though FeedContext handles feed, we can listen for global toast updates here or specific routing
            // For now, let's just log or handle generic events
            
            newSocket.on('connect_error', (err) => {
                console.error('Socket.io Connection Error: ', err.message);
            });

            connectionRef.current = newSocket;
            setConnection(newSocket);

        } catch (error) {
            console.error('Socket initialization Failed: ', error);
        }

        return () => {
            if (connectionRef.current) {
                connectionRef.current.disconnect();
                connectionRef.current = null;
            }
        };
    }, [isAuthenticated, user?.id]);

    const playNotificationSound = () => {
        try {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log('Audio play failed', e));
        } catch (e) {
            console.error('Sound error', e);
        }
    };

    const markAsRead = async (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await notificationService.markAsRead(id);
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        try {
            await notificationService.markAllAsRead();
        } catch (error) {
            console.error('Failed to mark all read', error);
        }
    };

    // 3. Smart Navigation logic
    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);

        switch (notification.type) {
            case 'Post':
            case 'Comment':
            case 'Mention':
                navigate('/feed');
                // Ideally, we would navigate to /feed?postId=... and scroll to it
                break;
            case 'Document':
                navigate('/documents');
                break;
            case 'Leave':
                navigate('/leaves');
                break;
            case 'Attendance':
                navigate('/attendance');
                break;
            default:
                console.warn('Unknown notification type:', notification.type);
        }
    };

    return (
        <NotificationContext.Provider value={{
            connection,
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            handleNotificationClick,
            loadNotifications,
            playNotificationSound
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
