import { useState } from 'react';

function BodySilhouette({ side }) {
    return (
        <svg
            viewBox="0 0 100 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="body-svg"
            aria-label={`Body ${side} view`}
        >
            {/* Head */}
            <ellipse cx="50" cy="19" rx="13" ry="16" stroke="#94a3b8" strokeWidth="1.5"/>
            {/* Neck */}
            <path d="M43 34 L43 43 Q50 46 57 43 L57 34" stroke="#94a3b8" strokeWidth="1.5" fill="none"/>
            {/* Torso + hips + legs */}
            <path
                d="M43 43 Q30 47 24 60 L20 108 Q20 116 26 118
                   L32 158 L28 210 L42 212 L48 162 L50 164
                   L52 162 L58 212 L72 210 L68 158 L74 118
                   Q80 116 80 108 L76 60 Q70 47 57 43 Z"
                stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeLinejoin="round"
            />
            {/* Left arm */}
            <path
                d="M24 62 L14 106 Q12 114 16 118 L20 122
                   Q24 122 26 118 L30 108"
                stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeLinejoin="round"
            />
            {/* Right arm */}
            <path
                d="M76 62 L86 106 Q88 114 84 118 L80 122
                   Q76 122 74 118 L70 108"
                stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeLinejoin="round"
            />
            {side === 'back' && (
                <line x1="50" y1="55" x2="50" y2="148"
                    stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3"/>
            )}
        </svg>
    );
}

export default function BodyMap({ onScan }) {
    const [side, setSide]               = useState('front');
    const [showOnboarding, setOnboard]  = useState(() => !localStorage.getItem('skintriage_onboarded'));
    const [reminderSet, setReminderSet] = useState(false);

    const dismissOnboarding = () => {
        localStorage.setItem('skintriage_onboarded', '1');
        setOnboard(false);
    };

    const startScanFromOnboarding = () => {
        dismissOnboarding();
        onScan();
    };

    const handleReminder = () => {
        setReminderSet(true);
        setTimeout(() => setReminderSet(false), 3000);
    };

    return (
        <div className="body-map">
            {/* Profile header */}
            <div className="profile-section">
                <div className="profile-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                </div>
                <div className="profile-info">
                    <div className="profile-name">
                        {localStorage.getItem('skintriage_name') || 'Guest User'}
                    </div>
                    <div className="profile-links">
                        <button className="profile-link">Find risk profile</button>
                        <span className="profile-sep">|</span>
                        <button className="profile-link">Find skin type</button>
                    </div>
                </div>
            </div>

            {/* Info banner */}
            <div className="info-banner">
                <div className="info-banner-left">
                    <span className="info-banner-icon">?</span>
                    <span className="info-banner-text">
                        Interested in learning more about skin cancer?{' '}
                        <a
                            href="https://www.cancer.org/cancer/types/skin-cancer.html"
                            target="_blank"
                            rel="noreferrer"
                            className="info-banner-link"
                        >
                            Read articles
                        </a>
                    </span>
                </div>
                <button
                    className={`reminder-btn ${reminderSet ? 'reminder-btn--set' : ''}`}
                    onClick={handleReminder}
                >
                    {reminderSet ? '✓ Reminder set' : 'Set Skin Check Reminder'}
                </button>
            </div>

            {/* Body silhouette */}
            <div className="body-viewer">
                <BodySilhouette side={side} />
            </div>

            {/* Front / Back toggle */}
            <div className="body-toggle">
                <button
                    className={`body-toggle-btn ${side === 'front' ? 'active' : ''}`}
                    onClick={() => setSide('front')}
                >
                    Front (0)
                </button>
                <button
                    className={`body-toggle-btn ${side === 'back' ? 'active' : ''}`}
                    onClick={() => setSide('back')}
                >
                    Back (0)
                </button>
            </div>

            {/* First-time onboarding overlay */}
            {showOnboarding && (
                <div className="onboarding-overlay" onClick={dismissOnboarding}>
                    <div className="onboarding-card" onClick={(e) => e.stopPropagation()}>
                        <p className="onboarding-title">
                            Start a skin spot assessment at anytime by tapping the camera icon.
                        </p>
                        <p className="onboarding-sub">
                            Would you like to assess a suspicious spot now?
                        </p>
                        <div className="onboarding-dots">
                            <span className="dot active"/>
                            <span className="dot"/>
                            <span className="dot"/>
                        </div>
                        <button className="onboarding-btn-primary" onClick={startScanFromOnboarding}>
                            Yes, start my scan
                        </button>
                        <button className="onboarding-btn-secondary" onClick={dismissOnboarding}>
                            Show me around first
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
