import { useEffect, useState } from 'react';
import { checkHealth, predictImage, saveScan } from '../api/client';
import { useAuth } from '../context/useAuth';
import ImageUpload from './ImageUpload';
import ResultsPanel from './ResultsPanel';
import { AlertTriangle, Lightbulb } from './Icons';
import { BODY_LOCATIONS } from '../constants/bodyLocations';

// Downscale an uploaded image to a small JPEG data-URL for mole-tracking thumbnails.
function makeThumb(file) {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const max = 220;
            const scale = Math.min(max / img.width, max / img.height, 1);
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(url);
            try { resolve(canvas.toDataURL('image/jpeg', 0.7)); }
            catch { resolve(null); }
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
        img.src = url;
    });
}

export default function ScanModal({ onClose, onScanSaved }) {
    const { user }                      = useAuth();
    const [result, setResult]           = useState(null);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState(null);
    const [serverStatus, setStatus]     = useState('checking');
    const [location, setLocation]       = useState('');

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

            // Save to history if logged in — but never save a "no lesion detected"
            // result, so the history can't contradict what the user was shown.
            if (user && !data.not_detected) {
                try {
                    const thumb = await makeThumb(file);
                    await saveScan({
                        predicted_class:        data.predicted_class,
                        predicted_class_full:   data.predicted_class_full_name,
                        risk_level:             data.risk_level,
                        malignancy_probability: data.malignancy_probability,
                        triage_recommendation:  data.triage_recommendation,
                        confidence:             data.confidence,
                        body_location:          location || null,
                        image_thumb:            thumb,
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
                            {user && !loading && (
                                <div className="scan-location-field">
                                    <label htmlFor="body-location">📍 Where on your body is this spot?</label>
                                    <select
                                        id="body-location"
                                        className="scan-location-select"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    >
                                        <option value="">Not specified</option>
                                        {BODY_LOCATIONS.map((loc) => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                    <span className="scan-location-hint">
                                        Tag a location to track this mole over time.
                                    </span>
                                </div>
                            )}
                            <ImageUpload onUpload={handleUpload} loading={loading} />
                            {error && (
                                <div className="error-banner" style={{ marginTop: '1rem' }}>
                                    <AlertTriangle size={18} /><span>{error}</span>
                                </div>
                            )}
                            {!loading && !user && (
                                <p className="scan-modal-legal">
                                    <Lightbulb size={15} /> <strong>Log in</strong> to save your scan results to your history.
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
