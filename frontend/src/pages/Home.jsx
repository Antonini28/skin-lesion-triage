import React, { useState, useEffect } from 'react';
import ImageUpload from '../components/ImageUpload';
import ResultsPanel from '../components/ResultsPanel';
import { predictImage, checkHealth } from '../api/client';

export default function Home() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [serverStatus, setServerStatus] = useState('checking');

    // Ping the backend on mount to wake it up
    useEffect(() => {
        checkHealth()
            .then((data) => setServerStatus(data.model_loaded ? 'ready' : 'loading'))
            .catch(() => setServerStatus('offline'));
    }, []);

    const handleUpload = async (file) => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await predictImage(file);
            setResult(data);
            setServerStatus('ready');
        } catch (err) {
            const msg =
                err.response?.data?.detail ||
                (err.code === 'ECONNABORTED'
                    ? 'Request timed out. The server may be waking up — please try again.'
                    : 'Failed to analyse image. Please try again.');
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="home">
            {/* Hero */}
            <section className="hero">
                <h1 className="hero-title">
                    AI-Powered Skin Lesion <span className="gradient-text">Triage</span>
                </h1>
                <p className="hero-sub">
                    Upload a dermoscopic image to receive an instant malignancy risk
                    assessment powered by an EfficientNet-B0 model with RL-adaptive
                    thresholds.
                </p>

                {/* Server status badge */}
                <div className={`server-badge server-badge--${serverStatus}`}>
                    <span className="server-dot" />
                    {serverStatus === 'ready' && 'Server ready'}
                    {serverStatus === 'loading' && 'Server loading model…'}
                    {serverStatus === 'checking' && 'Connecting to server…'}
                    {serverStatus === 'offline' && 'Server offline — first request will wake it'}
                </div>
            </section>

            {/* Upload */}
            <section className="upload-section">
                <ImageUpload onUpload={handleUpload} loading={loading} />
            </section>

            {/* Error */}
            {error && (
                <div className="error-banner" id="error-banner">
                    <span className="error-icon">⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {/* Results */}
            {result && (
                <section className="results-section">
                    <ResultsPanel result={result} />
                </section>
            )}
        </main>
    );
}
