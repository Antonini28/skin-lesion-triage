import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../api/client';
import { useAuth } from '../context/AuthContext';

const CURRENT_YEAR = new Date().getFullYear();

/** Resize any image file to a 200×200 JPEG base64 data-URL. */
function resizeImage(file) {
    return new Promise((resolve) => {
        const img    = new Image();
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
        };
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 200;
            const ctx   = canvas.getContext('2d');
            const scale = Math.max(200 / img.width, 200 / img.height);
            const x     = (200 - img.width  * scale) / 2;
            const y     = (200 - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        reader.readAsDataURL(file);
    });
}

export default function Account() {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const fileRef  = useRef(null);

    const [name,    setName]    = useState(user?.name          ?? '');
    const [gender,  setGender]  = useState(user?.gender        ?? '');
    const [dob,     setDob]     = useState(user?.year_of_birth ?? '');
    const [picture, setPicture] = useState(user?.profile_picture ?? null);

    const [saving,  setSaving]  = useState(false);
    const [saved,   setSaved]   = useState(false);
    const [error,   setError]   = useState('');

    /* ── Not logged in ── */
    if (!user) {
        return (
            <div className="account-page">
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
                    <h3 style={{ marginBottom: '.5rem' }}>You're not logged in</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Create an account to save your profile and scan history.
                    </p>
                    <button className="btn-primary" style={{ width: 200 }} onClick={() => navigate('/login')}>
                        Log In / Register
                    </button>
                </div>
            </div>
        );
    }

    const handlePicture = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const dataURL = await resizeImage(file);
        setPicture(dataURL);
    };

    const handleSave = async () => {
        setSaving(true); setError(''); setSaved(false);
        try {
            const updated = await updateProfile({
                name:            name.trim() || undefined,
                gender:          gender      || undefined,
                year_of_birth:   dob ? parseInt(dob, 10) : undefined,
                profile_picture: picture     || undefined,
            });
            updateUser(updated);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch {
            setError('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="account-page">
            {/* Profile picture */}
            <div className="account-pic-wrapper" onClick={() => fileRef.current?.click()}>
                {picture
                    ? <img src={picture} alt="Profile" className="account-pic" />
                    : (
                        <div className="account-pic-placeholder">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                        </div>
                    )
                }
                <div className="account-pic-edit">📷</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePicture} />
            <p className="account-pic-hint">Tap to change photo</p>

            {/* Profile form */}
            <div className="account-section">
                <h3 className="account-section-title">Account</h3>

                <label className="account-label">Full Name</label>
                <input className="account-input" type="text" value={name}
                    onChange={(e) => setName(e.target.value)} placeholder="Your name" />

                <label className="account-label">Email</label>
                <input className="account-input" type="email" value={user.email} readOnly
                    style={{ background: '#f8fafc', color: 'var(--text-muted)' }} />

                <label className="account-label">Gender</label>
                <div className="auth-gender" style={{ marginBottom: '1rem' }}>
                    {['male', 'female'].map((g) => (
                        <label key={g} className={`gender-option ${gender === g ? 'selected' : ''}`}>
                            <input type="radio" name="gender" value={g}
                                checked={gender === g} onChange={() => setGender(g)} />
                            {g === 'male' ? '♂ Male' : '♀ Female'}
                        </label>
                    ))}
                </div>

                <label className="account-label">Year of Birth</label>
                <input className="account-input" type="number"
                    min="1920" max={CURRENT_YEAR - 1}
                    value={dob} onChange={(e) => setDob(e.target.value)}
                    placeholder="e.g. 1990" />

                {error && <p className="auth-error">{error}</p>}

                <button className="btn-primary account-save-btn" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
                </button>
            </div>

            <button className="account-logout-btn" onClick={handleLogout}>
                Log Out
            </button>

            <p className="account-legal">
                This tool does not provide a medical diagnosis. Always consult a qualified dermatologist for evaluation.
            </p>
        </div>
    );
}
