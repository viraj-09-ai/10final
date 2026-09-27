import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleHome = {
    Admin: '/admin',
    Security: '/security',
    Employee: '/employee',
    Visitor: '/visitor'
};

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between shadow">
            <Link to={user ? roleHome[user.role] : '/'} className="font-bold text-lg tracking-tight">
                VisitorPass
            </Link>
            {user && (
                <div className="flex items-center gap-4 text-sm">
                    <span className="hidden sm:inline">
                        {user.name} <span className="opacity-75">({user.role})</span>
                    </span>
                    <button
                        onClick={handleLogout}
                        className="bg-blue-900 hover:bg-blue-950 px-3 py-1.5 rounded font-medium"
                    >
                        Logout
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
