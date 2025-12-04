import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, DollarSign, Clock, LogOut } from 'lucide-react';

const Home = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDeliveries();
        const interval = setInterval(fetchDeliveries, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchDeliveries = async () => {
        try {
            const token = localStorage.getItem('driver_token');
            const res = await axios.get('http://localhost:3000/api/deliveries/available', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeliveries(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching deliveries:', err);
            setLoading(false);
        }
    };

    const handleAccept = async (deliveryId) => {
        try {
            const token = localStorage.getItem('driver_token');
            const res = await axios.post(
                `http://localhost:3000/api/deliveries/${deliveryId}/accept`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(res.data.message);
            navigate(`/delivery/${deliveryId}`);
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao aceitar entrega');
            fetchDeliveries(); // Refresh list
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('driver_token');
        localStorage.removeItem('driver_id');
        navigate('/login');
    };

    const formatCurrency = (cents) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando entregas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <div className="bg-white shadow-md">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">ZaptFood Entregador</h1>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        Sair
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Entregas Disponíveis</h2>
                    <p className="text-gray-600">
                        {deliveries.length === 0 ? 'Nenhuma entrega disponível no momento' : `${deliveries.length} entrega(s) aguardando`}
                    </p>
                </div>

                {/* Deliveries List */}
                <div className="space-y-4">
                    {deliveries.map((delivery) => (
                        <div
                            key={delivery.id}
                            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-5 border border-gray-100"
                        >
                            {/* Vendor Info */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package className="text-blue-600" size={20} />
                                        <h3 className="font-semibold text-lg text-gray-800">
                                            {delivery.orders?.listings?.skus?.name || 'Produto'}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Vendedor: {delivery.orders?.listings?.skus?.vendors?.name || 'N/A'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-green-600 font-bold text-lg">
                                        <DollarSign size={20} />
                                        {formatCurrency(delivery.partner_fee)}
                                    </div>
                                    <p className="text-xs text-gray-500">Seu ganho</p>
                                </div>
                            </div>

                            {/* Addresses */}
                            <div className="space-y-3 mb-4 bg-gray-50 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <MapPin className="text-orange-500 mt-1 flex-shrink-0" size={18} />
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 mb-1">COLETA</p>
                                        <p className="text-sm text-gray-800">{delivery.pickup_addr}</p>
                                    </div>
                                </div>
                                <div className="border-l-2 border-dashed border-gray-300 ml-2 h-4"></div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="text-green-500 mt-1 flex-shrink-0" size={18} />
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 mb-1">ENTREGA</p>
                                        <p className="text-sm text-gray-800">{delivery.delivery_addr}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Details */}
                            <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} />
                                    <span>Pedido: {formatCurrency(delivery.orders?.total_cents || 0)}</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {new Date(delivery.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Accept Button */}
                            <button
                                onClick={() => handleAccept(delivery.id)}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
                            >
                                Aceitar Entrega
                            </button>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {deliveries.length === 0 && (
                    <div className="text-center py-12">
                        <Package className="mx-auto text-gray-300 mb-4" size={64} />
                        <p className="text-gray-500 text-lg">Aguardando novas entregas...</p>
                        <p className="text-gray-400 text-sm mt-2">A lista será atualizada automaticamente</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
