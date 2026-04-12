import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Header from './components/Header';
import ScanModal from './components/ScanModal';
import { AuthProvider } from './context/AuthContext';
import Account from './pages/Account';
import Inbox from './pages/Inbox';
import Login from './pages/Login';
import UVIndex from './pages/UVIndex';

function AppInner() {
    const [scanOpen,  setScanOpen]  = useState(false);
    const [scanKey,   setScanKey]   = useState(0);   // incremented after save → Inbox re-fetches

    const handleScanSaved = () => setScanKey((k) => k + 1);

    return (
        <div className="app">
            <Header onScan={() => setScanOpen(true)} />
            <main className="app-content">
                <Routes>
                    <Route path="/"        element={<Navigate to="/inbox" replace />} />
                    <Route path="/inbox"   element={<Inbox key={scanKey} />} />
                    <Route path="/uv"      element={<UVIndex />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/login"   element={<Login />} />
                    <Route path="*"        element={<Navigate to="/inbox" replace />} />
                </Routes>
            </main>
            <Footer />
            {scanOpen && (
                <ScanModal
                    onClose={() => setScanOpen(false)}
                    onScanSaved={handleScanSaved}
                />
            )}
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppInner />
            </AuthProvider>
        </BrowserRouter>
    );
}
