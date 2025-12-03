import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, PlusCircle, LogOut, ShoppingBag } from 'lucide-react';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('vendor');
        navigate('/login');
    };

    if (!token) {
        return <Outlet />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-orange-600">ZaptFood Vendor</h1>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-500">
                    <LogOut size={24} />
                </button>
            </header>

            <main className="flex-1 p-4 pb-20 overflow-y-auto">
                <Outlet />
            </main>

            <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full flex justify-around p-3 pb-safe">
                <Link to="/dashboard" className={`flex flex-col items-center ${location.pathname === '/dashboard' ? 'text-orange-600' : 'text-gray-400'}`}>
                    <Home size={24} />
                    <span className="text-xs mt-1">Início</span>
                </Link>
                <Link to="/create-listing" className={`flex flex-col items-center ${location.pathname === '/create-listing' ? 'text-orange-600' : 'text-gray-400'}`}>
                    <PlusCircle size={24} />
                    <span className="text-xs mt-1">Nova Rodada</span>
                </Link>
                <Link to="/orders" className={`flex flex-col items-center ${location.pathname === '/orders' ? 'text-orange-600' : 'text-gray-400'}`}>
                    <ShoppingBag size={24} />
                    <span className="text-xs mt-1">Pedidos</span>
                </Link>
            </nav>
        </div>
    );
};

export default Layout;
