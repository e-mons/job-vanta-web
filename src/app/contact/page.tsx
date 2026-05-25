"use client";

import { motion } from 'framer-motion';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare, 
  Send,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { createClient } from '@/utils/supabase/client';

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  subject: z.string().min(1, "Please select a subject."),
  message: z.string().min(10, "Message must be at least 10 characters long."),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormValues) => {
    try {
      setSubmitStatus('idle');
      setSubmitError('');

      const supabase = createClient();
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
        });

      if (error) throw error;

      setSubmitStatus('success');
      reset();
    } catch (err: any) {
      console.error("Contact form error:", err);
      setSubmitError(err.message || "Failed to send message. Please try again.");
      setSubmitStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      <section className="pt-40 pb-24 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20">
            {/* Left Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-600 mb-6"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Get In Touch</span>
              </motion.div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-8 leading-tight">
                Let&apos;s start a <br className="sm:hidden" />
                <span className="text-blue-600">Conversation.</span>
              </h1>
              
              <p className="text-lg text-slate-500 font-medium leading-relaxed mb-12 max-w-lg">
                Have questions about our AI tools or need help with your career journey? Our team is here to support you every step of the way.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Mail className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Email Us</p>
                    <p className="text-xl font-bold text-slate-900">support@jobvanta.ai</p>
                  </div>
                </div>

                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Phone className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Call Us</p>
                    <p className="text-xl font-bold text-slate-900">+1 (555) 000-0000</p>
                  </div>
                </div>

                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <MapPin className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Visit Us</p>
                    <p className="text-xl font-bold text-slate-900">[Your Real Business Address]</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Form Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 sm:p-10 md:p-12 rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl shadow-blue-900/10 border border-slate-100 relative"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/5 rounded-full -z-10 animate-float" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-400/5 rounded-full -z-10 animate-float" style={{ animationDelay: '1s' }} />

              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-900 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      {...register("name")}
                      type="text" 
                      placeholder="John Doe"
                      className={`w-full px-6 py-4 rounded-2xl bg-slate-50 border-none ${errors.name ? 'ring-2 ring-rose-500 bg-rose-50/50' : 'focus:ring-2 focus:ring-blue-600'} font-medium transition-all`}
                    />
                    {errors.name && <span className="text-xs font-bold text-rose-500 ml-1">{errors.name.message}</span>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-900 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      {...register("email")}
                      type="email" 
                      placeholder="john@example.com"
                      className={`w-full px-6 py-4 rounded-2xl bg-slate-50 border-none ${errors.email ? 'ring-2 ring-rose-500 bg-rose-50/50' : 'focus:ring-2 focus:ring-blue-600'} font-medium transition-all`}
                    />
                    {errors.email && <span className="text-xs font-bold text-rose-500 ml-1">{errors.email.message}</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-widest ml-1">Subject</label>
                  <select 
                    {...register("subject")}
                    className={`w-full px-6 py-4 rounded-2xl bg-slate-50 border-none ${errors.subject ? 'ring-2 ring-rose-500 bg-rose-50/50' : 'focus:ring-2 focus:ring-blue-600'} font-medium transition-all appearance-none`}
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.subject && <span className="text-xs font-bold text-rose-500 ml-1">{errors.subject.message}</span>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-widest ml-1">Message</label>
                  <textarea 
                    {...register("message")}
                    rows={4}
                    placeholder="How can we help you?"
                    className={`w-full px-6 py-4 rounded-2xl bg-slate-50 border-none ${errors.message ? 'ring-2 ring-rose-500 bg-rose-50/50' : 'focus:ring-2 focus:ring-blue-600'} font-medium transition-all resize-none`}
                  />
                  {errors.message && <span className="text-xs font-bold text-rose-500 ml-1">{errors.message.message}</span>}
                </div>

                {submitStatus === 'success' && (
                  <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 text-sm font-bold text-center border border-emerald-100 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Your message has been sent successfully! We&apos;ll be in touch soon.
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 text-sm font-bold text-center border border-rose-100 flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {submitError}
                  </div>
                )}

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center gap-3 shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-1 transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                >
                  <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
