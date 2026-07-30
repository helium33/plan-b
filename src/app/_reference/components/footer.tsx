import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">V</span>
              </div>
              <span className="text-xl font-semibold">VisionLux</span>
            </div>
            <p className="text-slate-400 text-sm">
              Premium eyewear for the modern professional. Quality, style, and clarity.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/shop" className="text-slate-400 hover:text-white transition-colors">
                  Shop All
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-400 hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>FAQ</li>
              <li>Shipping & Returns</li>
              <li>Warranty</li>
              <li>Size Guide</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4">Newsletter</h3>
            <p className="text-slate-400 text-sm mb-4">Subscribe for exclusive offers</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2 rounded-l-md bg-slate-800 border border-slate-700 focus:outline-none focus:border-amber-500 text-sm"
              />
              <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-r-md transition-colors">
                <Mail className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Social & Copyright */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm mb-4 md:mb-0">
            © 2026 VisionLux. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
