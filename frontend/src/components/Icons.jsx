/* Shared clinical line-icon set (inherits currentColor + size via props). */

const base = (size) => ({
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
});

export function ShieldCheck({ size = 24 }) {
    return (
        <svg {...base(size)}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}

export function ShieldAlert({ size = 24 }) {
    return (
        <svg {...base(size)}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="13" />
            <line x1="12" y1="16" x2="12" y2="16" />
        </svg>
    );
}

export function ScanFrame({ size = 24 }) {
    return (
        <svg {...base(size)}>
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <circle cx="12" cy="12" r="3.2" />
        </svg>
    );
}

export function Camera({ size = 24 }) {
    return (
        <svg {...base(size)}>
            <path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4l-1.5-2z" />
            <circle cx="12" cy="13" r="3.5" />
        </svg>
    );
}

export function ClipboardList({ size = 24 }) {
    return (
        <svg {...base(size)}>
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="M9 12h6M9 16h6M9 8h.01" />
        </svg>
    );
}

export function AlertTriangle({ size = 24 }) {
    return (
        <svg {...base(size)}>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12" y2="17" />
        </svg>
    );
}

export function Lightbulb({ size = 24 }) {
    return (
        <svg {...base(size)}>
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
        </svg>
    );
}

export function HealthMark({ size = 24 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-7-4.35-7-10a7 7 0 0 1 14 0c0 5.65-7 10-7 10z" />
            <path d="M8.5 11.5h2l1-2 1.6 3.4 1-1.4h1.4" />
        </svg>
    );
}
