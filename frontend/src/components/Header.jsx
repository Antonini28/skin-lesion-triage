import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
    { path: '/',        label: 'My Body'  },
    { path: '/inbox',   label: 'Inbox'    },
    { path: '/uv',      label: 'UV Index' },
    { path: '/account', label: 'Account'  },
];

export default function Header({ onScan }) {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    return (
        <header className="app-header">
            <div className="app-header-inner">
                <span className="logo" onClick={() => navigate('/')} role="button" tabIndex={0}>
                    <span className="logo-icon">🔬</span>
                    <span className="logo-text">
                        Skin<span className="logo-accent">Triage</span>
                        <span className="logo-ai">AI</span>
                    </span>
                </span>

                <nav className="web-nav">
                    {NAV_ITEMS.map(({ path, label }) => (
                        <button
                            key={path}
                            className={`web-nav-link ${pathname === path ? 'active' : ''}`}
                            onClick={() => navigate(path)}
                        >
                            {label}
                        </button>
                    ))}
                </nav>

                <button className="web-nav-scan" onClick={onScan}>
                    Start Scan
                </button>
            </div>
        </header>
    );
}
