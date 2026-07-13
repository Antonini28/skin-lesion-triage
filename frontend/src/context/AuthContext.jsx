import { useEffect, useState } from 'react';
import api, { getMe } from '../api/client';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    // Only a stored token needs verifying, so loading starts true only then —
    // this keeps the effect free of synchronous setState calls.
    const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('auth_token')));

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        getMe()
            .then((data) => setUser(data))
            .catch(() => {
                localStorage.removeItem('auth_token');
                delete api.defaults.headers.common['Authorization'];
            })
            .finally(() => setLoading(false));
    }, []);

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
