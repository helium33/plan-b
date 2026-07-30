import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useState } from 'react';

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We will get back to you soon.');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-slate-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get In Touch</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            We're here to help with any questions about our products or services
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-amber-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Main Store</p>
                    <p className="text-slate-600">123 Vision Boulevard</p>
                    <p className="text-slate-600">New York, NY 10001</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-amber-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Phone</p>
                    <p className="text-slate-600">+1 (555) 123-4567</p>
                    <p className="text-slate-600">+1 (555) 765-4321</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-amber-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Email</p>
                    <p className="text-slate-600">info@visionlux.com</p>
                    <p className="text-slate-600">support@visionlux.com</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-amber-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">Business Hours</p>
                    <p className="text-slate-600">Mon - Fri: 9:00 AM - 7:00 PM</p>
                    <p className="text-slate-600">Sat - Sun: 10:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Locations */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Store Locations</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-slate-50 rounded-md">
                  <p className="font-medium text-slate-900">Manhattan Flagship</p>
                  <p className="text-slate-600">123 Vision Blvd, NY 10001</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-md">
                  <p className="font-medium text-slate-900">Brooklyn Heights</p>
                  <p className="text-slate-600">456 Brooklyn Ave, NY 11201</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-md">
                  <p className="font-medium text-slate-900">Queens Center</p>
                  <p className="text-slate-600">789 Queens Rd, NY 11375</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-slate-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Tell us how we can help you..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-slate-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-300 rounded-lg h-96 flex items-center justify-center">
            <p className="text-slate-600">Map Placeholder - Integrate with Google Maps API</p>
          </div>
        </div>
      </div>
    </div>
  );
}
