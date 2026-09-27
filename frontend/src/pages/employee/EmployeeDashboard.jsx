import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const emptyInvite = { name: '', phone: '', email: '', company: '', purpose: '', scheduledDate: '' };

const EmployeeDashboard = () => {
    const [tab, setTab] = useState('invite');
    const [form, setForm] = useState(emptyInvite);
    const [appointments, setAppointments] = useState([]);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const loadAppointments = async () => {
        const { data } = await api.get('/appointments');
        setAppointments(data);
    };

    useEffect(() => { loadAppointments(); }, []);

    const handleInvite = async (e) => {
        e.preventDefault();
        setStatus('');
        setError('');
        setBusy(true);
        try {
            await api.post('/appointments/invite', form);
            setStatus('Invitation sent! The visitor has been notified by email/SMS.');
            setForm(emptyInvite);
            loadAppointments();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send invitation');
        } finally {
            setBusy(false);
        }
    };

    const decide = async (id, decision) => {
        await api.patch(`/appointments/${id}/approve`, { decision });
        loadAppointments();
    };

    const pending = appointments.filter((a) => a.status === 'Pending');
    const rest = appointments.filter((a) => a.status !== 'Pending');

    const statusColor = {
        Pending: 'bg-yellow-100 text-yellow-700',
        Approved: 'bg-blue-100 text-blue-700',
        Rejected: 'bg-red-100 text-red-700',
        CheckedIn: 'bg-green-100 text-green-700',
        CheckedOut: 'bg-gray-200 text-gray-600',
        Cancelled: 'bg-gray-200 text-gray-500'
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Employee / Host Dashboard</h1>

            <div className="flex gap-2 mb-6 border-b">
                {['invite', 'approvals', 'all'].map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 font-medium capitalize border-b-2 -mb-px ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
                        {t === 'invite' ? 'Invite Visitor' : t === 'approvals' ? `Pending Approvals (${pending.length})` : 'All Appointments'}
                    </button>
                ))}
            </div>

            {tab === 'invite' && (
                <form onSubmit={handleInvite} className="bg-white border rounded-lg p-5 space-y-3 max-w-md">
                    <input required placeholder="Visitor name" className="w-full border rounded p-2"
                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <input required placeholder="Phone" className="w-full border rounded p-2"
                        value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    <input type="email" placeholder="Email" className="w-full border rounded p-2"
                        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    <input placeholder="Company" className="w-full border rounded p-2"
                        value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                    <input required placeholder="Purpose of visit" className="w-full border rounded p-2"
                        value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
                    <div>
                        <label className="block text-sm font-medium mb-1">Scheduled Date & Time</label>
                        <input required type="datetime-local" className="w-full border rounded p-2"
                            value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
                    </div>

                    {status && <p className="text-green-600 text-sm">{status}</p>}
                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <button disabled={busy} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white p-2 rounded font-medium">
                        {busy ? 'Sending…' : 'Send Invitation'}
                    </button>
                </form>
            )}

            {tab === 'approvals' && (
                <div className="space-y-3">
                    {pending.length === 0 && <p className="text-gray-400">No pending pre-registration requests.</p>}
                    {pending.map((a) => (
                        <div key={a._id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                            <div>
                                <p className="font-semibold">{a.visitor?.name}</p>
                                <p className="text-sm text-gray-500">{a.purpose} · {new Date(a.scheduledDate).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => decide(a._id, 'Approved')} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium">Approve</button>
                                <button onClick={() => decide(a._id, 'Rejected')} className="bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium">Reject</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'all' && (
                <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b">
                                <th className="p-3">Visitor</th><th className="p-3">Purpose</th>
                                <th className="p-3">Date</th><th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...pending, ...rest].map((a) => (
                                <tr key={a._id} className="border-b">
                                    <td className="p-3">{a.visitor?.name}</td>
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

export default EmployeeDashboard;
