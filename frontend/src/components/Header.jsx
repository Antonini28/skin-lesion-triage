import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
    { path: '/inbox',   label: 'Inbox'    },
    { path: '/uv',      label: 'UV Index' },
    { path: '/account', label: 'Account'  },
];

export default function Header({ onScan }) {
    const { pathname } = useLocation();
    const navigate     = useNavigate();
    const { user }     = useAuth();

    return (
        <header className="app-header">
            <div className="app-header-inner">
                <span className="logo" onClick={() => navigate('/inbox')} role="button" tabIndex={0}>
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

                <div className="header-right">
                    <button className="web-nav-scan" onClick={onScan}>
                        Start Scan
                    </button>

                    {user ? (
                        <button
                            className="header-avatar"
                            onClick={() => navigate('/account')}
                            title={user.name}
                        >
                            {user.profile_picture
                                ? <img src={user.profile_picture} alt={user.name} className="header-avatar-img" />
                                : <span className="header-avatar-initials">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                            }
                        </button>
                    ) : (
                        <button className="web-nav-login" onClick={() => navigate('/login')}>
                            Log In
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
