import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleHome = {
    Admin: '/admin',
    Security: '/security',
    Employee: '/employee',
    Visitor: '/visitor'
};

const Login = () => {
    const { login, loading, error } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await login(form.email, form.password);
            navigate(roleHome[user.role] || '/');
        } catch {
            // error is already surfaced via context
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-sm bg-white shadow rounded-lg p-8 border">
                <h1 className="text-2xl font-bold mb-1 text-center">Welcome back</h1>
                <p className="text-gray-500 text-sm text-center mb-6">Sign in to the Visitor Pass System</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full border rounded p-2"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full border rounded p-2"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </div>

                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white p-2 rounded font-medium"
                    >
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <p className="text-sm text-center mt-5 text-gray-600">
                    New visitor? <Link to="/register" className="text-blue-600 font-medium">Create an account</Link>
                </p>

                <div className="mt-6 border-t pt-4 text-xs text-gray-400">
                    <p className="font-semibold mb-1">Demo accounts (password: password123)</p>
                    <p>admin@demo.com · security@demo.com · employee@demo.com · visitor@demo.com</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
