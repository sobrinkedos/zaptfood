import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

const CreateListing = () => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [qty, setQty] = useState('');
    const [ttl, setTtl] = useState('30');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const vendor = JSON.parse(localStorage.getItem('vendor'));
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/vendors/${vendor.id}/products`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProducts(response.data);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };
        fetchProducts();
    }, [vendor.id, token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('http://localhost:3000/api/listings', {
                sku_id: selectedProduct,
                qty: parseInt(qty),
                ttl_minutes: parseInt(ttl)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Rodada lançada com sucesso!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Error creating listing:', error);
            alert('Erro ao lançar rodada.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Nova Rodada</h2>
                <Link to="/register-product" className="text-orange-600 flex items-center text-sm font-bold">
                    <Plus size={16} className="mr-1" /> Novo Produto
                </Link>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-10 bg-white rounded shadow-sm">
                    <p className="text-gray-500 mb-4">Você ainda não tem produtos cadastrados.</p>
                    <Link to="/register-product" className="bg-orange-600 text-white px-4 py-2 rounded font-bold">
                        Cadastrar Primeiro Produto
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Produto</label>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                        >
                            <option value="">Selecione um produto</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} - R$ {(p.price / 100).toFixed(2)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Quantidade (Unidades)</label>
                        <input
                            type="number"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                            min="1"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Tempo Limite (Minutos)</label>
                        <select
                            value={ttl}
                            onChange={(e) => setTtl(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="15">15 min</option>
                            <option value="30">30 min</option>
                            <option value="45">45 min</option>
                            <option value="60">1 hora</option>
                            <option value="120">2 horas</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-orange-600 text-white font-bold py-3 px-4 rounded hover:bg-orange-700 transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Lançando...' : 'Lançar Rodada'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default CreateListing;
