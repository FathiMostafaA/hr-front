import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../api/services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                // Try to refresh token on startup using cookie
                const data = await AuthService.refresh();
                if (data && data.user) {
                    setUser(data.user);
                }
            } catch (err) {
                console.log('Silent refresh failed:', err);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        if (AuthService.getCurrentUser()) {
            initAuth();
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (credentials) => {
        const data = await AuthService.login(credentials);
        setUser(data.user);
        return data;
    };

    const logout = async () => {
        await AuthService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
