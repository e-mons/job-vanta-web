"use client";

import { motion } from "framer-motion";
import { UserResume } from "@/store/useResumeStore";
import { CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import HTMLPreview from "@/components/builder/Preview/HTMLPreview";

interface ResumeSelectorProps {
  resumes: UserResume[];
  onSelect: (resume: UserResume) => void;
  selectedId?: string | null;
}

export default function ResumeSelector({ resumes, onSelect, selectedId }: ResumeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {resumes.map((resume, index) => {
        const isSelected = selectedId === resume.id;
        const skillsCount = resume.content.skills?.length || 0;
        const expCount = resume.content.experience?.length || 0;

        return (
          <motion.div
            key={resume.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            onClick={() => onSelect(resume)}
            className={`group relative cursor-pointer p-8 rounded-[40px] border-2 transition-all duration-500 ${
              isSelected
                ? "bg-blue-600 border-blue-600 shadow-[0_20px_50px_-15px_rgba(37,99,235,0.4)]"
                : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"
            }`}
          >
            {/* Realistic Resume Preview Icon */}
            <div className="mb-8">
              <div className={`aspect-[1/1.41] w-full rounded-2xl border-2 overflow-hidden relative transition-all duration-500 ${
                isSelected ? "border-white/40 ring-4 ring-white/10" : "bg-white border-slate-100"
              }`}>
                {/* Scaled HTML Preview - Calibrated to fit card width */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 origin-top scale-[0.38] md:scale-[0.42] w-[210mm] h-[297mm] pointer-events-none">
                  <HTMLPreview 
                    data={resume.content} 
                    templateId={resume.template_id || 'modern'} 
                  />
                </div>
                
                {/* Overlay to ensure readability and branding consistency */}
                <div className={`absolute inset-0 ${isSelected ? 'bg-blue-600/5' : 'bg-slate-900/0'} group-hover:bg-transparent transition-colors`} />
                
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-2xl z-20"
                  >
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  </motion.div>
                )}
              </div>
            </div>

            <h3 className={`text-xl font-bold mb-2 transition-colors duration-500 ${
              isSelected ? "text-white" : "text-slate-900"
            }`}>
              {resume.title}
            </h3>

            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-6 transition-colors duration-500 ${
              isSelected ? "text-blue-100" : "text-slate-400"
            }`}>
              <Clock className="w-3.5 h-3.5" />
              Updated {format(new Date(resume.updated_at), "MMM d, yyyy")}
            </div>

            {/* Quick Stats */}
            <div className={`grid grid-cols-2 gap-4 pt-6 border-t border-dashed transition-colors duration-500 ${
              isSelected ? "border-white/20" : "border-slate-100"
            }`}>
              <div className="flex flex-col">
                <span className={`text-xs font-bold transition-colors duration-500 ${
                  isSelected ? "text-blue-200" : "text-slate-400"
                }`}>Skills</span>
                <span className={`text-lg font-black transition-colors duration-500 ${
                  isSelected ? "text-white" : "text-slate-900"
                }`}>{skillsCount}</span>
              </div>
              <div className="flex flex-col">
                <span className={`text-xs font-bold transition-colors duration-500 ${
                  isSelected ? "text-blue-200" : "text-slate-400"
                }`}>Experience</span>
                <span className={`text-lg font-black transition-colors duration-500 ${
                  isSelected ? "text-white" : "text-slate-900"
                }`}>{expCount}</span>
              </div>
            </div>

            {/* Selection Background Glow */}
            {!isSelected && (
              <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-blue-600/0 via-blue-600/0 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
