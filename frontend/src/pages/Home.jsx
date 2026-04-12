import { useState, useEffect } from 'react';
import ImageUpload from '../components/ImageUpload';
import ResultsPanel from '../components/ResultsPanel';
import { predictImage, checkHealth } from '../api/client';

export default function Home() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [serverStatus, setServerStatus] = useState('checking');

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
                    ? 'Request timed out — the server may be waking up. Please try again.'
                    : 'Failed to analyse image. Please try again.');
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setError(null);
    };

    return (
        <main className="home">
            {!result ? (
                <>
                    {/* Hero */}
                    <section className="hero">
                        <div className="hero-icon">🔬</div>
                        <h1 className="hero-title">Skin Check Service</h1>
                        <p className="hero-sub">
                            Check a skin concern in seconds. Upload a dermoscopic photo
                            and get an instant risk assessment.
                        </p>

                        {serverStatus === 'offline' && (
                            <div className="wake-notice">
                                ⏳ Server is waking up — first scan may take ~60 seconds
                            </div>
                        )}
                    </section>

                    {/* Upload */}
                    <section className="upload-section">
                        <ImageUpload onUpload={handleUpload} loading={loading} />
                    </section>

                    {/* Steps */}
                    {!loading && (
                        <div className="steps">
                            <div className="step">
                                <div className="step-num">1</div>
                                <p>Upload a clear photo of the skin lesion</p>
                            </div>
                            <div className="step">
                                <div className="step-num">2</div>
                                <p>AI analyses shape, colour and texture</p>
                            </div>
                            <div className="step">
                                <div className="step-num">3</div>
                                <p>Receive an instant risk assessment</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="error-banner">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <p className="home-legal">
                        This tool does not provide a diagnosis. Consult a doctor for evaluation.
                    </p>
                </>
            ) : (
                <ResultsPanel result={result} onReset={handleReset} />
            )}
        </main>
    );
}
