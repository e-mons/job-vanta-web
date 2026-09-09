"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserResume } from "@/store/useResumeStore";
import { CheckCircle2, Clock, Sparkles, Eye, Edit3 } from "lucide-react";
import { format } from "date-fns";
import HTMLPreview from "@/components/builder/Preview/HTMLPreview";

interface ResumeSelectorProps {
  resumes: UserResume[];
  onSelect: (resume: UserResume) => void;
  selectedId?: string | null;
}

export default function ResumeSelector({ resumes, onSelect, selectedId }: ResumeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {resumes.map((resume) => {
        const isSelected = selectedId === resume.id;
        const skillsCount = resume.content.skills?.length || 0;
        const expCount = resume.content.experience?.length || 0;

        return (
          <motion.div
            key={resume.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: isSelected ? 1.01 : 1
            }}
            whileHover={{ scale: isSelected ? 1.015 : 1.025 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={() => onSelect(resume)}
            className={`group relative cursor-pointer p-5 sm:p-6 rounded-[28px] border-2 transition-all duration-300 flex flex-col justify-between ${
              isSelected
                ? "bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/40 border-blue-600 shadow-[0_15px_35px_-10px_rgba(37,99,235,0.18)] ring-2 ring-blue-600/20"
                : "bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-200/50"
            }`}
          >
            {/* Top Selection Status Badge */}
            {isSelected && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-4 left-4 z-30 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black tracking-wider uppercase shadow-md shadow-blue-600/25 pointer-events-none"
              >
                <Sparkles className="w-3 h-3 text-blue-100 animate-pulse" />
                <span>Selected</span>
              </motion.div>
            )}

            {/* Checkmark in top-right when selected */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30 z-30 pointer-events-none"
              >
                <CheckCircle2 className="w-5 h-5 text-white" />
              </motion.div>
            )}

            {/* Resume Preview Window (Bounded height with realistic document peek) */}
            <div className="mb-5 pointer-events-none">
              <div className={`h-52 sm:h-56 w-full rounded-2xl border overflow-hidden relative transition-all duration-300 shadow-sm ${
                isSelected 
                  ? "border-blue-400 bg-white ring-4 ring-blue-500/10 shadow-blue-500/10" 
                  : "bg-slate-50 border-slate-200/90 group-hover:border-blue-200"
              }`}>
                {/* Scaled HTML Preview calibrated for 2-column card width */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 origin-top scale-[0.42] sm:scale-[0.45] w-[210mm] h-[297mm] pointer-events-none transition-transform duration-300 group-hover:scale-[0.44] sm:group-hover:scale-[0.47]">
                  <HTMLPreview 
                    data={resume.content} 
                    templateId={resume.template_id || 'modern'} 
                  />
                </div>
                
                {/* Subtle bottom fade gradient */}
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Resume Card Content */}
            <div className="space-y-3">
              <div>
                <h3 className={`text-base sm:text-lg font-black tracking-tight leading-snug line-clamp-1 transition-colors duration-200 ${
                  isSelected ? "text-blue-600" : "text-slate-900 group-hover:text-blue-600"
                }`}>
                  {resume.title || "My Professional Resume"}
                </h3>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Updated {format(new Date(resume.updated_at), "MMM d, yyyy")}</span>
                </div>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-2 pt-1">
                <div className={`flex-1 flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                  isSelected 
                    ? "bg-blue-50/70 border-blue-200/80 text-blue-800" 
                    : "bg-slate-50 border-slate-200/70 text-slate-700"
                }`}>
                  <span className="text-slate-500 font-medium text-[11px]">Skills</span>
                  <span className="font-black text-slate-900">{skillsCount}</span>
                </div>

                <div className={`flex-1 flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                  isSelected 
                    ? "bg-blue-50/70 border-blue-200/80 text-blue-800" 
                    : "bg-slate-50 border-slate-200/70 text-slate-700"
                }`}>
                  <span className="text-slate-500 font-medium text-[11px]">Experience</span>
                  <span className="font-black text-slate-900">{expCount} roles</span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${
                  isSelected ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-blue-600 animate-pulse" : "bg-slate-300"}`} />
                  {isSelected ? "Active for search" : "Click to select"}
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/builder/edit?id=${resume.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Link>
                  <Link
                    href={`/resumes/${resume.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
