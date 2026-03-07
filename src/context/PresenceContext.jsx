import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNotification } from './NotificationContext';
import UserService from '../api/services/userService';

const PresenceContext = createContext(null);

export const PresenceProvider = ({ children }) => {
    const { connection } = useNotification();
    const [presenceMap, setPresenceMap] = useState(new Map()); // Key: userId, Value: { isOnline, lastActiveAt, employeeId }
    const [employeePresenceMap, setEmployeePresenceMap] = useState(new Map()); // Key: employeeId, Value: { isOnline, lastActiveAt, userId }
    const [loading, setLoading] = useState(true);

    // 1. Fetch initial presence data
    const fetchPresence = useCallback(async () => {
        try {
            const data = await UserService.getPresence();
            const newMap = new Map();
            const newEmpMap = new Map();

            data.forEach(user => {
                const status = {
                    isOnline: user.isOnline,
                    lastActiveAt: user.lastActiveAt,
                    employeeId: user.employeeId
                };
                newMap.set(user.id, status);

                if (user.employeeId) {
                    newEmpMap.set(user.employeeId, { ...status, userId: user.id });
                }
            });

            setPresenceMap(newMap);
            setEmployeePresenceMap(newEmpMap);
        } catch (error) {
            console.error("Failed to fetch presence data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 2. Initial Fetch
    useEffect(() => {
        fetchPresence();
    }, [fetchPresence]);

    // 3. Listen to SignalR events using the shared connection from NotificationContext
    useEffect(() => {
        if (!connection) return;

        const updateStatus = (userId, isOnline) => {
            setPresenceMap(prev => {
                const newMap = new Map(prev);
                const existing = newMap.get(userId) || {};
                const newState = { ...existing, isOnline, lastActiveAt: isOnline ? null : new Date().toISOString() };
                newMap.set(userId, newState);

                // Update employee map if linked
                if (existing.employeeId) {
                    setEmployeePresenceMap(prevEmp => {
                        const newEmpMap = new Map(prevEmp);
                        newEmpMap.set(existing.employeeId, { ...newState, userId });
                        return newEmpMap;
                    });
                }

                return newMap;
            });
        };

        const handleUserOnline = (userId) => updateStatus(userId, true);
        const handleUserOffline = (userId) => updateStatus(userId, false);

        connection.on('UserOnline', handleUserOnline);
        connection.on('UserOffline', handleUserOffline);

        return () => {
            connection.off('UserOnline', handleUserOnline);
            connection.off('UserOffline', handleUserOffline);
        };
    }, [connection]);

    // Helper functions
    const getUserStatus = (userId) => {
        return presenceMap.get(userId) || { isOnline: false, lastActiveAt: null };
    };

    const isUserOnline = (userId) => {
        return presenceMap.get(userId)?.isOnline || false;
    };

    const getEmployeeStatus = (employeeId) => {
        return employeePresenceMap.get(employeeId) || { isOnline: false, lastActiveAt: null };
    };

    const isEmployeeOnline = (employeeId) => {
        return employeePresenceMap.get(employeeId)?.isOnline || false;
    };

    return (
        <PresenceContext.Provider value={{
            presenceMap,
            getUserStatus,
            isUserOnline,
            getEmployeeStatus,
            isEmployeeOnline,
            refreshPresence: fetchPresence,
            loading
        }}>
            {children}
        </PresenceContext.Provider>
    );
};

export const usePresence = () => useContext(PresenceContext);
