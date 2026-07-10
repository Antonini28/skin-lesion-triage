import { useState, useRef, useEffect } from 'react';
import { askDermBot, askDermBotImage } from '../api/client';

const QUICK_QUESTIONS = [
    'What does this result mean?',
    'Should I be worried?',
    'What should I do next?',
    'How accurate is this scan?',
];

const GENERAL_QUESTIONS = [
    'What is the ABCDE rule for moles?',
    'What are the warning signs of skin cancer?',
    'How often should I check my skin?',
    'How do I lower my skin cancer risk?',
];

function BotAvatar() {
    return (
        <div className="dbc-avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <line x1="12" y1="8" x2="12" y2="13" />
                <line x1="9.5" y1="10.5" x2="14.5" y2="10.5" />
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

function riskClass(risk) {
    if (risk === 'MALIGNANT') return 'malignant';
    if (risk === 'Pre-malignant') return 'premalignant';
    return 'benign';
}

export default function DermBotChat({ result = null, floating = false }) {
    const [open, setOpen]         = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput]       = useState('');
    const [loading, setLoading]   = useState(false);
    const bottomRef = useRef(null);
    const fileRef   = useRef(null);

    const quickQuestions = result ? QUICK_QUESTIONS : GENERAL_QUESTIONS;

    // Greet when panel first opens
    useEffect(() => {
        if (open && messages.length === 0) {
            const greeting = result
                ? `Hi, I'm DermBot. I can explain your **${result.predicted_class_full_name}** result and answer your questions, grounded in clinical dermatology literature — ask me anything.`
                : `Hi, I'm DermBot - how can I assist you?`;
            setMessages([{ role: 'bot', text: greeting, sources: 0, escalated: false }]);
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

    const sendImage = async (file) => {
        if (!file || loading) return;
        if (!/^image\/(jpe?g|png)$/.test(file.type)) {
            setMessages(prev => [...prev, {
                role: 'bot', text: 'Please upload a JPG or PNG image.', sources: 0, escalated: false,
            }]);
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setMessages(prev => [...prev, { role: 'user', text: input.trim(), image: previewUrl }]);
        const q = input.trim();
        setInput('');
        setLoading(true);

        try {
            const data = await askDermBotImage(file, q);
            setMessages(prev => [...prev, {
                role:      'bot',
                text:      data.answer,
                sources:   data.sources_used,
                escalated: data.escalated,
                result:    data.not_detected ? null : {
                    full:  data.predicted_class_full_name,
                    risk:  data.risk_level,
                    triage: data.triage_recommendation,
                },
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'bot',
                text: 'Sorry, I could not analyse that image right now. Please try again in a moment.',
                sources: 0, escalated: false,
            }]);
        } finally {
            setLoading(false);
        }
    };

    const onPickFile = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';          // allow re-selecting the same file
        if (file) sendImage(file);
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
    };

    // Render bold **text** inline
    const renderText = (text) =>
        text.split('**').map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        );

    const BotGlyph = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="12" y1="8" x2="12" y2="13" />
            <line x1="9.5" y1="10.5" x2="14.5" y2="10.5" />
        </svg>
    );

    if (!open) {
        if (floating) {
            return (
                <button className="dbc-fab" onClick={() => setOpen(true)} aria-label="Ask DermBot">
                    <BotGlyph />
                    <span className="dbc-fab-label">Ask DermBot</span>
                </button>
            );
        }
        return (
            <button className="dbc-toggle" onClick={() => setOpen(true)}>
                <BotGlyph />
                <span>Ask DermBot</span>
                <span className="dbc-toggle-badge">RAG · AI</span>
            </button>
        );
    }

    return (
        <div className={`dbc-panel ${floating ? 'dbc-panel--floating' : ''}`}>

            {/* Header */}
            <div className="dbc-header">
                <div className="dbc-header-left">
                    <BotAvatar />
                    <div>
                        <span className="dbc-header-name">DermBot</span>
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
                                {msg.image && (
                                    <img className="dbc-msg-img" src={msg.image} alt="uploaded lesion" />
                                )}
                                {msg.text && <div className="dbc-msg-text">{renderText(msg.text)}</div>}
                            </div>
                            {msg.result && (
                                <div className={`dbc-result-chip dbc-result-chip--${riskClass(msg.result.risk)}`}>
                                    <span className="dbc-result-name">{msg.result.full}</span>
                                    <span className="dbc-result-risk">{msg.result.risk}</span>
                                </div>
                            )}
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
                    {quickQuestions.map(q => (
                        <button key={q} className="dbc-pill" onClick={() => send(q)}>
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Input row */}
            <div className="dbc-input-row">
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    style={{ display: 'none' }}
                    onChange={onPickFile}
                />
                <button
                    className="dbc-attach"
                    onClick={() => fileRef.current?.click()}
                    disabled={loading}
                    aria-label="Upload a skin photo"
                    title="Upload a skin photo"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                </button>
                <input
                    className="dbc-input"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder={result ? 'Ask about your result…' : 'Ask, or upload a photo…'}
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
