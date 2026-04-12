import React from 'react';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <p className="footer-disclaimer">
                    ⚠️ This tool is for <strong>educational / research purposes only</strong>.
                    It is NOT a certified medical device and must NOT be used for clinical diagnosis.
                    Always consult a qualified dermatologist.
                </p>
                <p className="footer-copy">
                    &copy; {new Date().getFullYear()} SkinTriage AI &mdash; EfficientNet-B0 + RL Adaptive Thresholds
                </p>
            </div>
        </footer>
    );
}
