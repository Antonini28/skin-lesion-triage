import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScanHistory, toggleFollowup } from '../api/client';
import { useAuth } from '../context/useAuth';
import { ClipboardList } from '../components/Icons';

const RISK_META = {
    MALIGNANT:       { label: 'High Risk',     cls: 'risk-high',     color: '#e03e3e' },
    'Pre-malignant': { label: 'Moderate Risk', cls: 'risk-moderate', color: '#f0820f' },
    Benign:          { label: 'Low Risk',       cls: 'risk-low',      color: '#00a86b' },
};

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr + 'Z').getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return 'Just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days  < 7)  return `${days}d ago`;
    return new Date(dateStr + 'Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ScanCard({ scan }) {
    const meta    = RISK_META[scan.risk_level] || RISK_META.Benign;
    const isRefer = scan.triage_recommendation?.startsWith('REFER');
    const malPct  = (scan.malignancy_probability * 100).toFixed(1);

    return (
        <div className={`scan-card ${meta.cls}`}>
            <div className="scan-card-header">
                <div>
                    <span className="scan-card-class">{scan.predicted_class_full}</span>
                    <span className={`scan-card-risk-badge ${meta.cls}`}>{meta.label}</span>
                </div>
                <span className="scan-card-time">{timeAgo(scan.scanned_at)}</span>
            </div>
            <div className="scan-card-body">
                <div className="scan-card-row">
                    <span>Malignancy score</span>
                    <span style={{ color: meta.color, fontWeight: 700 }}>{malPct}%</span>
                </div>
                <div className="scan-card-row">
                    <span>Recommendation</span>
                    <span style={{ fontWeight: 600, color: isRefer ? '#e03e3e' : '#00a86b' }}>
                        {isRefer ? 'See a dermatologist' : 'Routine monitoring'}
                    </span>
                </div>
                <div className="scan-card-row">
                    <span>Confidence</span>
                    <span>{(scan.confidence * 100).toFixed(0)}%</span>
                </div>
            </div>
        </div>
    );
}

function FollowUpCard({ scan, onToggle }) {
    const meta   = RISK_META[scan.risk_level] || RISK_META.Benign;
    const [busy, setBusy] = useState(false);

    const handleToggle = async () => {
        setBusy(true);
        try { await onToggle(scan.id); }
        finally { setBusy(false); }
    };

    return (
        <div className={`scan-card followup-card ${scan.followed_up ? 'followed-up' : ''}`}>
            <div className="scan-card-header">
                <div>
                    <span className="scan-card-class">{scan.predicted_class_full}</span>
                    <span className={`scan-card-risk-badge ${meta.cls}`}>{meta.label}</span>
                </div>
                <span className="scan-card-time">{timeAgo(scan.scanned_at)}</span>
            </div>
            <label className={`followup-label ${busy ? 'followup-label--busy' : ''}`} onClick={!busy ? handleToggle : undefined}>
                <div className={`followup-check ${scan.followed_up ? 'checked' : ''}`}>
                    {scan.followed_up && '✓'}
                </div>
                <span>
                    {scan.followed_up
                        ? 'Marked as followed up with a dermatologist'
                        : 'Mark as followed up with a dermatologist'}
                </span>
            </label>
            {scan.followed_up && scan.followed_up_at && (
                <p className="followup-date">
                    Completed {timeAgo(scan.followed_up_at)}
                </p>
            )}
        </div>
    );
}

export default function Inbox() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [tab, setTab] = useState('messages');
    // fetchedScans === null means "not fetched yet", so loading is derived
    // instead of being set synchronously inside the effect.
    const [fetchedScans, setScans] = useState(null);
    const [error, setError]        = useState('');

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        getScanHistory()
            .then((data) => { if (!cancelled) setScans(data); })
            .catch(() => { if (!cancelled) setError('Failed to load scan history.'); });
        return () => { cancelled = true; };
    }, [user]);

    const loading = Boolean(user) && fetchedScans === null && !error;
    const scans   = fetchedScans ?? [];

    const handleToggle = async (scanId) => {
        const data = await toggleFollowup(scanId);
        setScans((prev) => (prev ?? []).map((s) => (s.id === scanId ? data : s)));
    };

    const referScans = scans.filter((s) => s.triage_recommendation?.startsWith('REFER'));

    /* ── Not logged in ── */
    if (!authLoading && !user) {
        return (
            <div className="inbox-page">
                <div className="inbox-auth-prompt">
                    <div className="inbox-empty-icon"><ClipboardList size={30} /></div>
                    <h3>Your scan history lives here</h3>
                    <p>Log in to see a record of all your past scans and follow-up actions.</p>
                    <button className="btn-primary" style={{ marginTop: '1.5rem', width: 220 }} onClick={() => navigate('/login')}>
                        Log In / Register
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="inbox-page">
            <div className="inbox-tabs">
                <button className={`inbox-tab ${tab === 'messages' ? 'active' : ''}`} onClick={() => setTab('messages')}>
                    Messages
                </button>
                <button className={`inbox-tab ${tab === 'followups' ? 'active' : ''}`} onClick={() => setTab('followups')}>
                    Follow-ups {referScans.length > 0 && <span className="inbox-badge">{referScans.filter(s => !s.followed_up).length || ''}</span>}
                </button>
            </div>

            <div className="inbox-content inbox-list">
                {loading && (
                    <div className="inbox-loading">
                        <div className="spinner" />
                        <p>Loading…</p>
                    </div>
                )}
                {error && <p className="auth-error">{error}</p>}

                {!loading && tab === 'messages' && (
                    scans.length === 0
                        ? <div className="inbox-empty"><p>No scans yet — use <strong>Start Scan</strong> to analyse your first lesion.</p></div>
                        : scans.map((s) => <ScanCard key={s.id} scan={s} />)
                )}

                {!loading && tab === 'followups' && (
                    referScans.length === 0
                        ? (
                            <div className="inbox-empty">
                                <p className="inbox-followup-hint">
                                    When there is a need to follow up you will find your recommendation here
                                </p>
                            </div>
                        )
                        : referScans.map((s) => <FollowUpCard key={s.id} scan={s} onToggle={handleToggle} />)
                )}
            </div>
        </div>
    );
}
