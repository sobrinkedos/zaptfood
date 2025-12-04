import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [form, setForm] = useState({ name: '', phone: '', cnh: '', pix_key: '', password: '' });
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3000/api/drivers/register', form);
            alert('Cadastro realizado! Faça login.');
            navigate('/login');
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao cadastrar');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
                <h1 className="text-2xl font-bold mb-4 text-center">Cadastro Entregador</h1>
                <form onSubmit={handleRegister} className="space-y-4">
                    <input name="name" placeholder="Nome" onChange={handleChange} className="w-full p-2 border rounded" required />
                    <input name="phone" placeholder="Telefone" onChange={handleChange} className="w-full p-2 border rounded" required />
                    <input name="cnh" placeholder="CNH" onChange={handleChange} className="w-full p-2 border rounded" required />
                    <input name="pix_key" placeholder="Chave Pix" onChange={handleChange} className="w-full p-2 border rounded" required />
                    <input name="password" type="password" placeholder="Senha" onChange={handleChange} className="w-full p-2 border rounded" required />
                    <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
                        Cadastrar
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <Link to="/login" className="text-blue-500">Já tenho conta</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
