import React, { useState, useEffect } from 'react';
import { Product } from '../../data/shop';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';

interface ShopFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Product, 'id'>, id?: string) => void;
    product: Product | null;
}

const ShopFormModal: React.FC<ShopFormModalProps> = ({ isOpen, onClose, onSave, product }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        imageUrl: '',
        category: 'Jersey' as Product['category'],
        purchaseUrl: ''
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                category: product.category,
                purchaseUrl: product.purchaseUrl || ''
            });
        } else {
            setFormData({
                name: '',
                price: 0,
                imageUrl: '',
                category: 'Jersey',
                purchaseUrl: ''
            });
        }
    }, [product, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, product?.id);
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-start justify-center p-4 pt-24 md:pt-32 overflow-y-auto animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-2xl mb-8 relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close form"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <h2 className="text-2xl font-bold font-display mb-6">{product ? 'Edit Product' : 'Create New Product'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputClass} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price (E)</label>
                                <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} required className={inputClass} step="0.01" min="0" />
                            </div>
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select id="category" name="category" value={formData.category} onChange={handleChange} required className={inputClass}>
                                    <option>Jersey</option>
                                    <option>Scarf</option>
                                    <option>Accessory</option>
                                    <option>Ticket</option>
                                    <option>Match Ticket</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="purchaseUrl" className="block text-sm font-medium text-gray-700 mb-1">Purchase Link (Optional)</label>
                            <input type="url" id="purchaseUrl" name="purchaseUrl" value={formData.purchaseUrl} onChange={handleChange} className={inputClass} placeholder="Link to external shop or payment page" />
                        </div>
                        <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">Image URL or Upload</label>
                            <div className="flex items-center gap-2">
                                <input type="text" id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} required className={inputClass} placeholder="Paste URL..."/>
                                <label htmlFor="imageUpload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                                    Upload
                                    <input type="file" id="imageUpload" name="imageUpload" onChange={handleFileChange} accept="image/*" className="sr-only" />
                                </label>
                            </div>
                            {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" className="mt-4 h-32 w-auto rounded-md object-contain border p-1 mx-auto bg-gray-50" />}
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" onClick={onClose} className="bg-gray-200 text-gray-800">Cancel</Button>
                            <Button type="submit" className="bg-primary text-white hover:bg-primary-dark">Save Product</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ShopFormModal;