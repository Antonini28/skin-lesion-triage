import React from 'react';
import RiskBadge from './RiskBadge';

export default function ClassCard({ classProb, isTop }) {
    const pct = (classProb.probability * 100).toFixed(1);

    return (
        <div className={`class-card ${isTop ? 'class-card--top' : ''}`}>
            <div className="class-card-header">
                <span className="class-card-code">{classProb.class_code}</span>
                <RiskBadge risk={classProb.risk_category} />
            </div>
            <div className="class-card-name">{classProb.full_name}</div>
            <div className="class-card-bar-container">
                <div
                    className="class-card-bar"
                    style={{
                        width: `${pct}%`,
                        background: classProb.colour,
                    }}
                />
            </div>
            <div className="class-card-pct">{pct}%</div>
        </div>
    );
}
