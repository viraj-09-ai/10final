import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../../api/axios';

const emptyStaff = { name: '', email: '', password: '', role: 'Security', department: '', phone: '' };

const AdminDashboard = () => {
    const [tab, setTab] = useState('overview');
    const [visitors, setVisitors] = useState([]);
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [staffForm, setStaffForm] = useState(emptyStaff);
    const [staffError, setStaffError] = useState('');
    const [staffMsg, setStaffMsg] = useState('');

    const loadVisitors = async (q = '') => {
        const { data } = await api.get('/visitors', { params: q ? { search: q } : {} });
        setVisitors(data);
    };
    const loadLogs = async (q = '') => {
        const { data } = await api.get('/passes/logs', { params: q ? { search: q } : {} });
        setLogs(data);
    };
    const loadUsers = async () => {
        const { data } = await api.get('/users');
        setUsers(data);
    };

    useEffect(() => {
        loadVisitors();
        loadLogs();
        loadUsers();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        loadVisitors(search);
        loadLogs(search);
    };

    const exportVisitorsToExcel = () => {
        const rows = visitors.map((v) => ({
            Name: v.name, Email: v.email, Phone: v.phone, Company: v.company,
            RegisteredAt: new Date(v.createdAt).toLocaleString()
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Visitors');
        XLSX.writeFile(wb, 'Visitors.xlsx');
    };

    const exportLogsToExcel = () => {
        const rows = logs.map((l) => ({
            Visitor: l.visitor?.name, Action: l.action,
            Timestamp: new Date(l.timestamp).toLocaleString(),
            ScannedBy: l.scannedBy?.name || ''
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'CheckLogs');
        XLSX.writeFile(wb, 'CheckLogs.xlsx');
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setStaffError('');
        setStaffMsg('');
        try {
            await api.post('/users', staffForm);
            setStaffMsg(`${staffForm.role} account created for ${staffForm.name}`);
            setStaffForm(emptyStaff);
            loadUsers();
        } catch (err) {
            setStaffError(err.response?.data?.error || 'Failed to create account');
        }
    };

    const toggleActive = async (user) => {
        await api.patch(`/users/${user._id}`, { isActive: !user.isActive });
        loadUsers();
    };

    const stats = [
        { label: 'Total Visitors', value: visitors.length },
        { label: 'Currently Checked-In', value: logs.filter((l) => l.action === 'Check-In').length - logs.filter((l) => l.action === 'Check-Out').length },
        { label: 'Staff Accounts', value: users.filter((u) => u.role !== 'Visitor').length },
        { label: 'Total Scans Logged', value: logs.length }
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

            <div className="flex gap-2 mb-6 border-b">
                {['overview', 'visitors', 'logs', 'staff'].map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 font-medium capitalize border-b-2 -mb-px ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
                        {t}
                    </button>
                ))}
            </div>

            {tab === 'overview' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((s) => (
                        <div key={s.label} className="bg-white border rounded-lg p-4 shadow-sm">
                            <p className="text-sm text-gray-500">{s.label}</p>
                            <p className="text-2xl font-bold mt-1">{Math.max(s.value, 0)}</p>
                        </div>
                    ))}
                </div>
            )}

            {(tab === 'visitors' || tab === 'logs') && (
                <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                    <input
                        placeholder="Search by name, phone or email…"
                        className="border rounded p-2 flex-1"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="bg-gray-800 text-white px-4 py-2 rounded">Search</button>
                </form>
            )}

            {tab === 'visitors' && (
                <div>
                    <div className="flex justify-end mb-3">
                        <button onClick={exportVisitorsToExcel} className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700">
                            Export to Excel
                        </button>
                    </div>
                    <div className="border rounded-lg overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="p-3">Name</th><th className="p-3">Phone</th>
                                    <th className="p-3">Email</th><th className="p-3">Company</th><th className="p-3">Registered</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visitors.map((v) => (
                                    <tr key={v._id} className="border-b">
                                        <td className="p-3">{v.name}</td>
                                        <td className="p-3">{v.phone}</td>
                                        <td className="p-3">{v.email}</td>
                                        <td className="p-3">{v.company}</td>
                                        <td className="p-3">{new Date(v.createdAt).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'logs' && (
                <div>
                    <div className="flex justify-end mb-3">
                        <button onClick={exportLogsToExcel} className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700">
                            Export to Excel
                        </button>
                    </div>
                    <div className="border rounded-lg overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="p-3">Visitor</th><th className="p-3">Action</th>
                                    <th className="p-3">Timestamp</th><th className="p-3">Scanned By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log._id} className="border-b">
                                        <td className="p-3">{log.visitor?.name}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${log.action === 'Check-In' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-3">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="p-3">{log.scannedBy?.name || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'staff' && (
                <div className="grid md:grid-cols-2 gap-6">
                    <form onSubmit={handleCreateStaff} className="bg-white border rounded-lg p-5 space-y-3 h-fit">
                        <h2 className="font-bold text-lg mb-1">Create Staff Account</h2>
                        <input required placeholder="Full name" className="w-full border rounded p-2"
                            value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} />
                        <input required type="email" placeholder="Email" className="w-full border rounded p-2"
                            value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} />
                        <input required type="password" placeholder="Temporary password" className="w-full border rounded p-2"
                            value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} />
                        <select className="w-full border rounded p-2" value={staffForm.role}
                            onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}>
                            <option value="Security">Security</option>
                            <option value="Employee">Employee</option>
                            <option value="Admin">Admin</option>
                        </select>
                        {staffForm.role === 'Employee' && (
                            <input placeholder="Department" className="w-full border rounded p-2"
                                value={staffForm.department} onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })} />
                        )}
                        {staffError && <p className="text-red-600 text-sm">{staffError}</p>}
                        {staffMsg && <p className="text-green-600 text-sm">{staffMsg}</p>}
                        <button className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 w-full">
                            Create Account
                        </button>
                    </form>

                    <div className="border rounded-lg overflow-x-auto h-fit">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id} className="border-b">
                                        <td className="p-3">{u.name}<br /><span className="text-xs text-gray-400">{u.email}</span></td>
                                        <td className="p-3">{u.role}</td>
                                        <td className="p-3">{u.isActive ? 'Active' : 'Disabled'}</td>
                                        <td className="p-3">
                                            <button onClick={() => toggleActive(u)} className="text-xs text-blue-600 font-medium">
                                                {u.isActive ? 'Disable' : 'Enable'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
