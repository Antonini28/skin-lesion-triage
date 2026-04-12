import { useLocation, useNavigate } from 'react-router-dom';

function BodyIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="3" ry="3.5"/>
            <path d="M8.5 9.5 Q6 11 6 14 L6 18"/>
            <path d="M15.5 9.5 Q18 11 18 14 L18 18"/>
            <path d="M8 9.5 L16 9.5"/>
            <path d="M7 18 L7 22 M17 18 L17 22"/>
        </svg>
    );
}

function InboxIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
        </svg>
    );
}

function CameraIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
        </svg>
    );
}

function UVIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
    );
}

function AccountIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
        </svg>
    );
}

const TABS = [
    { path: '/',        label: 'My body',  Icon: BodyIcon    },
    { path: '/inbox',   label: 'Inbox',    Icon: InboxIcon   },
    { path: null,       label: '',         Icon: CameraIcon,  isScan: true },
    { path: '/uv',      label: 'UV Index', Icon: UVIcon      },
    { path: '/account', label: 'Account',  Icon: AccountIcon },
];

export default function BottomNav({ onScan }) {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <nav className="bottom-nav">
            {TABS.map((tab) => {
                if (tab.isScan) {
                    return (
                        <button key="scan" className="bottom-nav-scan" onClick={onScan} aria-label="Start scan">
                            <CameraIcon />
                        </button>
                    );
                }
                const isActive = location.pathname === tab.path;
                return (
                    <button
                        key={tab.path}
                        className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => navigate(tab.path)}
                        aria-label={tab.label}
                    >
                        <span className="bottom-nav-icon"><tab.Icon /></span>
                        <span className="bottom-nav-label">{tab.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
