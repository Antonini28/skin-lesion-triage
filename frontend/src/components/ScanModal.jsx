import { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import ResultsPanel from './ResultsPanel';
import { predictImage, checkHealth } from '../api/client';

export default function ScanModal({ onClose }) {
    const [result, setResult]         = useState(null);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState(null);
    const [serverStatus, setStatus]   = useState('checking');

    useEffect(() => {
        checkHealth()
            .then((d) => setStatus(d.model_loaded ? 'ready' : 'loading'))
            .catch(() => setStatus('offline'));
    }, []);

    const handleUpload = async (file) => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await predictImage(file);
            setResult(data);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                (err.code === 'ECONNABORTED'
                    ? 'Request timed out — the server may be waking up. Please try again.'
                    : 'Failed to analyse image. Please try again.')
            );
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => { setResult(null); setError(null); };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="scan-modal-overlay" onClick={handleOverlayClick}>
            <div className="scan-modal">
                <div className="scan-modal-header">
                    <h2 className="scan-modal-title">Skin Spot Scan</h2>
                    <button className="scan-modal-close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <div className="scan-modal-body">
                    {!result ? (
                        <>
                            {serverStatus === 'offline' && (
                                <div className="wake-notice" style={{ marginBottom: '1rem' }}>
                                    ⏳ Server is waking up — first scan may take ~60 seconds
                                </div>
                            )}
                            <ImageUpload onUpload={handleUpload} loading={loading} />
                            {error && (
                                <div className="error-banner" style={{ marginTop: '1rem' }}>
                                    <span>⚠️</span>
                                    <span>{error}</span>
                                </div>
                            )}
                            {!loading && (
                                <p className="scan-modal-legal">
                                    This tool does not provide a diagnosis. Consult a doctor for evaluation.
                                </p>
                            )}
                        </>
                    ) : (
                        <ResultsPanel result={result} onReset={handleReset} />
                    )}
                </div>
            </div>
        </div>
    );
}
