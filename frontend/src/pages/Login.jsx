import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authLogin, authRegister } from '../api/client';
import { useAuth } from '../context/AuthContext';

const CURRENT_YEAR = new Date().getFullYear();

export default function Login() {
    const [mode, setMode]         = useState('login');   // 'login' | 'register'
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm]   = useState('');
    const [name, setName]         = useState('');
    const [gender, setGender]     = useState('');
    const [dob, setDob]           = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');

    const { login } = useAuth();
    const navigate  = useNavigate();

    const switchMode = (m) => { setMode(m); setError(''); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (mode === 'register') {
            if (password.length < 6) {
                setError('Password must be at least 6 characters.');
                return;
            }
            if (password !== confirm) {
                setError('Passwords do not match.');
                return;
            }
            if (!gender) {
                setError('Please select your gender.');
                return;
            }
        }

        setLoading(true);
        try {
            let data;
            if (mode === 'register') {
                data = await authRegister({
                    email,
                    password,
                    name,
                    gender,
                    year_of_birth: parseInt(dob, 10),
                });
            } else {
                data = await authLogin(email, password);
            }
            login(data.access_token, data.user);
            navigate('/inbox');
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                setError(detail.map((d) => d.msg).join(' '));
            } else {
                setError(detail || err.message || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">🔬</div>
                <h1 className="auth-title">SkinTriage AI</h1>
                <p className="auth-tagline">AI-powered skin lesion triage</p>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                        onClick={() => switchMode('login')}
                    >
                        Log In
                    </button>
                    <button
                        className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => switchMode('register')}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div className="auth-field">
                            <label className="auth-label">Full Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="auth-input"
                                required
                            />
                        </div>
                    )}

                    <div className="auth-field">
                        <label className="auth-label">Email Address</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="auth-input"
                            required
                        />
                    </div>

                    {mode === 'register' && (
                        <>
                            <div className="auth-field">
                                <label className="auth-label">Gender</label>
                                <div className="auth-gender">
                                    {['male', 'female'].map((g) => (
                                        <label key={g} className={`gender-option ${gender === g ? 'selected' : ''}`}>
                                            <input
                                                type="radio"
                                                name="gender"
                                                value={g}
                                                checked={gender === g}
                                                onChange={() => setGender(g)}
                                            />
                                            {g === 'male' ? '♂ Male' : '♀ Female'}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="auth-field">
                                <label className="auth-label">Year of Birth</label>
                                <input
                                    type="number"
                                    placeholder="1990"
                                    min="1920"
                                    max={CURRENT_YEAR - 1}
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    className="auth-input"
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div className="auth-field">
                        <label className="auth-label">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-input"
                            required
                            minLength={6}
                        />
                    </div>

                    {mode === 'register' && (
                        <div className="auth-field">
                            <label className="auth-label">Confirm Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                className="auth-input"
                                required
                            />
                        </div>
                    )}

                    {error && <p className="auth-error">{error}</p>}

                    <button
                        type="submit"
                        className="btn-primary auth-submit"
                        disabled={loading}
                    >
                        {loading
                            ? (mode === 'login' ? 'Logging in…' : 'Creating account…')
                            : (mode === 'login' ? 'Log In' : 'Create Account')}
                    </button>
                </form>
            </div>
        </div>
    );
}
