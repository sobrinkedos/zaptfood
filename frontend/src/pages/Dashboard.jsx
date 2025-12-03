import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, Clock, DollarSign } from 'lucide-react';

const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const vendor = JSON.parse(localStorage.getItem('vendor'));
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/vendors/${vendor.id}/orders`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrders(response.data);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [vendor.id, token]);

    if (loading) return <div className="p-4 text-center">Carregando...</div>;

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Meus Pedidos</h2>

            {orders.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                    <Package size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhum pedido encontrado.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white p-4 rounded-lg shadow border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="font-bold text-lg">#{order.id.slice(0, 8)}</span>
                                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {order.status === 'pending' ? 'Pendente' : order.status === 'paid' ? 'Pago' : order.status}
                                </span>
                            </div>

                            <div className="flex items-center text-gray-700 mb-1">
                                <Package size={16} className="mr-2" />
                                <span>{order.qty}x {order.listings?.skus?.name || 'Item'}</span>
                            </div>

                            <div className="flex items-center text-gray-700 font-bold">
                                <DollarSign size={16} className="mr-2" />
                                <span>R$ {(order.total_cents / 100).toFixed(2)}</span>
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                                <p>Cliente: {order.customer_phone}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
