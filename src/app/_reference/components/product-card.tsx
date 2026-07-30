import { Link } from 'react-router-dom';
import { Product } from '@/app/data/products';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
        <div className="aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">
                {product.name}
              </h3>
              <p className="text-sm text-slate-500">{product.frameShape} • {product.material}</p>
            </div>
            <span className="text-lg font-semibold text-slate-900">${product.price}</span>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate-500 uppercase tracking-wide">
              {product.category}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                // Add to cart logic
              }}
              className="p-2 rounded-full bg-slate-100 hover:bg-amber-500 hover:text-white transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
