import { useEffect, useState } from 'react';
import { checkHealth, predictImage, saveScan } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ImageUpload from './ImageUpload';
import ResultsPanel from './ResultsPanel';

export default function ScanModal({ onClose, onScanSaved }) {
    const { user }                      = useAuth();
    const [result, setResult]           = useState(null);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState(null);
    const [serverStatus, setStatus]     = useState('checking');

    useEffect(() => {
        checkHealth()
            .then((d) => setStatus(d.model_loaded ? 'ready' : 'loading'))
            .catch(() => setStatus('offline'));
    }, []);

    const handleUpload = async (file) => {
        setLoading(true); setError(null); setResult(null);
        try {
            const data = await predictImage(file);
            setResult(data);

            // Save to history if logged in
            if (user) {
                try {
                    await saveScan({
                        predicted_class:        data.predicted_class,
                        predicted_class_full:   data.predicted_class_full_name,
                        risk_level:             data.risk_level,
                        malignancy_probability: data.malignancy_probability,
                        triage_recommendation:  data.triage_recommendation,
                        confidence:             data.confidence,
                    });
                    onScanSaved?.();
                } catch {
                    // non-fatal — scan still shows even if save fails
                }
            }
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

    return (
        <div className="scan-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
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
                                    <span>⚠️</span><span>{error}</span>
                                </div>
                            )}
                            {!loading && !user && (
                                <p className="scan-modal-legal">
                                    💡 <strong>Log in</strong> to save your scan results to your history.
                                </p>
                            )}
                            {!loading && user && (
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
