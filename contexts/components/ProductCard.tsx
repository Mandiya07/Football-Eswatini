import React from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import { Product } from '../data/shop';
import { useCart } from '../contexts/CartContext';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isAdded: boolean;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onAddToCart, isAdded }) => {
  const { addToCart } = useCart();

  const handleAction = () => {
    if (product.purchaseUrl) {
        window.open(product.purchaseUrl, '_blank');
    } else {
        addToCart(product);
        onAddToCart(product);
    }
  };

  const isOnSale = product.salePrice && product.salePrice < product.price;

  return (
    <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full text-center relative overflow-hidden">
      {isOnSale && (
          <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10 shadow-sm">
              SALE
          </div>
      )}
      <div className="relative bg-gray-100 overflow-hidden p-4">
        <img src={product.imageUrl} alt={product.name} loading="lazy" className="w-full h-48 object-contain group-hover:scale-105 transition-transform duration-300" />
      </div>
      <CardContent className="flex flex-col flex-grow p-4">
        <div className="flex-grow">
            <p className="text-xs text-gray-500">{product.category}</p>
            <h3 className="text-md font-bold font-display mb-1">{product.name}</h3>
            {isOnSale ? (
                 <div className="flex items-center justify-center gap-2">
                    <span className="text-gray-400 line-through text-sm">E{product.price.toFixed(2)}</span>
                    <span className="text-lg font-bold text-red-600">E{product.salePrice!.toFixed(2)}</span>
                 </div>
            ) : (
                <p className="text-lg font-semibold text-blue-600">E{product.price.toFixed(2)}</p>
            )}
        </div>
        <div className="mt-4">
            <Button
                onClick={handleAction}
                className={`w-full font-bold transition-all duration-300 ${
                    isAdded
                     ? 'bg-green-600 text-white focus:ring-green-500'
                     : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                }`}
            >
                {product.purchaseUrl ? (
                    <span className="flex items-center justify-center gap-2">
                        Buy Now <ArrowRightIcon className="w-4 h-4" />
                    </span>
                ) : isAdded ? (
                    <span className="flex items-center justify-center gap-2">
                        <CheckCircleIcon className="w-5 h-5" /> Added!
                    </span>
                ) : (
                    'Add to Cart'
                )}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
});

export default ProductCard;