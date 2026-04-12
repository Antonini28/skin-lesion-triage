import React from 'react';
import ClassCard from './ClassCard';
import ConfidenceGauge from './ConfidenceGauge';
import RiskBadge from './RiskBadge';

export default function ResultsPanel({ result }) {
    if (!result) return null;

    const isRefer = result.triage_recommendation.startsWith('REFER');

    // Sort class probabilities descending
    const sorted = [...result.class_probabilities].sort(
        (a, b) => b.probability - a.probability
    );

    return (
        <div className="results-panel" id="results-panel">
            {/* Triage Banner */}
            <div className={`triage-banner ${isRefer ? 'triage-banner--refer' : 'triage-banner--routine'}`}>
                <div className="triage-banner-icon">{isRefer ? '🚨' : '✅'}</div>
                <div className="triage-banner-content">
                    <h2 className="triage-banner-title">{result.triage_recommendation}</h2>
                    <p className="triage-banner-sub">
                        Threshold method: <strong>{result.threshold_method}</strong>
                    </p>
                </div>
            </div>

            {/* Top Prediction */}
            <div className="top-prediction">
                <h3 className="section-title">Top Prediction</h3>
                <div className="top-prediction-card">
                    <div className="top-prediction-class">{result.predicted_class_full_name}</div>
                    <div className="top-prediction-code">{result.predicted_class}</div>
                    <RiskBadge risk={result.risk_level} />
                </div>
            </div>

            {/* Gauges */}
            <div className="gauges-section">
                <h3 className="section-title">Malignancy Analysis</h3>
                <ConfidenceGauge
                    confidence={result.confidence}
                    malignancyProbability={result.malignancy_probability}
                    threshold={result.threshold_used}
                />
            </div>

            {/* All Class Probabilities */}
            <div className="classes-section">
                <h3 className="section-title">All Class Probabilities</h3>
                <div className="classes-grid">
                    {sorted.map((cp, i) => (
                        <ClassCard
                            key={cp.class_code}
                            classProb={cp}
                            isTop={i === 0}
                        />
                    ))}
                </div>
            </div>

            {/* Disclaimer */}
            <div className="result-disclaimer">
                <p>{result.disclaimer}</p>
            </div>
        </div>
    );
}
