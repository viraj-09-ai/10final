import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import api from '../api/axios';

// Reusable scanner: scans a QR code, POSTs the token to /passes/scan,
// and toggles Check-In / Check-Out automatically based on the pass's current state.
const QrScanner = ({ onLogged }) => {
    const [lastToken, setLastToken] = useState('');
    const [status, setStatus] = useState('');
    const [busy, setBusy] = useState(false);

    const handleScan = async (result) => {
        const text = result?.text;
        if (!text || text === lastToken && busy) return;

        setLastToken(text);
        setBusy(true);
        setStatus('Verifying…');

        try {
            const { data } = await api.post('/passes/scan', { qrToken: text });
            setStatus(`${data.action} recorded for ${data.visitor?.name || 'visitor'}`);
            onLogged?.(data);
        } catch (err) {
            setStatus(err.response?.data?.error || 'Invalid or expired pass');
        } finally {
            // brief cooldown so the same badge isn't scanned twice in a row
            setTimeout(() => setBusy(false), 2500);
        }
    };

    return (
        <div className="text-center">
            <div className="border-4 border-dashed border-gray-300 rounded-lg p-2 mb-4 max-w-sm mx-auto overflow-hidden">
                <QrReader
                    onResult={(result, error) => {
                        if (result) handleScan(result);
                    }}
                    constraints={{ facingMode: 'environment' }}
                    containerStyle={{ width: '100%' }}
                />
            </div>
            {status && (
                <p className={`font-semibold ${status.includes('recorded') ? 'text-green-600' : 'text-red-600'}`}>
                    {status}
                </p>
            )}
        </div>
    );
};

export default QrScanner;
