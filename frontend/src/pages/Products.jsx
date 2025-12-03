import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Edit, Plus } from 'lucide-react';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
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
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [vendor.id, token]);

    if (loading) return <div className="p-4 text-center">Carregando...</div>;

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Meus Produtos</h2>
                <Link to="/register-product" className="bg-orange-600 text-white px-3 py-2 rounded flex items-center text-sm font-bold">
                    <Plus size={16} className="mr-1" /> Novo
                </Link>
            </div>

            {products.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                    <p>Nenhum produto cadastrado.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {products.map((product) => (
                        <div key={product.id} className="bg-white p-4 rounded-lg shadow border border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">{product.name}</h3>
                                <p className="text-sm text-gray-500">{product.categories?.name}</p>
                                <p className="font-bold text-orange-600 mt-1">R$ {(product.price / 100).toFixed(2)}</p>
                            </div>
                            <Link to={`/edit-product/${product.id}`} className="text-gray-500 hover:text-orange-600 p-2">
                                <Edit size={20} />
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Products;
