import { useState } from 'react';

const UV_LEVELS = [
    { max: 2,        label: 'Low',       color: '#22c55e', desc: 'No protection needed. You can safely enjoy being outside.' },
    { max: 5,        label: 'Moderate',  color: '#eab308', desc: 'Seek shade during midday hours. Wear sun-protective clothing and apply SPF 30+ sunscreen.' },
    { max: 7,        label: 'High',      color: '#f97316', desc: 'Protection against sun damage is needed. Use SPF 30+ sunscreen. Wear a hat and sunglasses.' },
    { max: 10,       label: 'Very High', color: '#ef4444', desc: 'Extra protection needed. Avoid being outside during midday hours. Unprotected skin can burn quickly.' },
    { max: Infinity, label: 'Extreme',   color: '#a855f7', desc: 'Take all precautions. Avoid sun exposure between 10am–4pm. Seek shade and cover up.' },
];

function getUVLevel(index) {
    return UV_LEVELS.find((l) => index <= l.max) || UV_LEVELS[UV_LEVELS.length - 1];
}

export default function UVIndex() {
    const [step, setStep]             = useState('intro');
    const [uvData, setUvData]         = useState(null);
    const [locationName, setLocation] = useState(null);

    const fetchUV = () => {
        setStep('loading');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const res = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=uv_index_max&timezone=auto&forecast_days=1`
                    );
                    const data = await res.json();
                    const uvMax = data.daily?.uv_index_max?.[0] ?? 0;
                    setUvData(uvMax);

                    try {
                        const geo = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                        );
                        const geoData = await geo.json();
                        setLocation(
                            geoData.address?.city ||
                            geoData.address?.town ||
                            geoData.address?.village ||
                            'Your location'
                        );
                    } catch {
                        setLocation('Your location');
                    }

                    setStep('data');
                } catch {
                    setStep('error');
                }
            },
            () => setStep('denied')
        );
    };

    const level = uvData !== null ? getUVLevel(uvData) : null;

    if (step === 'intro') {
        return (
            <div className="uv-page uv-intro">
                <div className="uv-intro-art">☂️</div>
                <h2 className="uv-intro-title">UV Protection</h2>
                <p className="uv-intro-text">
                    By knowing your location we can tell you your daily local UV index so you
                    can protect your skin.
                </p>
                <button className="btn-primary uv-continue-btn" onClick={fetchUV}>
                    Continue
                </button>
            </div>
        );
    }

    if (step === 'loading') {
        return (
            <div className="uv-page">
                <div className="spinner" style={{ width: 40, height: 40, marginBottom: '1rem' }}/>
                <p style={{ color: 'var(--text-muted)' }}>Getting your location…</p>
            </div>
        );
    }

    if (step === 'denied') {
        return (
            <div className="uv-page uv-error">
                <div className="uv-error-icon">📍</div>
                <h3>Location access denied</h3>
                <p>Please allow location access in your browser settings to see your local UV index.</p>
                <button className="btn-primary" style={{ marginTop: '1.5rem', width: '100%', maxWidth: 280 }} onClick={() => setStep('intro')}>
                    Try again
                </button>
            </div>
        );
    }

    if (step === 'error') {
        return (
            <div className="uv-page uv-error">
                <div className="uv-error-icon">⚠️</div>
                <h3>Could not fetch UV data</h3>
                <p>Please check your internet connection and try again.</p>
                <button className="btn-primary" style={{ marginTop: '1.5rem', width: '100%', maxWidth: 280 }} onClick={fetchUV}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="uv-page uv-data">
            {locationName && <p className="uv-location">📍 {locationName}</p>}

            <div className="uv-gauge-container">
                <div className="uv-value" style={{ color: level.color }}>{uvData.toFixed(1)}</div>
                <div className="uv-level-badge" style={{ background: level.color }}>
                    {level.label}
                </div>
            </div>

            <p className="uv-desc">{level.desc}</p>

            <div className="uv-scale">
                {UV_LEVELS.map((l, i) => (
                    <div key={i} className="uv-scale-item">
                        <div className="uv-scale-color" style={{ background: l.color }}/>
                        <span>{l.label}</span>
                    </div>
                ))}
            </div>

            <div className="uv-tips">
                <h4>Sun Protection Tips</h4>
                <ul>
                    <li>🧴 Apply SPF 30+ sunscreen 15 minutes before going outside</li>
                    <li>👒 Wear a wide-brimmed hat and UV-blocking sunglasses</li>
                    <li>🕶️ Seek shade between 10am and 4pm</li>
                    <li>👚 Cover up with long sleeves when UV is High or above</li>
                </ul>
            </div>

            <button className="btn-outline" style={{ marginTop: '1.2rem', width: '100%', maxWidth: 280 }} onClick={() => setStep('intro')}>
                Refresh
            </button>
        </div>
    );
}
