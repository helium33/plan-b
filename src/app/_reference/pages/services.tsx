import { Eye, Glasses, Shield, Settings } from 'lucide-react';
import { services } from '@/app/data/products';

export function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-slate-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Comprehensive eye care and premium optical services for your vision needs
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 rounded-lg p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-6">
                <Eye className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Professional Eye Testing</h3>
              <p className="text-slate-600 mb-6">
                Comprehensive eye examinations conducted by certified optometrists using the latest
                diagnostic technology. We assess your visual acuity, eye health, and determine your
                precise prescription needs.
              </p>
              <ul className="space-y-2 text-slate-700">
                <li>• Complete eye health assessment</li>
                <li>• Digital refraction testing</li>
                <li>• Retinal imaging</li>
                <li>• Prescription verification</li>
              </ul>
              <button className="mt-6 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors">
                Book Eye Test
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-6">
                <Glasses className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Prescription Lenses</h3>
              <p className="text-slate-600 mb-6">
                Custom prescription lenses crafted to your exact specifications. Choose from single
                vision, bifocal, or progressive lenses with advanced coatings for optimal clarity
                and protection.
              </p>
              <ul className="space-y-2 text-slate-700">
                <li>• Single vision lenses</li>
                <li>• Progressive (no-line bifocal) lenses</li>
                <li>• Anti-reflective coating</li>
                <li>• Scratch-resistant coating</li>
              </ul>
              <button className="mt-6 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors">
                Learn More
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-6">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Blue Light Protection</h3>
              <p className="text-slate-600 mb-6">
                Protect your eyes from harmful blue light emitted by digital screens. Our advanced
                lens technology filters blue light while maintaining color accuracy and visual
                clarity.
              </p>
              <ul className="space-y-2 text-slate-700">
                <li>• Reduces digital eye strain</li>
                <li>• Improves sleep quality</li>
                <li>• Protects against UV and blue light</li>
                <li>• Available for all prescriptions</li>
              </ul>
              <button className="mt-6 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors">
                Add to Frames
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
                <Settings className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">After-Sales Service</h3>
              <p className="text-slate-600 mb-6">
                Our commitment doesn't end at purchase. We provide comprehensive after-sales
                support including free adjustments, repairs, and maintenance to keep your eyewear in
                perfect condition.
              </p>
              <ul className="space-y-2 text-slate-700">
                <li>• Free lifetime adjustments</li>
                <li>• Professional cleaning service</li>
                <li>• Repair and maintenance</li>
                <li>• Warranty support</li>
              </ul>
              <button className="mt-6 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Questions About Our Services?</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Our team of optical experts is here to help you find the perfect solution
          </p>
          <button className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors">
            Contact Us
          </button>
        </div>
      </section>
    </div>
  );
}
