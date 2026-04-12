import React from 'react';

export default function ConfidenceGauge({ confidence, malignancyProbability, threshold }) {
    const confPct = (confidence * 100).toFixed(1);
    const malPct = (malignancyProbability * 100).toFixed(1);
    const threshPct = (threshold * 100).toFixed(1);

    // Determine colour based on how far above/below threshold
    const isAboveThreshold = malignancyProbability >= threshold;
    const gaugeColor = isAboveThreshold ? '#e74c3c' : '#2ecc71';

    return (
        <div className="gauge-container">
            {/* Malignancy Score */}
            <div className="gauge-section">
                <div className="gauge-label">Malignancy Probability</div>
                <div className="gauge-track">
                    <div
                        className="gauge-fill"
                        style={{ width: `${malPct}%`, background: gaugeColor }}
                    />
                    <div
                        className="gauge-threshold"
                        style={{ left: `${threshPct}%` }}
                        title={`Threshold: ${threshPct}%`}
                    >
                        <span className="gauge-threshold-label">τ = {threshPct}%</span>
                    </div>
                </div>
                <div className="gauge-value" style={{ color: gaugeColor }}>
                    {malPct}%
                </div>
            </div>

            {/* Model Confidence */}
            <div className="gauge-section">
                <div className="gauge-label">Model Confidence</div>
                <div className="gauge-track">
                    <div
                        className="gauge-fill gauge-fill--conf"
                        style={{ width: `${confPct}%` }}
                    />
                </div>
                <div className="gauge-value gauge-value--conf">{confPct}%</div>
            </div>
        </div>
    );
}
