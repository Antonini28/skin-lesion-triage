import { useCallback, useEffect, useState } from 'react';
import api, { getMe } from '../api/client';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }) {
    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) { setLoading(false); return; }
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
            const data = await getMe();
            setUser(data);
        } catch {
            localStorage.removeItem('auth_token');
            delete api.defaults.headers.common['Authorization'];
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadUser(); }, [loadUser]);

    const login = (token, userData) => {
        localStorage.setItem('auth_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const updateUser = (userData) => setUser((prev) => ({ ...prev, ...userData }));

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}
