import { useParams, Link } from 'react-router-dom';
import { products } from '@/app/data/products';
import { ShoppingCart, Heart, Share2, Check, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const product = products.find((p) => p.id === id);
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
          <Link to="/shop" className="text-amber-600 hover:text-amber-700">
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          to="/shop"
          className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden mb-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                  <img
                    src={product.image}
                    alt={`${product.name} view ${i}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-75"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{product.name}</h1>
            <p className="text-2xl font-semibold text-amber-600 mb-4">${product.price}</p>

            <div className="border-t border-b border-gray-200 py-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Frame Shape</p>
                  <p className="font-medium text-slate-900">{product.frameShape}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Material</p>
                  <p className="font-medium text-slate-900">{product.material}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Category</p>
                  <p className="font-medium text-slate-900 capitalize">{product.category}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Lens Size</p>
                  <p className="font-medium text-slate-900">52-18-140</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-3">Description</h3>
              <p className="text-slate-600">{product.description}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-3">Features</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  -
                </button>
                <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-4 mb-6">
              <button className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-md flex items-center justify-center transition-colors">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </button>
              <button className="px-6 py-3 border border-gray-300 hover:border-slate-400 rounded-md transition-colors">
                <Heart className="h-5 w-5 text-slate-600" />
              </button>
              <button className="px-6 py-3 border border-gray-300 hover:border-slate-400 rounded-md transition-colors">
                <Share2 className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Care & Warranty</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• 2-year comprehensive warranty included</li>
                <li>• Free lifetime adjustments and cleaning</li>
                <li>• 30-day return policy for unworn frames</li>
                <li>• Comes with premium case and cleaning cloth</li>
              </ul>
            </div>
          </div>
        </div>

        {/* You May Also Like */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.slice(0, 3).map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                to={`/product/${relatedProduct.id}`}
                className="group"
              >
                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden mb-4">
                  <img
                    src={relatedProduct.image}
                    alt={relatedProduct.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-amber-600">
                  {relatedProduct.name}
                </h3>
                <p className="text-slate-600">${relatedProduct.price}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
