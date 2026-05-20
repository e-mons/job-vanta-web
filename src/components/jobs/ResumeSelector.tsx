"use client";

import { motion } from "framer-motion";
import { UserResume } from "@/store/useResumeStore";
import { CheckCircle2, Clock, Sparkles } from "lucide-react";
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

        console.log(`[ResumeSelector] Card ${resume.id}: title=${resume.title}, isSelected=${isSelected}, selectedId=${selectedId}`);

        return (
          <motion.div
            key={resume.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: isSelected ? 1.02 : 1
            }}
            whileHover={{ scale: isSelected ? 1.03 : 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={() => {
              console.log(`[ResumeSelector] Clicked card: ${resume.id}`);
              onSelect(resume);
            }}
            className={`group relative cursor-pointer p-8 rounded-[40px] border-2 transition-all duration-300 ${
              isSelected
                ? "bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 border-blue-600 shadow-[0_20px_50px_-10px_rgba(37,99,235,0.15)] ring-2 ring-blue-600/20"
                : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"
            }`}
          >
            {/* COMPULSORY SELECT BADGE */}
            {isSelected && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-6 left-6 z-30 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black tracking-wider uppercase shadow-md shadow-blue-600/20 pointer-events-none"
              >
                <Sparkles className="w-3 h-3 text-blue-100 animate-pulse" />
                <span>Selected</span>
              </motion.div>
            )}

            {/* Realistic Resume Preview Icon */}
            <div className="mb-8 pointer-events-none">
              <div className={`aspect-[1/1.41] w-full rounded-2xl border-2 overflow-hidden relative transition-all duration-300 shadow-lg group-hover:scale-[1.04] group-hover:shadow-2xl ${
                isSelected 
                  ? "border-blue-500 ring-8 ring-blue-500/10 shadow-blue-500/10" 
                  : "bg-white border-slate-200 shadow-slate-200/40"
              }`}>
                {/* Scaled HTML Preview - Calibrated to fit card width */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 origin-top scale-[0.38] md:scale-[0.42] w-[210mm] h-[297mm] pointer-events-none transition-transform duration-300 group-hover:scale-[0.40] md:group-hover:scale-[0.44]">
                  <HTMLPreview 
                    data={resume.content} 
                    templateId={resume.template_id || 'modern'} 
                  />
                </div>
                
                {/* Overlay to ensure readability and branding consistency */}
                <div className={`absolute inset-0 ${isSelected ? 'bg-blue-600/5' : 'bg-slate-900/0'} group-hover:bg-transparent transition-colors`} />
                
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 z-20"
                  >
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </motion.div>
                )}
              </div>
            </div>

            <div className="pointer-events-none">
              <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${
                isSelected ? "text-blue-600 font-black" : "text-slate-900 group-hover:text-blue-600"
              }`}>
                {resume.title}
              </h3>

              <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-6 transition-colors duration-300 ${
                isSelected ? "text-blue-500/80" : "text-slate-400"
              }`}>
                <Clock className="w-3.5 h-3.5" />
                Updated {format(new Date(resume.updated_at), "MMM d, yyyy")}
              </div>

              {/* Quick Stats */}
              <div className={`grid grid-cols-2 gap-4 pt-6 border-t border-dashed transition-colors duration-300 ${
                isSelected ? "border-blue-200/60" : "border-slate-100"
              }`}>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400">Skills</span>
                  <span className={`text-lg font-black transition-colors duration-300 ${
                    isSelected ? "text-blue-600" : "text-slate-900"
                  }`}>{skillsCount}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400">Experience</span>
                  <span className={`text-lg font-black transition-colors duration-300 ${
                    isSelected ? "text-blue-600" : "text-slate-900"
                  }`}>{expCount}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
