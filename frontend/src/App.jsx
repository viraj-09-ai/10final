import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import SecurityDashboard from './pages/security/SecurityDashboard';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import VisitorDashboard from './pages/visitor/VisitorDashboard';

const roleHome = {
    Admin: '/admin',
    Security: '/security',
    Employee: '/employee',
    Visitor: '/visitor'
};

const Home = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to={roleHome[user.role] || '/login'} replace />;
};

function AppRoutes() {
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/admin" element={
                    <ProtectedRoute roles={['Admin']}><AdminDashboard /></ProtectedRoute>
                } />
                <Route path="/security" element={
                    <ProtectedRoute roles={['Security', 'Admin']}><SecurityDashboard /></ProtectedRoute>
                } />
                <Route path="/employee" element={
                    <ProtectedRoute roles={['Employee', 'Admin']}><EmployeeDashboard /></ProtectedRoute>
                } />
                <Route path="/visitor" element={
                    <ProtectedRoute roles={['Visitor']}><VisitorDashboard /></ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;
