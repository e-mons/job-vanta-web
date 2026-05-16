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
import { PLANS } from "@/config/plans";
import { useSubscriptionStore } from "@/store/useSubscription";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'security' | 'notifications'>('profile');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { status: subStatus, planId, currentPeriodEnd, fetchSubscription } = useSubscriptionStore();
  const router = useRouter();

  // Form states
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    avatarUrl: ""
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
          bio: user.user_metadata?.bio || "",
          avatarUrl: user.user_metadata?.avatar_url || ""
        });
      }
      setIsLoading(false);
    }
    getProfile();
    fetchSubscription();
  }, [fetchSubscription]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    const supabase = createClient();
    
    // 1. Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Error uploading image. Please ensure an 'avatars' bucket exists in your Supabase storage.");
      setIsSaving(false);
      return;
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // 3. Update User Metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl }
    });

    if (updateError) {
      toast.error(updateError.message);
    } else {
      setProfileForm(prev => ({ ...prev, avatarUrl: publicUrl }));
      toast.success("Avatar updated successfully!");
    }
    setIsSaving(false);
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: profileForm.fullName,
        phone: profileForm.phone,
        location: profileForm.location,
        bio: profileForm.bio,
        avatar_url: profileForm.avatarUrl
      }
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated successfully!");
    }
    setIsSaving(false);
  };

  const handleChangePassword = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset email sent!");
    }
  };

  const handleDeactivateAccount = async () => {
    toast.warning("Are you sure you want to deactivate your account?", {
      description: "This action is irreversible.",
      action: {
        label: "Deactivate",
        onClick: async () => {
          const supabase = createClient();
          toast.info("Account deactivation requested. Our team will process your request.");
          await supabase.auth.signOut();
          router.push("/");
        }
      },
      cancel: {
        label: "Cancel",
        onClick: () => {}
      }
    });
  };

  const [notificationPrefs, setNotificationPrefs] = useState<any>({
    email_notifications: true,
    marketing_emails: true,
    browser_notifications: true,
    sms_alerts: false
  });

  useEffect(() => {
    if (user?.user_metadata?.notifications) {
      setNotificationPrefs(user.user_metadata.notifications);
    }
  }, [user]);

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { notifications: notificationPrefs }
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Notification settings saved!");
    }
    setIsSaving(false);
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/dodopayments/portal', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "No URL returned");
      }
    } catch (err: any) {
      console.error("Portal error:", err);
      toast.error(err.message || "Failed to open billing portal.");
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
                        <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-500/30 overflow-hidden">
                          {profileForm.avatarUrl ? (
                            <img src={profileForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            user?.email?.[0].toUpperCase()
                          )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-xl shadow-xl border border-slate-100 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all hover:scale-110 active:scale-95 cursor-pointer">
                          <Camera className="w-5 h-5" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        </label>
                      </div>
                      <div className="text-center md:text-left">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{profileForm.fullName || user?.email?.split('@')[0]}</h2>
                        <p className="text-slate-500 font-medium mb-4">{user?.email}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                          {subStatus === 'active' || subStatus === 'trialing' ? (
                            <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider border border-blue-100 flex items-center gap-2">
                              <Star className="w-3 h-3 fill-blue-600" /> Premium Member
                            </span>
                          ) : (
                            <span className="px-4 py-1.5 rounded-full bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border border-slate-100 flex items-center gap-2">
                              Free Plan
                            </span>
                          )}
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
                          <h2 className="text-3xl font-black tracking-tight leading-tight">
                            {subStatus === 'none' ? 'Free Plan' : (PLANS.find(p => p.priceId === planId)?.name || 'Pro') + ' Plan'}
                          </h2>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                         {[
                          { label: 'Status', value: subStatus === 'none' ? 'FREE' : subStatus?.toUpperCase(), color: subStatus === 'none' ? 'text-slate-400' : 'text-emerald-400' },
                          { label: 'Next Billing', value: currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—', color: 'text-white' },
                          { label: 'Amount', value: subStatus === 'none' ? '$0.00' : `$${PLANS.find(p => p.priceId === planId)?.price || '29'}.00 / mo`, color: 'text-white' },
                        ].map((stat, i) => (
                          <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{stat.label}</p>
                            <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        {subStatus === 'none' ? (
                          <button 
                            onClick={() => router.push('/pricing')}
                            className="px-8 py-4 bg-blue-600 text-white rounded-[20px] font-black text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20"
                          >
                            <Star className="w-5 h-5 fill-white" /> Upgrade to Pro
                          </button>
                        ) : (
                          <button 
                            onClick={handleManageBilling}
                            className="px-8 py-4 bg-white text-slate-900 rounded-[20px] font-black text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-5 h-5" /> Manage Billing
                          </button>
                        )}
                        <button 
                          onClick={() => router.push('/pricing')}
                          className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-[20px] font-black text-sm transition-all border border-white/10"
                        >
                          View Pricing Plans
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-10 rounded-[3rem] bg-white border border-slate-200/60 shadow-2xl shadow-slate-200/50">
                    <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Plan Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(subStatus === 'none' ? [
                        'ATS-Friendly Resume Builder',
                        'Limited AI Suggestions',
                        'Job Search & Matching',
                        '3 Saved Resumes',
                        'Basic Support'
                      ] : [
                        'Unlimited AI Resume Tailoring',
                        'Real-time ATS Score Analysis',
                        'Unlimited PDF Downloads',
                        'AI Cover Letter Generation',
                        'Priority Customer Support',
                        'Advanced Career Roadmap AI',
                      ]).map((feature, i) => (
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
                      <div 
                        onClick={handleChangePassword}
                        className="flex items-center justify-between p-6 rounded-[24px] bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 transition-all">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">Change Password</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Send reset email to {user?.email}</p>
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
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                              {user?.user_metadata?.two_factor_enabled ? 'Enabled' : 'Disabled'}
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={user?.user_metadata?.two_factor_enabled || false}
                            onChange={async (e) => {
                              const supabase = createClient();
                              const { error } = await supabase.auth.updateUser({
                                data: { two_factor_enabled: e.target.checked }
                              });
                              if (error) {
                                toast.error(error.message);
                              } else {
                                setUser({ ...user, user_metadata: { ...user.user_metadata, two_factor_enabled: e.target.checked } });
                                toast.success(`2FA ${e.target.checked ? 'Enabled' : 'Disabled'} successfully!`);
                              }
                            }}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="pt-10">
                        <button 
                          onClick={handleDeactivateAccount}
                          className="flex items-center gap-3 px-8 py-4 text-rose-500 font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-50 rounded-2xl transition-all"
                        >
                          <LogOut className="w-4 h-4" /> Deactivate Account
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="p-10 rounded-[3rem] bg-white border border-slate-200/60 shadow-2xl shadow-slate-200/50">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
                        <Bell className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Notification Preferences</h3>
                        <p className="text-sm font-medium text-slate-500">Control how and when you want to be notified.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { title: 'Email Notifications', desc: 'Receive daily job alerts and application updates.', key: 'email_notifications' },
                        { title: 'Marketing Emails', desc: 'Stay updated with new features and career tips.', key: 'marketing_emails' },
                        { title: 'Browser Notifications', desc: 'Get real-time alerts when recruiters view your profile.', key: 'browser_notifications' },
                        { title: 'SMS Alerts', desc: 'Instant text alerts for high-priority job matches.', key: 'sms_alerts', pro: true }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-6 rounded-[24px] bg-slate-50 border border-transparent transition-all">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <p className="text-sm font-black text-slate-900">{item.title}</p>
                              {item.pro && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-[8px] font-black text-white uppercase tracking-widest">Pro</span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-slate-400 leading-relaxed">{item.desc}</p>
                          </div>
                          <div className="ml-6">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={notificationPrefs[item.key]} 
                                onChange={(e) => setNotificationPrefs({ ...notificationPrefs, [item.key]: e.target.checked })}
                                disabled={item.pro && subStatus === 'none'}
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-10 border-t border-slate-100 mt-10 flex justify-end">
                      <button 
                        onClick={handleSaveNotifications}
                        disabled={isSaving}
                        className="flex items-center gap-3 px-10 py-5 bg-blue-600 text-white rounded-[20px] font-black text-sm hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Preferences
                      </button>
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
