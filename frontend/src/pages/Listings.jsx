import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, XCircle } from 'lucide-react';

const Listings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const vendor = JSON.parse(localStorage.getItem('vendor'));
    const token = localStorage.getItem('token');

    const fetchListings = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/api/vendors/${vendor.id}/listings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setListings(response.data);
        } catch (error) {
            console.error('Error fetching listings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, [vendor.id, token]);

    const handleCancel = async (id) => {
        if (!window.confirm('Tem certeza que deseja cancelar esta rodada?')) return;

        try {
            await axios.patch(`http://localhost:3000/api/listings/${id}/cancel`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchListings(); // Refresh list
        } catch (error) {
            console.error('Error cancelling listing:', error);
            alert('Erro ao cancelar rodada.');
        }
    };

    if (loading) return <div className="p-4 text-center">Carregando...</div>;

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-6">Minhas Rodadas</h2>

            {listings.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                    <p>Nenhuma rodada lançada.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {listings.map((listing) => {
                        const isActive = listing.qty > 0 && new Date(listing.ttl) > new Date();
                        return (
                            <div key={listing.id} className={`bg-white p-4 rounded-lg shadow border ${isActive ? 'border-green-200' : 'border-gray-200 opacity-75'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-lg">{listing.skus?.name}</h3>
                                        <p className="text-sm text-gray-500">{new Date(listing.created_at).toLocaleString()}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {isActive ? 'Ativa' : 'Encerrada'}
                                    </span>
                                </div>

                                <div className="flex items-center text-gray-700 mb-2">
                                    <span className="font-bold mr-4">Qtd: {listing.qty}</span>
                                    <div className="flex items-center text-sm">
                                        <Clock size={14} className="mr-1" />
                                        <span>Expira em: {new Date(listing.ttl).toLocaleTimeString()}</span>
                                    </div>
                                </div>

                                {isActive && (
                                    <button
                                        onClick={() => handleCancel(listing.id)}
                                        className="w-full mt-2 border border-red-500 text-red-500 py-1 rounded hover:bg-red-50 flex items-center justify-center text-sm"
                                    >
                                        <XCircle size={16} className="mr-1" /> Encerrar Rodada
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Listings;
