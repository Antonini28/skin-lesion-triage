import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import ScanModal from './components/ScanModal';
import BodyMap from './pages/BodyMap';
import Inbox from './pages/Inbox';
import UVIndex from './pages/UVIndex';
import Account from './pages/Account';

function AppInner() {
    const [scanOpen, setScanOpen] = useState(false);

    return (
        <div className="app">
            <Header />
            <main className="app-content">
                <Routes>
                    <Route path="/"        element={<BodyMap onScan={() => setScanOpen(true)} />} />
                    <Route path="/inbox"   element={<Inbox />} />
                    <Route path="/uv"      element={<UVIndex />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="*"        element={<BodyMap onScan={() => setScanOpen(true)} />} />
                </Routes>
            </main>
            <BottomNav onScan={() => setScanOpen(true)} />
            {scanOpen && <ScanModal onClose={() => setScanOpen(false)} />}
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppInner />
        </BrowserRouter>
    );
}
