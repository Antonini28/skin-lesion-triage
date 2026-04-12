import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Home' },
        { path: '/about', label: 'About' },
    ];

    return (
        <header className="header">
            <div className="header-inner">
                <Link to="/" className="logo">
                    <span className="logo-icon">🔬</span>
                    <span className="logo-text">
                        Skin<span className="logo-accent">Triage</span>
                        <span className="logo-ai">AI</span>
                    </span>
                </Link>

                <nav className="nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    );
}
