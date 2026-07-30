export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'men' | 'women' | 'sunglasses';
  frameShape: string;
  material: string;
  image: string;
  description: string;
  features: string[];
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Classic Aviator',
    price: 299,
    category: 'sunglasses',
    frameShape: 'Aviator',
    material: 'Titanium',
    image: 'https://images.unsplash.com/photo-1758552322632-ba288778c770?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5nbGFzc2VzJTIwcHJvZHVjdCUyMHByZW1pdW18ZW58MXx8fHwxNzY4MzgzNTY0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Timeless aviator sunglasses with UV protection and premium titanium frame.',
    features: ['UV400 Protection', 'Polarized Lenses', 'Titanium Frame', '2-Year Warranty'],
  },
  {
    id: '2',
    name: 'Modern Minimalist',
    price: 249,
    category: 'men',
    frameShape: 'Rectangle',
    material: 'Acetate',
    image: 'https://images.unsplash.com/photo-1722569354346-c2fc2e360808?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleWVnbGFzc2VzJTIwbW9kZWwlMjBsdXh1cnl8ZW58MXx8fHwxNzY4MzgzNTYzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Sleek rectangular frames perfect for a professional look.',
    features: ['Blue Light Filter', 'Anti-Glare Coating', 'Lightweight', 'Adjustable Nose Pads'],
  },
  {
    id: '3',
    name: 'Vintage Round',
    price: 279,
    category: 'women',
    frameShape: 'Round',
    material: 'Metal',
    image: 'https://images.unsplash.com/photo-1513065200622-9a226a3c7adc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleWV3ZWFyJTIwZmFzaGlvbiUyMGNsb3NldXB8ZW58MXx8fHwxNzY4MzgzNTY1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Elegant round frames with a vintage-inspired design.',
    features: ['Blue Light Filter', 'Premium Metal', 'Comfortable Fit', 'Scratch Resistant'],
  },
  {
    id: '4',
    name: 'Executive Wayfarer',
    price: 329,
    category: 'men',
    frameShape: 'Wayfarer',
    material: 'Acetate',
    image: 'https://images.unsplash.com/photo-1717068342175-c3a303a09f91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleWVnbGFzc2VzJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc2ODM4MzU2NXww&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Bold wayfarer style for the modern professional.',
    features: ['Blue Light Filter', 'Premium Acetate', 'Spring Hinges', 'Luxury Case Included'],
  },
  {
    id: '5',
    name: 'Designer Cat-Eye',
    price: 289,
    category: 'women',
    frameShape: 'Cat-Eye',
    material: 'Acetate',
    image: 'https://images.unsplash.com/photo-1755869980879-1cc345f1980c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbGFzc2VzJTIwZnJhbWUlMjBsdXh1cnl8ZW58MXx8fHwxNzY4MzgzNTY1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Sophisticated cat-eye frames with a fashion-forward design.',
    features: ['Premium Acetate', 'Blue Light Filter', 'Handcrafted', 'Limited Edition'],
  },
  {
    id: '6',
    name: 'Sport Performance',
    price: 349,
    category: 'sunglasses',
    frameShape: 'Sport',
    material: 'TR90',
    image: 'https://images.unsplash.com/photo-1762718900539-c51799fd71b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcHRpY2FsJTIwc3RvcmUlMjBtb2Rlcm58ZW58MXx8fHwxNzY4MzgzNTY0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'High-performance sunglasses for active lifestyles.',
    features: ['UV400 Protection', 'Polarized', 'Lightweight TR90', 'Anti-Slip'],
  },
];

export const testimonials = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Marketing Executive',
    content: 'Best eyewear shopping experience! The blue light lenses have completely transformed my workday comfort.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1722569354346-c2fc2e360808?w=100&h=100&fit=crop',
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Software Developer',
    content: 'Premium quality at fair prices. The virtual try-on feature made choosing the perfect frames so easy!',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1717068342175-c3a303a09f91?w=100&h=100&fit=crop',
  },
  {
    id: '3',
    name: 'Emma Davis',
    role: 'Fashion Designer',
    content: 'Stylish, comfortable, and professional. These glasses are a perfect blend of form and function.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1755869980879-1cc345f1980c?w=100&h=100&fit=crop',
  },
];

export const services = [
  {
    id: '1',
    title: 'Professional Eye Testing',
    description: 'Comprehensive eye examinations by certified optometrists',
    icon: 'Eye',
  },
  {
    id: '2',
    title: 'Prescription Lenses',
    description: 'Custom prescription lenses with anti-glare and blue light protection',
    icon: 'Glasses',
  },
  {
    id: '3',
    title: 'Blue Light Protection',
    description: 'Advanced lens technology to reduce digital eye strain',
    icon: 'Shield',
  },
  {
    id: '4',
    title: 'Lifetime Support',
    description: 'Free adjustments, cleaning, and repair services',
    icon: 'Settings',
  },
];
