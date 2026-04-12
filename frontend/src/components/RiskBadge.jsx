const RISK_STYLES = {
    MALIGNANT:       { bg: '#fdeaea', color: '#e03e3e', label: 'Malignant' },
    'Pre-malignant': { bg: '#fef3e2', color: '#f0820f', label: 'Pre-malignant' },
    Benign:          { bg: '#e6f7f1', color: '#00a86b', label: 'Benign' },
};

export default function RiskBadge({ risk }) {
    const style = RISK_STYLES[risk] || RISK_STYLES.Benign;
    return (
        <span className="risk-badge" style={{ background: style.bg, color: style.color }}>
            {style.label}
        </span>
    );
}
