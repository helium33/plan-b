import { Award, Target, Users } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-slate-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About VisionLux</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Redefining eyewear with a perfect blend of style, quality, and innovation
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-slate-600">
                <p>
                  Founded in 2020, VisionLux was born from a simple belief: eyewear should be more
                  than just a medical necessity. It should be a statement of style, a mark of
                  quality, and an investment in your well-being.
                </p>
                <p>
                  We started with a mission to create premium eyewear that combines cutting-edge
                  lens technology with timeless design. Every frame we craft is a testament to our
                  commitment to excellence, from the materials we source to the artisans who bring
                  them to life.
                </p>
                <p>
                  Today, VisionLux serves thousands of satisfied customers worldwide, helping them
                  see the world more clearly while looking their absolute best.
                </p>
              </div>
            </div>
            <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1762718900539-c51799fd71b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcHRpY2FsJTIwc3RvcmUlMjBtb2Rlcm58ZW58MXx8fHwxNzY4MzgzNTY0fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="VisionLux Store"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-4">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Quality First</h3>
              <p className="text-slate-600">
                We never compromise on quality. Every frame is crafted from premium materials and
                undergoes rigorous quality control.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Innovation</h3>
              <p className="text-slate-600">
                We continuously push the boundaries of lens technology and frame design to bring you
                the best in eyewear innovation.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Customer Focus</h3>
              <p className="text-slate-600">
                Your satisfaction is our priority. We provide exceptional service and support
                throughout your eyewear journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Craftsmanship */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1722569354346-c2fc2e360808?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleWVnbGFzc2VzJTIwbW9kZWwlMjBsdXh1cnl8ZW58MXx8fHwxNzY4MzgzNTYzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Craftsmanship"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Optical Excellence</h2>
              <div className="space-y-4 text-slate-600">
                <p>
                  Our expertise in optical science ensures that every pair of glasses we create
                  delivers exceptional visual clarity and comfort. We work with the world's leading
                  lens manufacturers to source the finest optical materials.
                </p>
                <p>
                  Each frame is carefully engineered for optimal fit and durability. From the
                  precision of our measurements to the quality of our adjustments, we maintain the
                  highest standards at every step.
                </p>
                <p>
                  Whether you're looking for everyday eyeglasses or premium sunglasses, you can
                  trust VisionLux to deliver eyewear that exceeds your expectations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Expert Team</h2>
          <p className="text-slate-600 mb-12 max-w-2xl mx-auto">
            A dedicated team of optical professionals, designers, and customer service specialists
            committed to your vision
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Dr. Sarah Mitchell', role: 'Chief Optometrist', image: 'https://images.unsplash.com/photo-1722569354346-c2fc2e360808?w=300&h=300&fit=crop' },
              { name: 'Alex Chen', role: 'Design Director', image: 'https://images.unsplash.com/photo-1717068342175-c3a303a09f91?w=300&h=300&fit=crop' },
              { name: 'Emma Rodriguez', role: 'Customer Experience', image: 'https://images.unsplash.com/photo-1755869980879-1cc345f1980c?w=300&h=300&fit=crop' },
            ].map((member, i) => (
              <div key={i} className="text-center">
                <div className="w-32 h-32 rounded-full bg-slate-200 mx-auto mb-4 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-slate-900">{member.name}</h3>
                <p className="text-slate-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
