import { useState } from 'react';

export default function Inbox() {
    const [tab, setTab] = useState('messages');

    return (
        <div className="inbox-page">
            <div className="inbox-tabs">
                <button
                    className={`inbox-tab ${tab === 'messages' ? 'active' : ''}`}
                    onClick={() => setTab('messages')}
                >
                    Messages
                </button>
                <button
                    className={`inbox-tab ${tab === 'followups' ? 'active' : ''}`}
                    onClick={() => setTab('followups')}
                >
                    Follow-ups
                </button>
            </div>

            <div className="inbox-content">
                {tab === 'messages' ? (
                    <div className="inbox-empty">
                        <p>No messages yet</p>
                    </div>
                ) : (
                    <div className="inbox-empty">
                        <p className="inbox-followup-hint">
                            When there is a need to follow up you will find your recommendation here
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
