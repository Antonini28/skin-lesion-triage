import React from 'react';

const CLASSES = [
    { code: 'akiec', full: 'Actinic Keratoses', risk: 'Pre-malignant', colour: '#f39c12' },
    { code: 'bcc', full: 'Basal Cell Carcinoma', risk: 'MALIGNANT', colour: '#e67e22' },
    { code: 'bkl', full: 'Benign Keratosis', risk: 'Benign', colour: '#3498db' },
    { code: 'df', full: 'Dermatofibroma', risk: 'Benign', colour: '#1abc9c' },
    { code: 'mel', full: 'Melanoma', risk: 'MALIGNANT', colour: '#e74c3c' },
    { code: 'nv', full: 'Melanocytic Nevi', risk: 'Benign', colour: '#2ecc71' },
    { code: 'vasc', full: 'Vascular Lesions', risk: 'Benign', colour: '#9b59b6' },
];

export default function About() {
    return (
        <main className="about-page">
            <h1 className="page-title">About SkinSense AI</h1>

            {/* Disclaimer */}
            <section className="about-section about-disclaimer">
                <h2>⚠️ Medical Disclaimer</h2>
                <p>
                    This application is for <strong>educational and research purposes only</strong>.
                    It is <strong>NOT</strong> a certified medical device and must <strong>NOT</strong>{' '}
                    be used for clinical diagnosis. Always consult a qualified dermatologist for
                    professional medical advice.
                </p>
            </section>

            {/* How it works */}
            <section className="about-section">
                <h2>How It Works</h2>
                <div className="pipeline-steps">
                    <div className="pipeline-step">
                        <div className="step-number">1</div>
                        <h3>Upload</h3>
                        <p>Upload a dermoscopic image of a skin lesion (JPEG or PNG, max 10 MB).</p>
                    </div>
                    <div className="pipeline-step">
                        <div className="step-number">2</div>
                        <h3>Classify</h3>
                        <p>
                            The image is preprocessed to 224×224 and passed through a quantised
                            EfficientNet-B0 model distilled from a Swin-T teacher.
                        </p>
                    </div>
                    <div className="pipeline-step">
                        <div className="step-number">3</div>
                        <h3>Calibrate</h3>
                        <p>
                            Logits are temperature-scaled (T≈1.10) for calibrated probability
                            estimates across all 7 lesion classes.
                        </p>
                    </div>
                    <div className="pipeline-step">
                        <div className="step-number">4</div>
                        <h3>Triage</h3>
                        <p>
                            An RL-trained policy network selects an adaptive malignancy threshold,
                            balancing sensitivity against specificity on a per-sample basis.
                        </p>
                    </div>
                </div>
            </section>

            {/* Supported Classes */}
            <section className="about-section">
                <h2>Supported Lesion Classes</h2>
                <div className="class-table-container">
                    <table className="class-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Full Name</th>
                                <th>Risk Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CLASSES.map((c) => (
                                <tr key={c.code}>
                                    <td><span className="class-dot" style={{ background: c.colour }} />{c.code}</td>
                                    <td>{c.full}</td>
                                    <td>
                                        <span className={`risk-tag risk-tag--${c.risk.toLowerCase().replace('-', '')}`}>
                                            {c.risk}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Model Details */}
            <section className="about-section">
                <h2>Model Details</h2>
                <ul className="model-details">
                    <li><strong>Student Model:</strong> EfficientNet-B0 (quantised INT8, ~16 MB)</li>
                    <li><strong>Teacher Model:</strong> Swin-Tiny (224×224, used only for training)</li>
                    <li><strong>Distillation:</strong> Hard + soft labels, T=4.0, α=0.7</li>
                    <li><strong>Datasets:</strong> HAM10000, ISIC 2019, PH2</li>
                    <li><strong>Threshold:</strong> RL-adaptive policy (state: [mal_prob, entropy, max_prob, margin])</li>
                    <li><strong>Fallback Threshold:</strong> Cost-sensitive τ=0.131</li>
                </ul>
            </section>

            {/* Tech Stack */}
            <section className="about-section">
                <h2>Technology Stack</h2>
                <div className="tech-grid">
                    <div className="tech-card">
                        <h3>Frontend</h3>
                        <p>React + Vite, deployed on Vercel (free tier)</p>
                    </div>
                    <div className="tech-card">
                        <h3>Backend</h3>
                        <p>FastAPI + Uvicorn, deployed on Render (free tier)</p>
                    </div>
                    <div className="tech-card">
                        <h3>ML Runtime</h3>
                        <p>PyTorch (CPU) + timm + Hugging Face Hub</p>
                    </div>
                </div>
            </section>
        </main>
    );
}
