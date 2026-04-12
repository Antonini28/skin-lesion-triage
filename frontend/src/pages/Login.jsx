import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authLogin, authRegister, authVerifyOTP } from '../api/client';
import { useAuth } from '../context/AuthContext';

const CURRENT_YEAR = new Date().getFullYear();

export default function Login() {
    const [mode, setMode]           = useState('login');   // 'login' | 'register'
    const [step, setStep]           = useState('form');    // 'form' | 'otp'
    const [email, setEmail]         = useState('');
    const [name, setName]           = useState('');
    const [gender, setGender]       = useState('');
    const [dob, setDob]             = useState('');
    const [otp, setOtp]             = useState('');
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState('');
    const [sentMsg, setSentMsg]     = useState('');

    const { login } = useAuth();
    const navigate  = useNavigate();

    const handleForm = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            if (mode === 'register') {
                await authRegister({
                    email, name, gender,
                    year_of_birth: parseInt(dob, 10),
                });
            } else {
                await authLogin(email);
            }
            setSentMsg(`A 6-digit code has been sent to ${email}`);
            setStep('otp');
        } catch (err) {
            setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOTP = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const data = await authVerifyOTP(email, otp);
            login(data.access_token, data.user);
            navigate('/inbox');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid or expired code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /* ── OTP step ── */
    if (step === 'otp') {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-logo">📧</div>
                    <h1 className="auth-title">Check your email</h1>
                    <p className="auth-sub">{sentMsg}</p>

                    <form onSubmit={handleOTP}>
                        <div className="auth-field">
                            <label className="auth-label">Verification Code</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="000000"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                className="auth-input auth-otp-input"
                                autoFocus
                                required
                            />
                        </div>
                        {error && <p className="auth-error">{error}</p>}
                        <button type="submit" className="btn-primary auth-submit" disabled={loading || otp.length < 6}>
                            {loading ? 'Verifying…' : 'Verify Code'}
                        </button>
                        <button type="button" className="auth-back" onClick={() => { setStep('form'); setError(''); setOtp(''); }}>
                            ← Back
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    /* ── Form step ── */
    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">🔬</div>
                <h1 className="auth-title">SkinTriage AI</h1>
                <p className="auth-tagline">AI-powered skin lesion triage</p>

                <div className="auth-tabs">
                    <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>
                        Log In
                    </button>
                    <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>
                        Register
                    </button>
                </div>

                <form onSubmit={handleForm}>
                    {mode === 'register' && (
                        <div className="auth-field">
                            <label className="auth-label">Full Name</label>
                            <input type="text" placeholder="John Doe" value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="auth-input" required />
                        </div>
                    )}

                    <div className="auth-field">
                        <label className="auth-label">Email Address</label>
                        <input type="email" placeholder="you@example.com" value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="auth-input" required />
                    </div>

                    {mode === 'register' && (
                        <>
                            <div className="auth-field">
                                <label className="auth-label">Gender</label>
                                <div className="auth-gender">
                                    {['male', 'female'].map((g) => (
                                        <label key={g} className={`gender-option ${gender === g ? 'selected' : ''}`}>
                                            <input type="radio" name="gender" value={g}
                                                checked={gender === g}
                                                onChange={() => setGender(g)} />
                                            {g === 'male' ? '♂ Male' : '♀ Female'}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="auth-field">
                                <label className="auth-label">Year of Birth</label>
                                <input type="number" placeholder="1990"
                                    min="1920" max={CURRENT_YEAR - 1}
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    className="auth-input" required />
                            </div>
                        </>
                    )}

                    {error && <p className="auth-error">{error}</p>}

                    <button type="submit" className="btn-primary auth-submit"
                        disabled={loading || (mode === 'register' && !gender)}>
                        {loading ? 'Sending code…' : 'Continue with Email →'}
                    </button>

                    <p className="auth-note">
                        {mode === 'login'
                            ? 'We\'ll send a 6-digit code to your email to log you in securely.'
                            : 'No password needed — we verify your identity by email code.'}
                    </p>
                </form>
            </div>
        </div>
    );
}
