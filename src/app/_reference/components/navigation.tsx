import { Link, useLocation } from 'react-router-dom';
import { Menu, ShoppingCart, User, X } from 'lucide-react';
import { useState } from 'react';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Services', path: '/services' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center">
              <span className="text-white text-sm font-bold">V</span>
            </div>
            <span className="text-xl font-semibold text-slate-900">VisionLux</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm transition-colors ${
                  isActive(link.path)
                    ? 'text-slate-900 font-medium'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button className="text-slate-600 hover:text-slate-900 transition-colors">
              <User className="h-5 w-5" />
            </button>
            <button className="text-slate-600 hover:text-slate-900 transition-colors relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-xs text-white flex items-center justify-center">
                0
              </span>
            </button>
            <button
              className="md:hidden text-slate-600 hover:text-slate-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="space-y-1 px-4 py-4">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-base rounded-md ${
                  isActive(link.path)
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
