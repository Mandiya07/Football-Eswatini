import React, { useState, useEffect } from 'react';
import { addProduct, deleteProduct, fetchProducts, updateProduct } from '../../services/api';
import { Product } from '../../data/shop';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import ShopFormModal from './ShopFormModal';

const ShopManagement: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const loadProducts = async () => {
        setLoading(true);
        const data = await fetchProducts();
        setProducts(data);
        setLoading(false);
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleAddNew = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (productId: string) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            await deleteProduct(productId);
            loadProducts();
        }
    };

    const handleSave = async (data: Omit<Product, 'id'>, id?: string) => {
        if (id) {
            await updateProduct(id, data);
        } else {
            await addProduct(data);
        }
        setIsModalOpen(false);
        loadProducts();
    };

    return (
        <>
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold font-display">Shop Management</h3>
                        <Button onClick={handleAddNew} className="bg-primary text-white hover:bg-primary-dark inline-flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5" /> Add Product
                        </Button>
                    </div>
                    
                    {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                        <div className="space-y-3">
                            {products.map(product => (
                                <div key={product.id} className="p-3 bg-white border rounded-lg flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-4">
                                        <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-contain rounded-md bg-gray-100" />
                                        <div>
                                            <p className="font-semibold">{product.name}</p>
                                            <p className="text-xs text-gray-500">{product.category} &bull; <span className="font-bold">E{product.price.toFixed(2)}</span></p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-2">
                                        <Button onClick={() => handleEdit(product)} className="bg-blue-100 text-blue-700 h-8 w-8 p-0 flex items-center justify-center" aria-label={`Edit ${product.name}`}><PencilIcon className="w-4 h-4" /></Button>
                                        <Button onClick={() => handleDelete(product.id)} className="bg-red-100 text-red-700 h-8 w-8 p-0 flex items-center justify-center" aria-label={`Delete ${product.name}`}><TrashIcon className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            {isModalOpen && <ShopFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} product={editingProduct} />}
        </>
    );
};

export default ShopManagement;
