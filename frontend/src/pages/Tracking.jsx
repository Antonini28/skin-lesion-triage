import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScanHistory } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ClipboardList } from '../components/Icons';

function fmtDate(dateStr) {
    return new Date(dateStr + 'Z').toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

// Group scans by body_location (ignoring untagged), each sorted oldest → newest.
function groupByLocation(scans) {
    const groups = {};
    for (const s of scans) {
        const loc = s.body_location;
        if (!loc) continue;
        (groups[loc] ||= []).push(s);
    }
    for (const loc of Object.keys(groups)) {
        groups[loc].sort((a, b) => new Date(a.scanned_at) - new Date(b.scanned_at));
    }
    return groups;
}

function Trend({ scans }) {
    if (scans.length < 2) {
        return <span className="track-trend track-trend--base">Baseline recorded</span>;
    }
    const first = scans[0].malignancy_probability;
    const last  = scans[scans.length - 1].malignancy_probability;
    const delta = (last - first) * 100;               // percentage points
    const abs   = Math.abs(delta).toFixed(1);

    if (delta >= 10) {
        return <span className="track-trend track-trend--up">⚠ Risk up {abs} pts — consider a dermatologist</span>;
    }
    if (delta <= -10) {
        return <span className="track-trend track-trend--down">▼ Risk down {abs} pts</span>;
    }
    return <span className="track-trend track-trend--stable">● Stable</span>;
}

function LocationCard({ location, scans }) {
    return (
        <div className="track-card">
            <div className="track-card-head">
                <div className="track-card-title">
                    <span className="track-loc">📍 {location}</span>
                    <span className="track-count">{scans.length} scan{scans.length !== 1 ? 's' : ''}</span>
                </div>
                <Trend scans={scans} />
            </div>

            <div className="track-timeline">
                {scans.map((s, i) => {
                    const pct = (s.malignancy_probability * 100).toFixed(1);
                    const refer = s.triage_recommendation?.startsWith('REFER');
                    return (
                        <div key={s.id} className="track-point">
                            <div className="track-thumb-wrap">
                                {s.image_thumb
                                    ? <img className="track-thumb" src={s.image_thumb} alt={`${location} scan ${i + 1}`} />
                                    : <div className="track-thumb track-thumb--empty">No image</div>}
                                <span className={`track-pct ${refer ? 'track-pct--refer' : ''}`}>{pct}%</span>
                            </div>
                            <span className="track-date">{fmtDate(s.scanned_at)}</span>
                            <span className="track-class">{s.predicted_class_full}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function Tracking() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [scans, setScans]     = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        getScanHistory()
            .then(setScans)
            .catch(() => setError('Failed to load your tracked moles.'))
            .finally(() => setLoading(false));
    }, [user]);

    if (!authLoading && !user) {
        return (
            <div className="inbox-page">
                <div className="inbox-auth-prompt">
                    <div className="inbox-empty-icon"><ClipboardList size={30} /></div>
                    <h3>Track your moles over time</h3>
                    <p>Log in, tag a scan with a body location, and watch how each spot changes across visits.</p>
                    <button className="btn-primary" style={{ marginTop: '1.5rem', width: 220 }} onClick={() => navigate('/login')}>
                        Log In / Register
                    </button>
                </div>
            </div>
        );
    }

    const groups = groupByLocation(scans);
    const locations = Object.keys(groups).sort();

    return (
        <div className="inbox-page">
            <div className="track-header">
                <h1 className="track-title">Mole Tracking</h1>
                <p className="track-sub">Compare each tagged spot across scans to spot changes early.</p>
            </div>

            <div className="inbox-content">
                {loading && (
                    <div className="inbox-loading"><div className="spinner" /><p>Loading…</p></div>
                )}
                {error && <p className="auth-error">{error}</p>}

                {!loading && locations.length === 0 && (
                    <div className="inbox-empty">
                        <p>No tracked moles yet. When you <strong>Start Scan</strong>, tag the spot with a
                        body location and it'll appear here — scan the same spot again later to track changes.</p>
                    </div>
                )}

                {!loading && locations.map((loc) => (
                    <LocationCard key={loc} location={loc} scans={groups[loc]} />
                ))}
            </div>
        </div>
    );
}
