import React, { useState, useEffect } from 'react';
import { Product } from '../data/shop';
// FIX: Import 'fetchProducts' which is now correctly exported from the API service.
import { fetchProducts } from '../services/api';
import ProductCard from './ProductCard';
import Spinner from './ui/Spinner';

const Merchandise: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [addedProductId, setAddedProductId] = useState<string | null>(null);

    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            const data = await fetchProducts();
            setProducts(data);
            setLoading(false);
        };
        loadProducts();
    }, []);


    const handleAddToCart = (product: Product) => {
        setAddedProductId(product.id);
        setTimeout(() => {
            setAddedProductId(null);
        }, 1500);
    };

    if (loading) {
        return <div className="flex justify-center py-12"><Spinner /></div>;
    }

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {products.map(product => (
                    <ProductCard 
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        isAdded={addedProductId === product.id}
                    />
                ))}
            </div>
        </div>
    );
};

export default Merchandise;