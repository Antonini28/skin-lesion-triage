import { useState } from 'react';

export default function Account() {
    const [name, setName] = useState(() => localStorage.getItem('skintriage_name') || '');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        localStorage.setItem('skintriage_name', name.trim());
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="account-page">
            <div className="account-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
            </div>

            <div className="account-section">
                <label className="account-label">Your Name</label>
                <input
                    className="account-input"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button className="btn-primary account-save-btn" onClick={handleSave}>
                    {saved ? '✓ Saved' : 'Save'}
                </button>
            </div>

            <div className="account-section">
                <h3 className="account-section-title">About SkinTriage AI</h3>
                <ul className="account-info-list">
                    <li><span>Model</span><span>EfficientNet-B0 (INT8)</span></li>
                    <li><span>Classes</span><span>7 skin lesion types</span></li>
                    <li><span>Version</span><span>1.0.0</span></li>
                </ul>
            </div>

            <p className="account-legal">
                This tool does not provide a medical diagnosis. Always consult a qualified
                dermatologist for evaluation.
            </p>
        </div>
    );
}
