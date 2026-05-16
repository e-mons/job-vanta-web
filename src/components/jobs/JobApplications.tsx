"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Mail, 
  ChevronRight,
  Search,
  Filter,
  Calendar,
  Building2,
  MapPin
} from "lucide-react";
import { format } from "date-fns";

interface Application {
  id: string;
  status: string;
  created_at: string;
  metadata: any;
  resumes: {
    title: string;
  };
  application_emails: {
    id: string;
    subject: string;
    body: string;
    created_at: string;
  }[];
}

export default function JobApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select(`
          *,
          resumes (title),
          application_emails (*)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error fetching applications:", JSON.stringify(error, null, 2));
        throw error;
      }
      setApplications(data || []);
    } catch (err: any) {
      console.error("Error fetching applications:", err?.message || JSON.stringify(err));
      // Optional: you can also set an error state here if you want to display it in the UI
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Applications...</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Briefcase className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">No applications yet</h3>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
          Start your career journey by applying to jobs that match your skills.
        </p>
        <a 
          href="/jobs" 
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
        >
          Browse Jobs
          <ChevronRight className="w-5 h-5" />
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Applications List */}
      <div className="lg:col-span-5 space-y-4">
        {applications.map((app) => (
          <motion.div
            key={app.id}
            layoutId={app.id}
            onClick={() => setSelectedApp(app)}
            className={`p-6 rounded-[32px] border transition-all cursor-pointer ${
              selectedApp?.id === app.id 
                ? "bg-white border-blue-600 shadow-xl shadow-blue-600/10 ring-1 ring-blue-600" 
                : "bg-white border-slate-100 hover:border-slate-300"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ${
                  app.status === 'applied' ? 'bg-blue-600' : 'bg-slate-400'
                }`}>
                  {app.metadata?.company?.charAt(0) || 'J'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 line-clamp-1">{app.metadata?.title}</h4>
                  <p className="text-sm text-slate-500 font-medium">{app.metadata?.company}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                app.status === 'applied' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'
              }`}>
                {app.status}
              </span>
            </div>

            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {format(new Date(app.created_at), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {format(new Date(app.created_at), "HH:mm")}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Application Details */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {selectedApp ? (
            <motion.div
              key={selectedApp.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm h-full"
            >
              <div className="mb-10">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">{selectedApp.metadata?.title}</h2>
                    <div className="flex items-center gap-4 text-slate-500 font-bold">
                      <span className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        {selectedApp.metadata?.company}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        {selectedApp.metadata?.location}
                      </span>
                    </div>
                  </div>
                  {selectedApp.metadata?.applyLink && (
                    <a 
                      href={selectedApp.metadata.applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-2xl bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <ExternalLink className="w-6 h-6" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resume Used</p>
                    <p className="font-bold text-slate-900">{selectedApp.resumes?.title}</p>
                  </div>
                  <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                      <p className="font-bold text-slate-900 uppercase">{selectedApp.status}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email History */}
              <div>
                <h3 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-6">
                  <Mail className="w-6 h-6 text-blue-600" />
                  Communication History
                </h3>
                
                {selectedApp.application_emails.length > 0 ? (
                  <div className="space-y-6">
                    {selectedApp.application_emails.map((email) => (
                      <div key={email.id} className="p-6 rounded-[32px] bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200/60">
                          <h4 className="font-bold text-slate-900">{email.subject}</h4>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {format(new Date(email.created_at), "MMM d, HH:mm")}
                          </span>
                        </div>
                        <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                          {email.body}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 rounded-[32px] bg-slate-50 border border-dashed border-slate-200">
                    <Mail className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No emails generated yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-50 rounded-[40px] border border-dashed border-slate-200 p-20 flex flex-col items-center justify-center h-full">
              <Search className="w-16 h-16 text-slate-200 mb-6" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Select an application to view details</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
