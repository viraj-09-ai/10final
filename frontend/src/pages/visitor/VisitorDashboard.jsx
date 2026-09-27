import React, { useEffect, useState } from 'react';
import api, { API_URL } from '../../api/axios';

const VisitorDashboard = () => {
    const [tab, setTab] = useState('pass');
    const [passes, setPasses] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [form, setForm] = useState({ hostId: '', purpose: '', scheduledDate: '' });
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const load = async () => {
        const [p, a, e] = await Promise.all([
            api.get('/passes/mine'),
            api.get('/appointments'),
            api.get('/users/employees')
        ]);
        setPasses(p.data);
        setAppointments(a.data);
        setEmployees(e.data);
    };

    useEffect(() => { load(); }, []);

    const handlePreRegister = async (e) => {
        e.preventDefault();
        setStatus('');
        setError('');
        setBusy(true);
        try {
            await api.post('/appointments/pre-register', form);
            setStatus('Request submitted! Waiting for host approval.');
            setForm({ hostId: '', purpose: '', scheduledDate: '' });
            load();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit pre-registration');
        } finally {
            setBusy(false);
        }
    };

    const statusColor = {
        Pending: 'bg-yellow-100 text-yellow-700',
        Approved: 'bg-blue-100 text-blue-700',
        Rejected: 'bg-red-100 text-red-700',
        CheckedIn: 'bg-green-100 text-green-700',
        CheckedOut: 'bg-gray-200 text-gray-600',
        Cancelled: 'bg-gray-200 text-gray-500'
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">My Visitor Dashboard</h1>

            <div className="flex gap-2 mb-6 border-b">
                {['pass', 'pre-register', 'history'].map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 font-medium capitalize border-b-2 -mb-px ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
                        {t === 'pass' ? 'My Pass' : t === 'pre-register' ? 'Pre-Register' : 'History'}
                    </button>
                ))}
            </div>

            {tab === 'pass' && (
                <div>
                    {passes.length === 0 && (
                        <p className="text-gray-400">No pass issued yet. Once security issues your pass, it will appear here.</p>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4">
                        {passes.map((p) => (
                            <div key={p._id} className="bg-white border rounded-lg p-5 text-center">
                                {p.qrCodeUrl && <img src={p.qrCodeUrl} alt="QR" className="w-36 h-36 mx-auto mb-3" />}
                                <p className="font-semibold">{p.purpose}</p>
                                <p className="text-xs text-gray-500 mb-2">Valid until {new Date(p.validUntil).toLocaleString()}</p>
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mb-3 ${statusColor[p.status] || 'bg-gray-100'}`}>
                                    {p.status}
                                </span>
                                {p.badgeUrl && (
                                    <a href={`${API_URL}${p.badgeUrl}`} target="_blank" rel="noreferrer"
                                        className="block bg-gray-800 text-white px-4 py-2 rounded text-sm font-medium">
                                        Download PDF Badge
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'pre-register' && (
                <form onSubmit={handlePreRegister} className="bg-white border rounded-lg p-5 space-y-3 max-w-md">
                    <div>
                        <label className="block text-sm font-medium mb-1">Who are you visiting?</label>
                        <select required className="w-full border rounded p-2" value={form.hostId}
                            onChange={(e) => setForm({ ...form, hostId: e.target.value })}>
                            <option value="">Select a host</option>
                            {employees.map((emp) => (
                                <option key={emp._id} value={emp._id}>{emp.name} {emp.department ? `— ${emp.department}` : ''}</option>
                            ))}
                        </select>
                    </div>
                    <input required placeholder="Purpose of visit" className="w-full border rounded p-2"
                        value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
                    <div>
                        <label className="block text-sm font-medium mb-1">Preferred Date & Time</label>
                        <input required type="datetime-local" className="w-full border rounded p-2"
                            value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
                    </div>

                    {status && <p className="text-green-600 text-sm">{status}</p>}
                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <button disabled={busy} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white p-2 rounded font-medium">
                        {busy ? 'Submitting…' : 'Submit Request'}
                    </button>
                </form>
            )}

            {tab === 'history' && (
                <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b">
                                <th className="p-3">Host</th><th className="p-3">Purpose</th>
                                <th className="p-3">Date</th><th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map((a) => (
                                <tr key={a._id} className="border-b">
                                    <td className="p-3">{a.host?.name}</td>
                                    <td className="p-3">{a.purpose}</td>
                                    <td className="p-3">{new Date(a.scheduledDate).toLocaleString()}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColor[a.status] || ''}`}>{a.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default VisitorDashboard;
