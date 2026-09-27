import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Public self-registration. Always creates a Visitor account
// (staff accounts are created by an Admin from the Admin dashboard).
const Register = () => {
    const { register, loading, error } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(form);
            navigate('/visitor');
        } catch {
            // error surfaced via context
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-sm bg-white shadow rounded-lg p-8 border">
                <h1 className="text-2xl font-bold mb-1 text-center">Create a Visitor account</h1>
                <p className="text-gray-500 text-sm text-center mb-6">Pre-register and get a digital pass</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium">Full Name</label>
                        <input required className="w-full border rounded p-2"
                            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium">Email</label>
                        <input type="email" required className="w-full border rounded p-2"
                            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium">Phone</label>
                        <input required className="w-full border rounded p-2"
                            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium">Password</label>
                        <input type="password" required minLength={6} className="w-full border rounded p-2"
                            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    </div>

                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <button type="submit" disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white p-2 rounded font-medium">
                        {loading ? 'Creating account…' : 'Create Account'}
                    </button>
                </form>

                <p className="text-sm text-center mt-5 text-gray-600">
                    Already have an account? <Link to="/login" className="text-blue-600 font-medium">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
