import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Assuming backend is on port 3000
            const response = await axios.post('http://localhost:3000/api/vendors/login', {
                phone,
                password
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('vendor', JSON.stringify(response.data.vendor));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao fazer login');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">ZaptFood Vendor</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Telefone</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="5511999999999"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="********"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-orange-600 text-white font-bold py-2 px-4 rounded hover:bg-orange-700 transition duration-200"
                    >
                        Entrar
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <Link to="/register" className="text-orange-600 hover:underline text-sm">
                        Não tem conta? Cadastre-se
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
