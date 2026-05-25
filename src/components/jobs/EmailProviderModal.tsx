"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Globe, Monitor } from "lucide-react";
import { Job } from "@/store/useJobStore";
import { useState, useEffect } from "react";
import { UserResume, useResumeStore } from "@/store/useResumeStore";

interface EmailProviderModalProps {
  job: Job | null;
  resume: UserResume | null;
  isOpen: boolean;
  onClose: () => void;
}

export function buildEmailLinks(job: Job, resume: UserResume | null) {
  const resumeData = resume?.content;
  const fullName = resumeData?.personalInfo?.fullName || "Applicant";
  const userEmail = resumeData?.personalInfo?.email || "";
  const userPhone = resumeData?.personalInfo?.phone || "";
  const topSkills = (resumeData?.skills || []).slice(0, 5).join(", ") || "relevant skills";
  const latestExp = resumeData?.experience?.[0];
  const latestRole = latestExp?.role || "my previous role";
  const latestCompany = latestExp?.company || "my previous company";
  const firstBullet = latestExp?.bullets?.[0] || "delivered impactful results";

  const subject = `Application for ${job.title} — ${fullName}`;
  const body = `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${job.title} position at ${job.company}, as listed on JobVanta.\n\nWith experience in ${topSkills}, I believe I would be a strong fit for this role. My background includes ${latestRole} at ${latestCompany}, where I ${firstBullet}.\n\nI have attached my resume for your review and would welcome the opportunity to discuss how my skills and experience align with your team's needs.\n\nThank you for your consideration. I look forward to hearing from you.\n\nBest regards,\n${fullName}${userEmail ? `\n${userEmail}` : ""}${userPhone ? `\n${userPhone}` : ""}`;

  const fallbackEmail = job.company ? `careers@${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : "hiring@company.com";
  const emailTo = job.contactEmail ? encodeURIComponent(job.contactEmail) : encodeURIComponent(fallbackEmail);
  const encSubject = encodeURIComponent(subject);
  const encBody = encodeURIComponent(body);

  return {
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${emailTo}&su=${encSubject}&body=${encBody}`,
    outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${emailTo}&subject=${encSubject}&body=${encBody}`,
    yahoo: `https://compose.mail.yahoo.com/?to=${emailTo}&subj=${encSubject}&body=${encBody}`,
    default: `mailto:${emailTo}?subject=${encSubject}&body=${encBody}`,
  };
}

export default function EmailProviderModal({ job, resume: initialResume, isOpen, onClose }: EmailProviderModalProps) {
  const { userResumes } = useResumeStore();
  const [selectedResume, setSelectedResume] = useState<UserResume | null>(initialResume);

  useEffect(() => {
    if (isOpen && initialResume) {
      setSelectedResume(initialResume);
    }
  }, [isOpen, initialResume]);

  if (!isOpen || !job) return null;

  const links = buildEmailLinks(job, selectedResume);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-200/60 overflow-hidden"
        >
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Choose Email App</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Select how you want to send your application.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`space-y-3 ${!selectedResume ? 'opacity-50 pointer-events-none' : ''}`}>
              <a
                href={links.gmail}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-slate-100 hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Gmail</h4>
                  <p className="text-xs font-medium text-slate-500">Open in web browser</p>
                </div>
              </a>

              <a
                href={links.outlook}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-slate-100 hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Monitor className="w-6 h-6" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Outlook Web</h4>
                  <p className="text-xs font-medium text-slate-500">Open in web browser</p>
                </div>
              </a>

              <a
                href={links.yahoo}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-slate-100 hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Yahoo Mail</h4>
                  <p className="text-xs font-medium text-slate-500">Open in web browser</p>
                </div>
              </a>

              <div className="pt-3 pb-1 flex items-center gap-4">
                <div className="h-px bg-slate-100 flex-1" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
                <div className="h-px bg-slate-100 flex-1" />
              </div>

              <a
                href={links.default}
                onClick={onClose}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-transparent hover:bg-slate-100 hover:border-slate-200 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-white text-slate-600 shadow-sm flex items-center justify-center">
                  <Monitor className="w-6 h-6" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-slate-900">Default Mail App</h4>
                  <p className="text-xs font-medium text-slate-500">Apple Mail, Windows Mail, etc.</p>
                </div>
              </a>
            </div>

            <div className="mt-6 space-y-4">
              {!selectedResume && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                  <p className="text-xs font-bold text-rose-700 text-center mb-3">
                    ⚠️ You haven't selected a resume yet! Please choose one to generate your cover letter:
                  </p>
                  {userResumes.length > 0 ? (
                    <select
                      className="w-full p-3 rounded-xl border border-rose-200 bg-white text-sm font-bold outline-none"
                      onChange={(e) => {
                        const resume = userResumes.find(r => r.id === e.target.value);
                        if (resume) setSelectedResume(resume);
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Select a resume...</option>
                      {userResumes.map(r => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs text-rose-600 font-medium mb-2">You don't have any resumes created.</p>
                      <a href="/builder" className="text-xs font-bold text-blue-600 hover:underline">Go create one now</a>
                    </div>
                  )}
                </div>
              )}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <p className="text-xs font-bold text-amber-700 text-center leading-relaxed">
                  📎 Important: Web links cannot automatically attach files for security reasons. You MUST manually attach your downloaded PDF after the email draft opens!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
