import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const EditProduct = () => {
    const { id } = useParams();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const vendor = JSON.parse(localStorage.getItem('vendor'));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, prodRes] = await Promise.all([
                    axios.get('http://localhost:3000/api/categories'),
                    axios.get(`http://localhost:3000/api/vendors/${vendor.id}/products`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                setCategories(catRes.data);

                // Find the specific product from the list (since we don't have a single product GET endpoint yet, 
                // or we could add one. But filtering client side is fine for now)
                const product = prodRes.data.find(p => p.id === id);
                if (product) {
                    setName(product.name);
                    setDescription(product.description || '');
                    setPrice((product.price / 100).toFixed(2));
                    setCategoryId(product.category_id);
                } else {
                    alert('Produto não encontrado');
                    navigate('/products');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, vendor.id, token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.put(`http://localhost:3000/api/products/${id}`, {
                name,
                description,
                price: parseFloat(price),
                category_id: categoryId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Produto atualizado com sucesso!');
            navigate('/products');
        } catch (error) {
            console.error('Error updating product:', error);
            alert('Erro ao atualizar produto.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4 text-center">Carregando...</div>;

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-6">Editar Produto</h2>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Nome do Produto</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Descrição</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                        rows="3"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Preço Base (R$)</label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                        step="0.01"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Categoria</label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                    >
                        <option value="">Selecione uma categoria</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className={`w-full bg-orange-600 text-white font-bold py-3 px-4 rounded hover:bg-orange-700 transition duration-200 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </form>
        </div>
    );
};

export default EditProduct;
