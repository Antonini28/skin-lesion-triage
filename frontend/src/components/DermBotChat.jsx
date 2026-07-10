import { useState, useRef, useEffect } from 'react';
import { askDermBot } from '../api/client';

const QUICK_QUESTIONS = [
    'What does this result mean?',
    'Should I be worried?',
    'What should I do next?',
    'How accurate is this scan?',
];

function BotAvatar() {
    return (
        <div className="dbc-avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <line x1="12" y1="7" x2="12" y2="11" />
                <circle cx="8" cy="16" r="1" fill="currentColor" stroke="none" />
                <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
                <circle cx="16" cy="16" r="1" fill="currentColor" stroke="none" />
            </svg>
        </div>
    );
}

function SourceBadge({ count }) {
    if (!count) return null;
    return (
        <span className="dbc-sources">
            {count} clinical source{count !== 1 ? 's' : ''}
        </span>
    );
}

function EscalationBadge() {
    return <span className="dbc-escalation-badge">Urgent</span>;
}

export default function DermBotChat({ result }) {
    const [open, setOpen]         = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput]       = useState('');
    const [loading, setLoading]   = useState(false);
    const bottomRef = useRef(null);

    // Greet when panel first opens
    useEffect(() => {
        if (open && messages.length === 0) {
            setMessages([{
                role:       'bot',
                text:       `Hi, I'm DermBot. I can explain your **${result.predicted_class_full_name}** result and answer your questions. I'm backed by 8,719 clinical documents — ask me anything.`,
                sources:    0,
                escalated:  false,
            }]);
        }
    }, [open]);

    // Scroll to bottom on new message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const send = async (text) => {
        const q = text.trim();
        if (!q || loading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: q }]);
        setLoading(true);

        try {
            const data = await askDermBot(q, result);
            setMessages(prev => [...prev, {
                role:      'bot',
                text:      data.answer,
                sources:   data.sources_used,
                escalated: data.escalated,
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role:     'bot',
                text:     'Sorry, I could not reach the server right now. Please try again in a moment.',
                sources:  0,
                escalated: false,
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
    };

    // Render bold **text** inline
    const renderText = (text) =>
        text.split('**').map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        );

    if (!open) {
        return (
            <button className="dbc-toggle" onClick={() => setOpen(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <line x1="12" y1="7" x2="12" y2="11" />
                    <circle cx="8" cy="16" r="1" fill="currentColor" stroke="none" />
                    <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
                    <circle cx="16" cy="16" r="1" fill="currentColor" stroke="none" />
                </svg>
                <span>Ask DermBot</span>
                <span className="dbc-toggle-badge">RAG · AI</span>
            </button>
        );
    }

    return (
        <div className="dbc-panel">

            {/* Header */}
            <div className="dbc-header">
                <div className="dbc-header-left">
                    <BotAvatar />
                    <div>
                        <span className="dbc-header-name">DermBot</span>
                        <span className="dbc-header-sub">RAG-grounded · Gemini 2.0</span>
                    </div>
                </div>
                <button className="dbc-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>

            {/* Messages */}
            <div className="dbc-messages">
                {messages.map((msg, i) => (
                    <div key={i} className={`dbc-row dbc-row--${msg.role}`}>
                        {msg.role === 'bot' && <BotAvatar />}
                        <div className="dbc-bubble-wrap">
                            <div className={`dbc-bubble dbc-bubble--${msg.role} ${msg.escalated ? 'dbc-bubble--escalated' : ''}`}>
                                {renderText(msg.text)}
                            </div>
                            {msg.role === 'bot' && (
                                <div className="dbc-meta">
                                    {msg.escalated && <EscalationBadge />}
                                    <SourceBadge count={msg.sources} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                    <div className="dbc-row dbc-row--bot">
                        <BotAvatar />
                        <div className="dbc-bubble dbc-bubble--bot dbc-bubble--typing">
                            <span /><span /><span />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Quick question pills — show only on first message */}
            {messages.length <= 1 && !loading && (
                <div className="dbc-quick">
                    {QUICK_QUESTIONS.map(q => (
                        <button key={q} className="dbc-pill" onClick={() => send(q)}>
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Input row */}
            <div className="dbc-input-row">
                <input
                    className="dbc-input"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Ask about your result…"
                    maxLength={500}
                    disabled={loading}
                />
                <button
                    className="dbc-send"
                    onClick={() => send(input)}
                    disabled={!input.trim() || loading}
                    aria-label="Send"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
