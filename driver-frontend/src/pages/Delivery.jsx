import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Package, Navigation, CheckCircle, ArrowLeft } from 'lucide-react';

const Delivery = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [delivery, setDelivery] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDeliveryDetails();
    }, [id]);

    const fetchDeliveryDetails = async () => {
        try {
            const token = localStorage.getItem('driver_token');
            const res = await axios.get('http://localhost:3000/api/deliveries/available', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Find the specific delivery (in a real app, you'd have a specific endpoint)
            const found = res.data.find(d => d.id === id);
            setDelivery(found);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching delivery:', err);
            setLoading(false);
        }
    };

    const updateStatus = async (status) => {
        try {
            const token = localStorage.getItem('driver_token');
            await axios.patch(
                `http://localhost:3000/api/deliveries/${id}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(`Status atualizado para: ${status === 'picked_up' ? 'Coletado' : 'Entregue'}`);
            if (status === 'delivered') {
                navigate('/');
            } else {
                fetchDeliveryDetails();
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao atualizar status');
        }
    };

    const openNavigation = (address) => {
        const encodedAddress = encodeURIComponent(address);
        // Try Google Maps app first, fallback to web
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando detalhes...</p>
                </div>
            </div>
        );
    }

    if (!delivery) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-600">Entrega não encontrada</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    const vendor = delivery.orders?.listings?.skus?.vendors;
    const product = delivery.orders?.listings?.skus;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <div className="bg-white shadow-md">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Detalhes da Entrega</h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
                {/* Product Info */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Package className="text-blue-600" size={24} />
                        <h2 className="text-xl font-semibold text-gray-800">{product?.name || 'Produto'}</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">Vendedor</p>
                            <p className="font-medium text-gray-800">{vendor?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Seu ganho</p>
                            <p className="font-bold text-green-600 text-lg">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(delivery.partner_fee / 100)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pickup Location */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <MapPin className="text-orange-500" size={24} />
                            <div>
                                <h3 className="font-semibold text-gray-800">Local de Coleta</h3>
                                <p className="text-sm text-gray-600 mt-1">{delivery.pickup_addr}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => openNavigation(delivery.pickup_addr)}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            <Navigation size={20} />
                            Navegar
                        </button>
                        {vendor?.phone && (
                            <a
                                href={`tel:${vendor.phone}`}
                                className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                            >
                                <Phone size={20} />
                                Ligar
                            </a>
                        )}
                    </div>
                    {delivery.status === 'accepted' && (
                        <button
                            onClick={() => updateStatus('picked_up')}
                            className="w-full mt-3 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                            <CheckCircle size={20} />
                            Confirmar Coleta
                        </button>
                    )}
                </div>

                {/* Delivery Location */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <MapPin className="text-green-500" size={24} />
                            <div>
                                <h3 className="font-semibold text-gray-800">Local de Entrega</h3>
                                <p className="text-sm text-gray-600 mt-1">{delivery.delivery_addr}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => openNavigation(delivery.delivery_addr)}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            <Navigation size={20} />
                            Navegar
                        </button>
                        {delivery.orders?.customer_phone && (
                            <a
                                href={`tel:${delivery.orders.customer_phone}`}
                                className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                            >
                                <Phone size={20} />
                                Ligar Cliente
                            </a>
                        )}
                    </div>
                    {delivery.status === 'picked_up' && (
                        <button
                            onClick={() => updateStatus('delivered')}
                            className="w-full mt-3 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                            <CheckCircle size={20} />
                            Confirmar Entrega
                        </button>
                    )}
                </div>

                {/* Pickup Code */}
                {delivery.pickup_code && (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-md p-6 text-white">
                        <p className="text-sm opacity-90 mb-2">Código de Coleta</p>
                        <p className="text-4xl font-bold tracking-wider text-center">{delivery.pickup_code}</p>
                        <p className="text-xs opacity-75 mt-2 text-center">Mostre este código ao vendedor</p>
                    </div>
                )}

                {/* Status Info */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Status Atual</p>
                            <p className="font-semibold text-gray-800 capitalize">
                                {delivery.status === 'accepted' && 'Aceita - Ir para coleta'}
                                {delivery.status === 'picked_up' && 'Coletada - Ir para entrega'}
                                {delivery.status === 'delivered' && 'Entregue'}
                            </p>
                        </div>
                        <div className={`px-4 py-2 rounded-full text-sm font-medium ${delivery.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                                delivery.status === 'picked_up' ? 'bg-orange-100 text-orange-800' :
                                    'bg-green-100 text-green-800'
                            }`}>
                            {delivery.status === 'accepted' && '📦 Aceita'}
                            {delivery.status === 'picked_up' && '🚚 Em rota'}
                            {delivery.status === 'delivered' && '✅ Concluída'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Delivery;
