import { useState } from 'react';
import { products, Product } from '@/app/data/products';
import { ProductCard } from '@/app/_reference/components/product-card';
import { Filter } from 'lucide-react';

export function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedShape, setSelectedShape] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');

  const filteredProducts = products.filter((product) => {
    if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
    if (selectedShape !== 'all' && product.frameShape !== selectedShape) return false;
    if (selectedMaterial !== 'all' && product.material !== selectedMaterial) return false;
    if (priceRange !== 'all') {
      const price = product.price;
      if (priceRange === 'under-250' && price >= 250) return false;
      if (priceRange === '250-300' && (price < 250 || price > 300)) return false;
      if (priceRange === 'over-300' && price <= 300) return false;
    }
    return true;
  });

  const categories = ['all', 'men', 'women', 'sunglasses'];
  const shapes = ['all', ...Array.from(new Set(products.map((p) => p.frameShape)))];
  const materials = ['all', ...Array.from(new Set(products.map((p) => p.material)))];

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Shop All Eyewear</h1>
          <p className="text-slate-600">
            Discover our complete collection of premium eyeglasses and sunglasses
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-slate-50 rounded-lg p-6 sticky top-20">
              <div className="flex items-center mb-6">
                <Filter className="h-5 w-5 mr-2 text-slate-700" />
                <h2 className="font-semibold text-slate-900">Filters</h2>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-medium text-slate-900 mb-3">Gender</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === category}
                        onChange={() => setSelectedCategory(category)}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <span className="ml-2 text-sm text-slate-700 capitalize">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Shape Filter */}
              <div className="mb-6">
                <h3 className="font-medium text-slate-900 mb-3">Frame Shape</h3>
                <div className="space-y-2">
                  {shapes.map((shape) => (
                    <label key={shape} className="flex items-center">
                      <input
                        type="radio"
                        name="shape"
                        checked={selectedShape === shape}
                        onChange={() => setSelectedShape(shape)}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <span className="ml-2 text-sm text-slate-700 capitalize">{shape}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Material Filter */}
              <div className="mb-6">
                <h3 className="font-medium text-slate-900 mb-3">Material</h3>
                <div className="space-y-2">
                  {materials.map((material) => (
                    <label key={material} className="flex items-center">
                      <input
                        type="radio"
                        name="material"
                        checked={selectedMaterial === material}
                        onChange={() => setSelectedMaterial(material)}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <span className="ml-2 text-sm text-slate-700 capitalize">{material}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h3 className="font-medium text-slate-900 mb-3">Price Range</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === 'all'}
                      onChange={() => setPriceRange('all')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-slate-700">All Prices</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === 'under-250'}
                      onChange={() => setPriceRange('under-250')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-slate-700">Under $250</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === '250-300'}
                      onChange={() => setPriceRange('250-300')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-slate-700">$250 - $300</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange === 'over-300'}
                      onChange={() => setPriceRange('over-300')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-slate-700">Over $300</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-slate-600">
                Showing {filteredProducts.length} of {products.length} products
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-600">No products found matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
