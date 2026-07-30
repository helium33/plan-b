import { Link } from 'react-router-dom';
import { Eye, Shield, Award, Star, ArrowRight } from 'lucide-react';
import { products, testimonials } from '@/app/data/products';
import { ProductCard } from '@/app/_reference/components/product-card';

export function HomePage() {
  const featuredProducts = products.slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] bg-slate-900 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1722569354346-c2fc2e360808?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleWVnbGFzc2VzJTIwbW9kZWwlMjBsdXh1cnl8ZW58MXx8fHwxNzY4MzgzNTYzfDA&ixlib=rb-4.1.0&q=80&w=1080')`,
          }}
        />
        <div className="relative h-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              See the World in
              <span className="block text-amber-400">Perfect Clarity</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Premium eyewear crafted for the modern professional. Combining style, comfort, and
              cutting-edge lens technology.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors flex items-center"
              >
                Shop Frames
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/services"
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-md backdrop-blur-sm transition-colors border border-white/30"
              >
                Book Eye Test
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Featured Collections</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Discover our carefully curated selection of premium eyewear
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/shop"
              className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium"
            >
              View All Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Brand Values */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose VisionLux</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">UV Protection</h3>
              <p className="text-sm text-slate-600">
                100% UV400 protection for your eyes in all conditions
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Eye className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Blue Light Filter</h3>
              <p className="text-sm text-slate-600">
                Reduce digital eye strain with advanced lens technology
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-4">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Premium Materials</h3>
              <p className="text-sm text-slate-600">
                Handcrafted with titanium, acetate, and premium metals
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">2-Year Warranty</h3>
              <p className="text-sm text-slate-600">
                Comprehensive warranty with lifetime support and adjustments
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">What Our Customers Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-slate-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4">{testimonial.content}</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-3"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Vision?</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Book a free eye test today and discover your perfect frames
          </p>
          <Link
            to="/services"
            className="inline-block px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
          >
            Book Appointment
          </Link>
        </div>
      </section>
    </div>
  );
}
