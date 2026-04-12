import React from 'react';

const RISK_STYLES = {
    MALIGNANT: { bg: '#fde8e8', color: '#c0392b', icon: '🔴', label: 'MALIGNANT' },
    'Pre-malignant': { bg: '#fef9e7', color: '#d68910', icon: '🟡', label: 'Pre-malignant' },
    Benign: { bg: '#eafaf1', color: '#1e8449', icon: '🟢', label: 'Benign' },
};

export default function RiskBadge({ risk }) {
    const style = RISK_STYLES[risk] || RISK_STYLES.Benign;

    return (
        <span
            className="risk-badge"
            style={{ background: style.bg, color: style.color }}
        >
            {style.icon} {style.label}
        </span>
    );
}
