import RiskBadge from './RiskBadge';

const REFER_TIPS = [
    'Schedule an appointment with a dermatologist as soon as possible.',
    'Monitor the lesion for any changes in size, shape, or colour.',
    'Avoid prolonged sun exposure to the affected area.',
];

const ROUTINE_TIPS = [
    'Continue regular skin self-examinations each month.',
    'Monitor the lesion for any changes over time.',
    'Mention it at your next routine check-up with your doctor.',
];

const RISK_META = {
    MALIGNANT:      { label: 'High Risk',    icon: '⚠️', cls: 'risk-high' },
    'Pre-malignant':{ label: 'Moderate Risk', icon: '⚠️', cls: 'risk-moderate' },
    Benign:         { label: 'Low Risk',      icon: '✅', cls: 'risk-low' },
};

export default function ResultsPanel({ result, onReset }) {
    if (!result) return null;

    const isRefer  = result.triage_recommendation.startsWith('REFER');
    const tips     = isRefer ? REFER_TIPS : ROUTINE_TIPS;
    const meta     = RISK_META[result.risk_level] || RISK_META.Benign;
    const malPct   = (result.malignancy_probability * 100).toFixed(1);

    // Top 3 class probabilities sorted descending
    const top3 = [...result.class_probabilities]
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 3);

    return (
        <div className="result-card">

            {/* ── Risk Banner ── */}
            <div className={`risk-banner ${meta.cls}`}>
                <span className="risk-banner-icon">{meta.icon}</span>
                <div>
                    <div className="risk-banner-label">{meta.label}</div>
                    <div className="risk-banner-sub">
                        {isRefer
                            ? 'Potentially concerning skin lesion detected'
                            : 'No immediate concern detected'}
                    </div>
                </div>
            </div>

            {/* ── Recommendation ── */}
            <div className="result-section">
                <h3 className="result-section-title">Recommendation</h3>
                <ul className="tip-list">
                    {tips.map((t, i) => (
                        <li key={i} className="tip-item">
                            <span className="tip-dot" />
                            {t}
                        </li>
                    ))}
                </ul>
            </div>

            {/* ── Lesion Analysis ── */}
            <div className="result-section">
                <h3 className="result-section-title">Lesion Analysis</h3>

                <div className="analysis-top">
                    <div className="analysis-class">
                        <span className="analysis-class-name">{result.predicted_class_full_name}</span>
                        <RiskBadge risk={result.risk_level} />
                    </div>
                    <div className="analysis-mal">
                        <span className="analysis-mal-label">Malignancy score</span>
                        <div className="analysis-bar-track">
                            <div
                                className="analysis-bar-fill"
                                style={{
                                    width: `${malPct}%`,
                                    background: isRefer ? '#e74c3c' : '#2ecc71',
                                }}
                            />
                            <div
                                className="analysis-threshold-line"
                                style={{ left: `${(result.threshold_used * 100).toFixed(1)}%` }}
                            />
                        </div>
                        <span
                            className="analysis-mal-pct"
                            style={{ color: isRefer ? '#e74c3c' : '#2ecc71' }}
                        >
                            {malPct}%
                        </span>
                    </div>
                </div>

                {/* Top 3 probabilities */}
                <div className="prob-list">
                    {top3.map((cp) => (
                        <div key={cp.class_code} className="prob-row">
                            <span className="prob-dot" style={{ background: cp.colour }} />
                            <span className="prob-name">{cp.full_name}</span>
                            <div className="prob-bar-track">
                                <div
                                    className="prob-bar-fill"
                                    style={{
                                        width: `${(cp.probability * 100).toFixed(1)}%`,
                                        background: cp.colour,
                                    }}
                                />
                            </div>
                            <span className="prob-pct">{(cp.probability * 100).toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Actions ── */}
            <button className="btn-scan-again" onClick={onReset}>
                Scan Another Image
            </button>

            {/* ── Disclaimer ── */}
            <p className="result-legal">
                This is not a diagnosis. Consult a qualified dermatologist for evaluation.
            </p>
        </div>
    );
}
