"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "Product Manager @ Google",
    image: "/assets/avatar_1_1778094262100.png",
    quote: "JobVanta completely transformed my job search. The AI optimized my resume in seconds, and I started getting interviews within a week. The templates are gorgeous."
  },
  {
    name: "David Chen",
    role: "Senior Full Stack Engineer",
    image: "/assets/avatar_2_1778094460163.png",
    quote: "As a developer, I hate writing resumes. This platform took my scattered experience and turned it into a cohesive narrative. Landed 3 offers after using it."
  },
  {
    name: "Elena Rodriguez",
    role: "Marketing Director",
    image: "/assets/avatar_3_1778094605849.png",
    quote: "The ATS scanner is a game changer. It told me exactly what keywords I was missing. The UI is incredibly slick and easy to use."
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Loved by ambitious professionals.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-3xl glass border border-white/10 relative"
            >
              <div className="text-4xl text-cyan-500/20 absolute top-6 right-8">"</div>
              <p className="text-white/80 text-lg leading-relaxed mb-8 relative z-10">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/10">
                  <Image 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-white font-semibold">{testimonial.name}</h4>
                  <p className="text-white/40 text-sm">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
