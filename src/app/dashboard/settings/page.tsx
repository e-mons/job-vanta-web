"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Shield, 
  CreditCard, 
  Bell, 
  ChevronRight, 
  Star,
  CheckCircle2,
  Lock,
  Mail,
  Smartphone,
  Globe,
  Camera,
  LogOut,
  Save,
  Loader2
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { createClient } from "@/utils/supabase/client";
import { useSubscriptionStore } from "@/store/useSubscription";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'security' | 'notifications'>('profile');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { status: subStatus, fetchSubscription } = useSubscriptionStore();
  const router = useRouter();

  // Form states
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    bio: ""
  });

  useEffect(() => {
    async function getProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setProfileForm({
          fullName: user.user_metadata?.full_name || "",
          email: user.email || "",
          phone: user.user_metadata?.phone || "",
          location: user.user_metadata?.location || "",
          bio: user.user_metadata?.bio || ""
        });
      }
      setIsLoading(false);
    }
    getProfile();
    fetchSubscription();
  }, [fetchSubscription]);

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: profileForm.fullName,
        phone: profileForm.phone,
        location: profileForm.location,
        bio: profileForm.bio
      }
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Profile updated successfully!");
    }
    setIsSaving(false);
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/dodopayments/portal', {
        method: 'POST',
      });
      const { url, error } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error(error || "No URL returned");
      }
    } catch (err) {
      console.error("Portal error:", err);
      alert("Failed to open billing portal.");
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'subscription', label: 'Subscription', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <Lock className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 lg:p-12 pb-24 lg:pb-12 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Account <span className="text-blue-600">Settings</span></h1>
          <p className="text-slate-500 font-medium text-lg">Manage your personal information, subscription, and security preferences.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Tabs */}
          <aside className="lg:w-72 shrink-0">
            <div className="p-2 bg-slate-200/50 rounded-[2.5rem] flex lg:flex-col gap-2 shadow-inner border border-slate-200/60">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] text-sm font-black transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white text-blue-600 shadow-xl shadow-slate-200/60 border border-white' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'} transition-colors`}>
                    {tab.icon}
                  </div>
                  <span className="flex-1 text-left tracking-tight">{tab.label}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Profile Header Card */}
                  <div className="p-10 rounded-[3rem] bg-white border border-slate-200 shadow-xl shadow-slate-200/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-500/30">
                          {user?.email?.[0].toUpperCase()}
                        </div>
                        <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-xl shadow-xl border border-slate-100 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all hover:scale-110 active:scale-95">
                          <Camera className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="text-center md:text-left">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{profileForm.fullName || user?.email?.split('@')[0]}</h2>
                        <p className="text-slate-500 font-medium mb-4">{user?.email}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                          <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider border border-blue-100 flex items-center gap-2">
                            <Star className="w-3 h-3 fill-blue-600" /> Premium Member
                          </span>
                          <span className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider border border-emerald-100 flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" /> Verified Account
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="p-10 rounded-[3rem] bg-white border border-slate-200 shadow-xl shadow-slate-200/30 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] ml-1">Full Name</label>
                        <div className="relative group">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                          <input 
                            className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-[20px] focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                            value={profileForm.fullName}
                            onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                            placeholder="Your name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Email Address</label>
                        <div className="relative group">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 transition-colors" />
                          <input 
                            className="w-full pl-14 pr-6 py-5 bg-slate-50/50 border border-slate-100 rounded-[20px] text-slate-400 font-bold outline-none cursor-not-allowed"
                            value={profileForm.email}
                            disabled
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Phone Number</label>
                        <div className="relative group">
                          <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                          <input 
                            className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-[20px] focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Location</label>
                        <div className="relative group">
                          <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                          <input 
                            className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-[20px] focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                            value={profileForm.location}
                            onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                            placeholder="San Francisco, CA"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Professional Bio</label>
                      <textarea 
                        className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[32px] focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900 min-h-[160px] resize-none"
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button 
                        onClick={handleUpdateProfile}
                        disabled={isSaving}
                        className="flex items-center gap-3 px-10 py-5 bg-blue-600 text-white rounded-[20px] font-black text-sm hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'subscription' && (
                <motion.div
                  key="subscription"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="p-10 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                          <Star className="w-6 h-6 text-blue-400 fill-blue-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 leading-tight">Current Plan</p>
                          <h2 className="text-3xl font-black tracking-tight leading-tight">Premium Professional</h2>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {[
                          { label: 'Status', value: subStatus?.toUpperCase() || 'ACTIVE', color: 'text-emerald-400' },
                          { label: 'Next Billing', value: 'June 12, 2026', color: 'text-white' },
                          { label: 'Amount', value: '$19.00 / mo', color: 'text-white' },
                        ].map((stat, i) => (
                          <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{stat.label}</p>
                            <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                          onClick={handleManageBilling}
                          className="px-8 py-4 bg-white text-slate-900 rounded-[20px] font-black text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-5 h-5" /> Manage Billing
                        </button>
                        <button className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-[20px] font-black text-sm transition-all border border-white/10">
                          View Pricing Plans
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-10 rounded-[3rem] bg-white border border-slate-200/60 shadow-2xl shadow-slate-200/50">
                    <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Plan Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        'Unlimited AI Resume Tailoring',
                        'Real-time ATS Score Analysis',
                        'Unlimited PDF Downloads',
                        'AI Cover Letter Generation',
                        'Priority Customer Support',
                        'Advanced Career Roadmap AI',
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </div>
                          <span className="text-sm font-bold text-slate-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="p-10 rounded-[3rem] bg-white border border-slate-200/60 shadow-2xl shadow-slate-200/50">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shadow-sm">
                        <Lock className="w-6 h-6 text-rose-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Security & Privacy</h3>
                        <p className="text-sm font-medium text-slate-500">Secure your account and manage your data.</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 rounded-[24px] bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200 border border-transparent hover:border-slate-200 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 transition-all">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">Change Password</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Last updated 3 months ago</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-all" />
                      </div>

                      <div className="flex items-center justify-between p-6 rounded-[24px] bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200 border border-transparent hover:border-slate-200 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 transition-all">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">Two-Factor Authentication</p>
                            <p className="text-[11px] font-bold text-rose-500 uppercase tracking-widest mt-0.5">Currently Disabled</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-all" />
                      </div>

                      <div className="pt-10">
                        <button className="flex items-center gap-3 px-8 py-4 text-rose-500 font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-50 rounded-2xl transition-all">
                          <LogOut className="w-4 h-4" /> Deactivate Account
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
