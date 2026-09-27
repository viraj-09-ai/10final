import React, { useEffect, useState } from 'react';
import api, { API_URL } from '../../api/axios';
import QrScanner from '../../components/QrScanner';

const emptyVisitor = { name: '', phone: '', email: '', company: '', purpose: '', validUntil: '' };

const defaultValidUntil = () => {
    const d = new Date();
    d.setHours(d.getHours() + 8);
    return d.toISOString().slice(0, 16);
};

const SecurityDashboard = () => {
    const [tab, setTab] = useState('issue');
    const [form, setForm] = useState({ ...emptyVisitor, validUntil: defaultValidUntil() });
    const [photo, setPhoto] = useState(null);
    const [issuedPass, setIssuedPass] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [passes, setPasses] = useState([]);

    const loadPasses = async () => {
        const { data } = await api.get('/passes');
        setPasses(data);
    };

    useEffect(() => { loadPasses(); }, []);

    const handleIssue = async (e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        setIssuedPass(null);
        try {
            // 1. Register the visitor profile (with optional photo)
            const visitorFormData = new FormData();
            ['name', 'phone', 'email', 'company'].forEach((k) => visitorFormData.append(k, form[k]));
            if (photo) visitorFormData.append('photo', photo);

            const { data: visitor } = await api.post('/visitors', visitorFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // 2. Issue the pass (generates QR + PDF badge)
            const { data: pass } = await api.post('/passes/issue', {
                visitorId: visitor._id,
                purpose: form.purpose,
                validUntil: form.validUntil
            });

            setIssuedPass(pass);
            setForm({ ...emptyVisitor, validUntil: defaultValidUntil() });
            setPhoto(null);
            loadPasses();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to issue pass');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Security / Frontdesk</h1>

            <div className="flex gap-2 mb-6 border-b">
                {['issue', 'scan', 'active'].map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 font-medium capitalize border-b-2 -mb-px ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
                        {t === 'issue' ? 'Issue Pass' : t === 'scan' ? 'Scan QR' : 'Active Visitors'}
                    </button>
                ))}
            </div>

            {tab === 'issue' && (
                <div className="grid md:grid-cols-2 gap-6">
                    <form onSubmit={handleIssue} className="bg-white border rounded-lg p-5 space-y-3">
                        <h2 className="font-bold text-lg mb-1">Walk-in Visitor Registration</h2>
                        <input required placeholder="Visitor name" className="w-full border rounded p-2"
                            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        <input required placeholder="Phone" className="w-full border rounded p-2"
                            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                        <input type="email" placeholder="Email (optional)" className="w-full border rounded p-2"
                            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        <input placeholder="Company" className="w-full border rounded p-2"
                            value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                        <input required placeholder="Purpose of visit" className="w-full border rounded p-2"
                            value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
                        <div>
                            <label className="block text-sm font-medium mb-1">Valid Until</label>
                            <input required type="datetime-local" className="w-full border rounded p-2"
                                value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Visitor Photo</label>
                            <input type="file" accept="image/*" className="w-full text-sm"
                                onChange={(e) => setPhoto(e.target.files[0])} />
                        </div>

                        {error && <p className="text-red-600 text-sm">{error}</p>}

                        <button disabled={busy} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white p-2 rounded font-medium">
                            {busy ? 'Issuing…' : 'Issue Pass'}
                        </button>
                    </form>

                    <div className="bg-white border rounded-lg p-5 flex flex-col items-center justify-center text-center">
                        {issuedPass ? (
                            <>
                                <h3 className="font-bold mb-2">Pass Issued ✅</h3>
                                {issuedPass.qrCodeUrl && <img src={issuedPass.qrCodeUrl} alt="QR" className="w-40 h-40 mb-3" />}
                                <p className="text-sm text-gray-500 mb-3">Purpose: {issuedPass.purpose}</p>
                                {issuedPass.badgeUrl && (
                                    <a href={`${API_URL}${issuedPass.badgeUrl}`} target="_blank" rel="noreferrer"
                                        className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-medium">
                                        Download PDF Badge
                                    </a>
                                )}
                            </>
                        ) : (
                            <p className="text-gray-400">The QR code and printable badge will appear here after you issue a pass.</p>
                        )}
                    </div>
                </div>
            )}

            {tab === 'scan' && (
                <div className="bg-white border rounded-lg p-6">
                    <p className="text-gray-500 text-sm text-center mb-4">
                        Scan a visitor's QR badge to record Check-In. Scan the same badge again to record Check-Out.
                    </p>
                    <QrScanner onLogged={loadPasses} />
                </div>
            )}

            {tab === 'active' && (
                <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b">
                                <th className="p-3">Visitor</th><th className="p-3">Purpose</th>
                                <th className="p-3">Status</th><th className="p-3">Valid Until</th>
                            </tr>
                        </thead>
                        <tbody>
                            {passes.map((p) => (
                                <tr key={p._id} className="border-b">
                                    <td className="p-3">{p.visitor?.name}</td>
                                    <td className="p-3">{p.purpose}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                            p.status === 'CheckedIn' ? 'bg-green-100 text-green-700' :
                                            p.status === 'CheckedOut' ? 'bg-gray-200 text-gray-600' :
                                            p.status === 'Expired' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="p-3">{new Date(p.validUntil).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SecurityDashboard;
