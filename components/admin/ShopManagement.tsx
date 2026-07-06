
import React, { useState, useEffect } from 'react';
import { addProduct, deleteProduct, fetchProducts, updateProduct, fetchMatchTickets, addMatchTicket, deleteMatchTicket, MatchTicket, handleFirestoreError, OperationType } from '../../services/api';
import { Product } from '../../data/shop';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import TicketIcon from '../icons/TicketIcon';
import StoreIcon from '../icons/StoreIcon';
import ShopFormModal from './ShopFormModal';
import TicketFormModal from './TicketFormModal';
import ConfirmationModal from '../ui/ConfirmationModal';

const ShopManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'merch' | 'tickets'>('merch');
    
    // Products State
    const [products, setProducts] = useState<Product[]>([]);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Tickets State
    const [tickets, setTickets] = useState<MatchTicket[]>([]);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

    const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: 'merch' | 'ticket' } | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'merch') {
                const data = await fetchProducts();
                setProducts(data);
            } else {
                const data = await fetchMatchTickets();
                setTickets(data);
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.GET, activeTab === 'merch' ? 'products' : 'match_tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeTab]);

    // --- Product Handlers ---
    const handleAddProduct = () => {
        setEditingProduct(null);
        setIsProductModalOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setIsProductModalOpen(true);
    };

    const handleDeleteProduct = async (productId: string) => {
        setIsSubmitting(true);
        try {
            await deleteProduct(productId);
            setConfirmDelete(null);
            loadData();
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveProduct = async (data: Omit<Product, 'id'>, id?: string) => {
        setIsSubmitting(true);
        try {
            if (id) await updateProduct(id, data);
            else await addProduct(data);
            setIsProductModalOpen(false);
            loadData();
        } catch (error) {
            handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, id ? `products/${id}` : 'products');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Ticket Handlers ---
    const handleAddTicket = () => {
        setIsTicketModalOpen(true);
    };

    const handleDeleteTicket = async (ticketId: string) => {
        setIsSubmitting(true);
        try {
            await deleteMatchTicket(ticketId);
            setConfirmDelete(null);
            loadData();
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `match_tickets/${ticketId}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveTicket = async (data: Omit<MatchTicket, 'id'>) => {
        setIsSubmitting(true);
        try {
            await addMatchTicket(data);
            setIsTicketModalOpen(false);
            loadData();
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'match_tickets');
        } finally {
            setIsSubmitting(false);
        }
    };

    const TabButton: React.FC<{tabName: 'merch' | 'tickets'; label: string; Icon: any}> = ({ tabName, label, Icon }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors duration-300 ${
                activeTab === tabName 
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-800'
            }`}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
    );

    return (
        <>
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <h3 className="text-2xl font-bold font-display">Shop & Ticketing</h3>
                         <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button 
                                onClick={() => setActiveTab('merch')}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'merch' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Merchandise
                            </button>
                            <button 
                                onClick={() => setActiveTab('tickets')}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === 'tickets' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Match Tickets
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end mb-4">
                         <Button onClick={activeTab === 'merch' ? handleAddProduct : handleAddTicket} className="bg-primary text-white hover:bg-primary-dark inline-flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5" /> {activeTab === 'merch' ? 'Add Product' : 'Add Ticket'}
                        </Button>
                    </div>
                    
                    {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                        <div className="space-y-3">
                            {activeTab === 'merch' ? (
                                products.length > 0 ? products.map(product => (
                                    <div key={product.id} className="p-3 bg-white border rounded-lg flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-4">
                                            <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-contain rounded-md bg-gray-100" />
                                            <div>
                                                <p className="font-semibold">{product.name}</p>
                                                <p className="text-xs text-gray-500">{product.category} &bull; <span className="font-bold">E{product.price.toFixed(2)}</span></p>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 flex items-center gap-2">
                                            <Button onClick={() => handleEditProduct(product)} className="bg-blue-100 text-blue-700 h-8 w-8 p-0 flex items-center justify-center"><PencilIcon className="w-4 h-4" /></Button>
                                            <Button onClick={() => { setConfirmDelete({ id: product.id, type: 'merch' }); setShowConfirmModal(true); }} className="bg-red-100 text-red-700 h-8 w-8 p-0 flex items-center justify-center"><TrashIcon className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                )) : <p className="text-center text-gray-500 py-8">No merchandise found.</p>
                            ) : (
                                tickets.length > 0 ? tickets.map(ticket => (
                                    <div key={ticket.id} className="p-3 bg-white border rounded-lg flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                                <TicketIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{ticket.teamA} vs {ticket.teamB}</p>
                                                <p className="text-xs text-gray-500">{ticket.date} @ {ticket.time} &bull; {ticket.venue}</p>
                                                <p className="text-sm font-semibold text-green-600">E{ticket.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <Button onClick={() => { setConfirmDelete({ id: ticket.id, type: 'ticket' }); setShowConfirmModal(true); }} className="bg-red-100 text-red-700 h-8 w-8 p-0 flex items-center justify-center">
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )) : <p className="text-center text-gray-500 py-8">No tickets listed. Add one to start selling.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {showConfirmModal && confirmDelete && (
                <ConfirmationModal
                    isOpen={showConfirmModal}
                    onClose={() => { setShowConfirmModal(false); setConfirmDelete(null); }}
                    onConfirm={() => confirmDelete.type === 'merch' ? handleDeleteProduct(confirmDelete.id) : handleDeleteTicket(confirmDelete.id)}
                    title={`Delete ${confirmDelete.type === 'merch' ? 'Product' : 'Ticket'}`}
                    message={`Are you sure you want to delete this ${confirmDelete.type === 'merch' ? 'product' : 'ticket listing'}? This action cannot be undone.`}
                    confirmText={isSubmitting ? 'Deleting...' : 'Delete'}
                    variant="danger"
                />
            )}

            {isProductModalOpen && <ShopFormModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSave={handleSaveProduct} product={editingProduct} />}
            {isTicketModalOpen && <TicketFormModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} onSave={handleSaveTicket} />}
        </>
    );
};

export default ShopManagement;
