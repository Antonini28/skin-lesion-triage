import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
    '/inbox':   'Inbox',
    '/uv':      'UV Index',
    '/account': 'Account',
};

export default function Header() {
    const { pathname } = useLocation();
    const title = PAGE_TITLES[pathname];

    return (
        <header className="app-header">
            <div className="app-header-inner">
                <span className="logo">
                    <span className="logo-icon">🔬</span>
                    <span className="logo-text">
                        Skin<span className="logo-accent">Triage</span>
                        <span className="logo-ai">AI</span>
                    </span>
                </span>
                {title && <h2 className="app-header-title">{title}</h2>}
            </div>
        </header>
    );
}
