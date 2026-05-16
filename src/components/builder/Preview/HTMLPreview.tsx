"use client";

import React from 'react';
import { ResumeData, useResumeStore } from '@/store/useResumeStore';
import { Mail, Phone, MapPin, Globe, Award, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface HTMLPreviewProps {
  data: ResumeData;
  templateId?: string;
  scale?: number;
}

export default function HTMLPreview({ data, templateId = 'modern', scale = 1 }: HTMLPreviewProps) {
  const renderTemplate = () => {
    switch (templateId) {
      case 'modern': return <ModernTemplate data={data} />;
      case 'executive': return <ExecutiveTemplate data={data} />;
      case 'creative': return <CreativeTemplate data={data} />;
      case 'minimalist': return <MinimalistTemplate data={data} />;
      case 'corporate': return <CorporateTemplate data={data} />;
      case 'techpro': return <TechProTemplate data={data} />;
      case 'elegant': return <ElegantTemplate data={data} />;
      case 'bold': return <BoldTemplate data={data} />;
      case 'clean': return <CleanTemplate data={data} />;
      case 'professional_dark': return <ProfessionalDarkTemplate data={data} />;
      default: return <ModernTemplate data={data} />;
    }
  };

  return (
    <div 
      className="bg-white shadow-2xl origin-top-left transition-transform duration-300 ease-out overflow-hidden"
      style={{ 
        width: '210mm', 
        minHeight: '297mm', 
        transform: `scale(${scale})`,
      }}
    >
      {renderTemplate()}
    </div>
  );
}

const PhotoUploadWrapper = ({ children }: { children: React.ReactNode }) => {
  const updatePersonalInfo = useResumeStore((state) => state.updatePersonalInfo);

  return (
    <label className="relative group cursor-pointer block w-full h-full">
      {children}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity rounded-full z-10 backdrop-blur-sm">
        <span className="text-white text-[10px] font-bold uppercase tracking-wider text-center px-2">Change<br/>Photo</span>
      </div>
      <input 
        type="file" 
        accept="image/png, image/jpeg, image/jpg" 
        className="hidden" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            if (file.size > 2 * 1024 * 1024) {
              toast.error("Image must be smaller than 2MB.");
              return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
              updatePersonalInfo({ photo: reader.result as string });
            };
            reader.readAsDataURL(file);
          }
        }}
      />
    </label>
  );
};

const ModernTemplate = ({ data }: { data: ResumeData }) => (
  <div className="flex min-h-[297mm] bg-white font-sans text-slate-800">
    <aside className="w-[70mm] bg-[#c1daeb] p-8 space-y-8">
      <div className="flex justify-center mb-6">
        <div className="w-40 h-40 rounded-full bg-slate-300 overflow-hidden flex items-center justify-center border-4 border-white shadow-lg relative">
          <PhotoUploadWrapper>
            {data.personalInfo.photo ? (
              <img src={data.personalInfo.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-400 font-bold text-lg flex items-center justify-center h-full w-full">PHOTO</span>
            )}
          </PhotoUploadWrapper>
        </div>
      </div>
      <section>
        <h2 className="text-base font-bold text-[#1f375b] uppercase tracking-widest mb-4 border-b border-[#1f375b]/20 pb-1">Contact Info</h2>
        <div className="space-y-3 text-sm text-slate-800 font-medium">
          {data.personalInfo.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0 text-[#1f375b]" /> {data.personalInfo.email}</div>}
          {data.personalInfo.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0 text-[#1f375b]" /> {data.personalInfo.phone}</div>}
          {data.personalInfo.website && <div className="flex items-center gap-2"><Globe className="w-4 h-4 shrink-0 text-[#1f375b]" /> {data.personalInfo.website}</div>}
          {data.personalInfo.location && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[#1f375b]" /> <span>{data.personalInfo.location}</span></div>}
        </div>
      </section>
      {data.skills.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-[#1f375b] uppercase tracking-widest mb-4 border-b border-[#1f375b]/20 pb-1">Skills</h2>
          <div className="text-sm font-bold text-slate-800 mb-1">Technical Skills:</div>
          <p className="text-sm text-slate-700 leading-relaxed mb-4">{data.skills.join(', ')}</p>
        </section>
      )}
    </aside>
    <main className="flex-1 p-10 pt-16">
      <header className="mb-10">
        <h1 className="text-5xl font-black text-slate-700 uppercase tracking-wide leading-tight mb-2">{data.personalInfo.fullName}</h1>
      </header>
      <div className="space-y-8">
        {data.experience.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#1f375b] uppercase tracking-widest border-b-2 border-[#1f375b] pb-2 mb-6">Professional Experience</h2>
            <div className="space-y-6">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-bold text-slate-900 uppercase">{exp.company}</h3>
                    <span className="text-sm font-bold text-slate-600 italic">{exp.dates}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-700 italic mb-2">{exp.role}</div>
                  <ul className="list-disc ml-5 space-y-1">
                    {exp.bullets.map((b, i) => <li key={i} className="text-sm text-slate-700">{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
        {data.education.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#1f375b] uppercase tracking-widest border-b-2 border-[#1f375b] pb-2 mb-6">Education</h2>
            <div className="space-y-4">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <h3 className="text-base font-bold text-slate-900">{edu.school}</h3>
                  <div className="text-sm text-slate-700">{edu.degree} | {edu.year}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  </div>
);

const ExecutiveTemplate = ({ data }: { data: ResumeData }) => (
  <div className="p-[20mm] text-slate-900 font-serif leading-relaxed bg-[#fbfbf9] min-h-[297mm]">
    <header className="text-center mb-8">
      <h1 className="text-5xl font-black text-[#0f2847] uppercase tracking-wide mb-4">{data.personalInfo.fullName}</h1>
      <div className="flex justify-center items-center flex-wrap gap-2 text-sm font-bold text-slate-800 mb-6">
         {data.personalInfo.location && <span>{data.personalInfo.location} | </span>}
         {data.personalInfo.phone && <span>{data.personalInfo.phone} | </span>}
         {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
      </div>
      <div className="h-1 bg-[#c6a365]" />
    </header>
    <div className="space-y-8">
      {data.personalInfo.summary && (
        <section>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-xl font-bold text-[#0f2847] uppercase tracking-widest">Executive Summary</h2>
            <div className="w-10 h-1.5 bg-[#4c72a8]" />
          </div>
          <p className="text-sm text-slate-800 leading-relaxed font-medium text-justify">{data.personalInfo.summary}</p>
        </section>
      )}
      {data.experience.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-[#0f2847] uppercase tracking-widest border-b border-[#c6a365] pb-1 mb-6">Professional Experience</h2>
          <div className="space-y-6">
            {data.experience.map(exp => (
              <div key={exp.id}>
                <div className="text-base font-bold text-slate-900 uppercase tracking-wide mb-2">{exp.role} | {exp.company} | {exp.dates}</div>
                <ul className="space-y-1.5 pl-4">
                  {exp.bullets.map((b, i) => (
                    <li key={i} className="text-sm text-slate-800 flex gap-3">
                      <span className="text-[#c6a365] mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#c6a365]" />
                      <span className="font-medium">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
      {data.education.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-[#0f2847] uppercase tracking-widest border-b border-[#c6a365] pb-1 mb-4">Education</h2>
          <ul className="space-y-1.5 pl-4">
            {data.education.map((edu, i) => (
              <li key={i} className="text-sm text-slate-800 flex gap-3">
                 <span className="text-[#c6a365] mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#c6a365]" />
                 <span className="font-bold">{edu.degree} | {edu.school} | {edu.year}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  </div>
);

const CreativeTemplate = ({ data }: { data: ResumeData }) => (
  <div className="flex min-h-[297mm] bg-white font-sans text-slate-800">
    <aside className="w-[75mm] bg-[#00427a] text-white p-8 space-y-8 pb-[50mm]">
      <div className="flex justify-center mb-4">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-slate-300 relative">
          <PhotoUploadWrapper>
            {data.personalInfo.photo ? (
              <img src={data.personalInfo.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">PHOTO</div>
            )}
          </PhotoUploadWrapper>
        </div>
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-black uppercase tracking-widest mb-1">{data.personalInfo.fullName}</h1>
      </div>
      <div className="space-y-3 text-xs text-blue-100 font-medium">
        {data.personalInfo.phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 shrink-0" /> {data.personalInfo.phone}</div>}
        {data.personalInfo.email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 shrink-0" /> {data.personalInfo.email}</div>}
        {data.personalInfo.location && <div className="flex items-start gap-3"><MapPin className="w-4 h-4 shrink-0 mt-0.5" /> <span>{data.personalInfo.location}</span></div>}
      </div>
      {data.personalInfo.summary && (
        <section>
          <div className="bg-[#003366] -mx-8 px-8 py-3 mb-4"><h2 className="text-lg font-bold uppercase tracking-widest">About Me</h2></div>
          <p className="text-xs text-blue-100 leading-relaxed text-justify">{data.personalInfo.summary}</p>
        </section>
      )}
      {data.skills.length > 0 && (
        <section>
          <div className="bg-[#003366] -mx-8 px-8 py-3 mb-4 mt-8"><h2 className="text-lg font-bold uppercase tracking-widest">Skills</h2></div>
          <div className="space-y-4">
            {data.skills.slice(0, 7).map((skill, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1"><span>{skill}</span><span>{95 - (i * 5)}%</span></div>
                <div className="h-1.5 w-full bg-[#003366] rounded-full overflow-hidden"><div className="h-full bg-[#41a2e1]" style={{ width: `${95 - (i * 5)}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      )}
    </aside>
    <main className="flex-1 p-10 space-y-10 relative">
      {data.experience.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-[#00427a] uppercase tracking-widest border-b border-[#00427a] pb-2 mb-6">Professional Experience</h2>
          <div className="relative border-l-2 border-[#00427a] ml-3 pl-6 space-y-8">
            {data.experience.map(exp => (
              <div key={exp.id} className="relative">
                <div className="absolute w-4 h-4 bg-[#00427a] rounded-full -left-[33px] top-1" />
                <h3 className="text-base font-bold text-slate-900">{exp.role}</h3>
                <div className="text-sm font-medium text-slate-600 mb-2">{exp.company} | {exp.dates}</div>
                <ul className="list-disc ml-5 space-y-1">
                   {exp.bullets.map((b, i) => <li key={i} className="text-sm text-slate-700">{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
      {data.education.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-[#00427a] uppercase tracking-widest border-b border-[#00427a] pb-2 mb-6 flex items-center gap-3">
             <GraduationCap className="w-6 h-6" /> Education
          </h2>
          <div className="relative border-l-2 border-[#00427a] ml-3 pl-6 space-y-6">
            {data.education.map(edu => (
              <div key={edu.id} className="relative flex justify-between items-start">
                <div className="absolute w-4 h-4 bg-[#00427a] rounded-full -left-[33px] top-1" />
                <div>
                   <h3 className="text-base font-bold text-slate-900">{edu.degree}</h3>
                   <div className="text-sm text-slate-600">{edu.school}</div>
                </div>
                <div className="text-sm font-medium text-slate-600">{edu.year}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  </div>
);

const MinimalistTemplate = ({ data }: { data: ResumeData }) => (
  <div className="p-[25mm] text-slate-900 font-sans leading-relaxed bg-white min-h-[297mm]">
    <header className="mb-12">
      <h1 className="text-4xl font-bold text-[#1f2937] mb-2">{data.personalInfo.fullName}</h1>
      <div className="w-full h-0.5 bg-[#3b82f6] mb-4" />
      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
         {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
         {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
         {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
         {data.personalInfo.website && <span>{data.personalInfo.website}</span>}
      </div>
    </header>
    <div className="space-y-10">
      {data.experience.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-[#1f2937] uppercase tracking-widest mb-6">Experience</h2>
          <div className="space-y-6">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className="text-base font-bold text-slate-900">{exp.role}</h3>
                  <span className="text-sm text-slate-600">{exp.dates}</span>
                </div>
                <div className="text-sm font-medium text-slate-700 mb-2">{exp.company}</div>
                <ul className="list-disc ml-5 space-y-1 text-sm text-slate-700">
                  {exp.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
      {data.education.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-[#1f2937] uppercase tracking-widest mb-6">Education</h2>
          <div className="space-y-4">
            {data.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{edu.school}</h3>
                  <div className="text-sm text-slate-700">{edu.degree}</div>
                </div>
                <span className="text-sm text-slate-600">{edu.year}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      {data.skills.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-[#1f2937] uppercase tracking-widest mb-6">Skills</h2>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
             CATEGORIES: <span className="font-normal">{data.skills.join(', ')}</span>
          </p>
        </section>
      )}
    </div>
  </div>
);

const CorporateTemplate = ({ data }: { data: ResumeData }) => (
  <div className="flex min-h-[297mm] bg-white font-sans text-slate-800">
    <aside className="w-[75mm] bg-[#f1f5f9] p-8 space-y-8 pt-40">
      <section>
        <h2 className="text-base font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 mb-4">Contact Information</h2>
        <div className="space-y-3 text-sm text-slate-700 font-medium">
          <div><div className="font-bold text-slate-900">Email</div>{data.personalInfo.email}</div>
          <div><div className="font-bold text-slate-900">Phone</div>{data.personalInfo.phone}</div>
          <div><div className="font-bold text-slate-900">LinkedIn</div>{data.personalInfo.website}</div>
        </div>
      </section>
      {data.skills.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-slate-900 uppercase border-b border-slate-300 pb-1 mb-4">Skills</h2>
          <ul className="list-disc ml-5 space-y-1">
             {data.skills.map((skill, i) => <li key={i} className="text-sm text-slate-700">{skill}</li>)}
          </ul>
        </section>
      )}
    </aside>
    <main className="flex-1">
      <header className="bg-[#1e293b] text-white p-10 py-12 mb-8">
        <h1 className="text-5xl font-serif text-white tracking-wide mb-2">{data.personalInfo.fullName}</h1>
        {data.personalInfo.summary && <p className="text-sm text-slate-300 mt-4 leading-relaxed">{data.personalInfo.summary}</p>}
      </header>
      <div className="p-10 pt-0 space-y-8">
        {data.experience.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#1e293b] uppercase tracking-widest border-b border-[#1e293b] pb-1 mb-6">Professional Experience</h2>
            <div className="space-y-6">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="text-base font-bold text-slate-900">{exp.company}</div>
                  <div className="text-sm font-bold text-slate-700 italic mb-2">{exp.role} | {exp.dates}</div>
                  <ul className="list-disc ml-5 space-y-1">
                    {exp.bullets.map((b, i) => <li key={i} className="text-sm text-slate-700">{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
        {data.education.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#1e293b] uppercase tracking-widest border-b border-[#1e293b] pb-1 mb-6">Education</h2>
            <div className="space-y-4">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <div className="text-base font-bold text-slate-900">{edu.degree}</div>
                  <div className="text-sm text-slate-700 italic">{edu.school} | {edu.year}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  </div>
);

const TechProTemplate = ({ data }: { data: ResumeData }) => (
  <div className="flex min-h-[297mm] bg-white font-sans text-slate-800">
    <aside className="w-[75mm] bg-[#0096a6] text-white p-8 space-y-8">
      <div className="flex justify-center mb-6">
        <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center border-4 border-white">
           <span className="text-[#0096a6] font-black text-4xl">DP</span>
        </div>
      </div>
      <h1 className="text-4xl font-black uppercase text-center leading-tight mb-8">
         {data.personalInfo.fullName.replace(' ', '\n')}
      </h1>
      <div className="space-y-3 text-xs font-medium">
        {data.personalInfo.email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 shrink-0" /> {data.personalInfo.email}</div>}
        {data.personalInfo.phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 shrink-0" /> {data.personalInfo.phone}</div>}
        {data.personalInfo.website && <div className="flex items-center gap-3"><Globe className="w-4 h-4 shrink-0" /> {data.personalInfo.website}</div>}
        {data.personalInfo.location && <div className="flex items-start gap-3"><MapPin className="w-4 h-4 shrink-0 mt-0.5" /> <span>{data.personalInfo.location}</span></div>}
      </div>
      {data.skills.length > 0 && (
        <section>
          <h2 className="text-lg font-bold uppercase tracking-widest mb-4 border-b border-white/20 pb-1 mt-8">Skills</h2>
          <div className="space-y-4">
            {data.skills.slice(0, 7).map((skill, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1"><span>{skill}</span><span>{95 - (i * 5)}%</span></div>
                <div className="h-1.5 w-full bg-[#007a87] rounded-full overflow-hidden"><div className="h-full bg-white" style={{ width: `${95 - (i * 5)}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      )}
    </aside>
    <main className="flex-1 p-10 space-y-10">
      <header className="mb-10 border-b-2 border-slate-100 pb-8">
        <h1 className="text-5xl font-black text-slate-800 uppercase tracking-tighter mb-2">{data.personalInfo.fullName}</h1>
      </header>
      {data.experience.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest mb-6">Professional Experience</h2>
          <div className="space-y-6">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <h3 className="text-base font-bold text-slate-900 uppercase">{exp.company}</h3>
                <div className="text-sm font-bold text-slate-900 mb-2">{exp.role} ({exp.dates})</div>
                <ul className="list-disc ml-5 space-y-1 text-sm text-slate-700">
                  {exp.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
      {data.education.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest mb-6">Education</h2>
          <div className="space-y-4">
            {data.education.map((edu) => (
              <div key={edu.id}>
                <h3 className="text-base font-bold text-slate-900 uppercase">{edu.school}</h3>
                <div className="text-sm text-slate-700">{edu.degree} ({edu.year})</div>
              </div>
            ))}
          </div>
        </section>
      )}
      {data.skills.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest mb-6">Technical Skills</h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded">{skill}</span>
            ))}
          </div>
        </section>
      )}
    </main>
  </div>
);

const ElegantTemplate = ({ data }: { data: ResumeData }) => (
  <div className="p-[15mm] min-h-[297mm] bg-[#fdfcf8]">
    <div className="border-[3px] border-[#5a1f24] p-10 h-full min-h-[267mm]">
      <header className="text-center mb-8 border-b-2 border-[#5a1f24] pb-6">
        <h1 className="text-4xl font-serif text-slate-900 uppercase tracking-widest mb-4">{data.personalInfo.fullName}</h1>
        <div className="text-sm font-serif text-slate-700">
           {data.personalInfo.location && <span>{data.personalInfo.location} | </span>}
           {data.personalInfo.phone && <span>{data.personalInfo.phone} | </span>}
           {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
        </div>
      </header>
      <div className="space-y-8">
        {data.personalInfo.summary && (
          <section>
            <h2 className="text-center text-lg font-serif font-bold text-[#5a1f24] uppercase tracking-widest mb-4 border-y border-[#5a1f24] py-1">Profile Summary</h2>
            <p className="text-sm text-slate-800 leading-relaxed text-justify">{data.personalInfo.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section>
            <h2 className="text-center text-lg font-serif font-bold text-[#5a1f24] uppercase tracking-widest mb-6 border-y border-[#5a1f24] py-1">Professional Experience</h2>
            <div className="space-y-6">
              {data.experience.map(exp => (
                <div key={exp.id}>
                  <div className="text-base font-bold text-slate-900 uppercase mb-2">
                    {exp.role} | <span className="font-normal text-slate-700">{exp.company} | {exp.dates}</span>
                  </div>
                  <ul className="list-disc ml-5 space-y-1">
                    {exp.bullets.map((b, i) => <li key={i} className="text-sm text-slate-800">{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
        {data.education.length > 0 && (
          <section>
            <h2 className="text-center text-lg font-serif font-bold text-[#5a1f24] uppercase tracking-widest mb-6 border-y border-[#5a1f24] py-1">Education</h2>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id} className="text-sm font-bold text-slate-900">
                  {edu.degree} | <span className="font-normal text-slate-700">{edu.school}, {edu.year}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  </div>
);

const BoldTemplate = ({ data }: { data: ResumeData }) => (
  <div className="flex flex-col min-h-[297mm] bg-white font-sans text-slate-800">
    <header className="flex h-[35mm]">
      <div className="w-[10mm] bg-[#ff7b00] h-full" />
      <div className="flex-1 bg-[#2a2a2a] p-8 text-white flex flex-col justify-center">
         <h1 className="text-5xl font-black uppercase tracking-wide mb-2">{data.personalInfo.fullName}</h1>
         <div className="text-sm font-medium text-slate-300">
            Phone: {data.personalInfo.phone} | Email: {data.personalInfo.email}
         </div>
      </div>
    </header>
    <div className="flex flex-1">
      <aside className="w-[85mm] p-8 space-y-8 bg-slate-50 border-r border-slate-200">
        {data.skills.length > 0 && (
          <section>
            <h2 className="text-lg font-black text-[#ff7b00] uppercase mb-4">Core Skills</h2>
            <ul className="space-y-2">
              {data.skills.map((skill, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-[#ff7b00] shrink-0" />
                  {skill}
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
      <main className="flex-1 p-10 pt-8 space-y-8">
        {data.personalInfo.summary && (
          <section>
            <h2 className="text-xl font-black text-slate-900 uppercase mb-4">Career Highlights</h2>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">{data.personalInfo.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section>
            <h2 className="text-xl font-black text-slate-900 uppercase mb-6">Professional Experience</h2>
            <div className="space-y-6">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <h3 className="text-base font-black text-slate-900 uppercase">{exp.role}</h3>
                  <div className="text-sm font-medium text-slate-600 mb-2">{exp.company} | {exp.dates}</div>
                  <ul className="list-disc ml-5 space-y-1 text-sm text-slate-700">
                    {exp.bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
        {data.education.length > 0 && (
          <section>
            <h2 className="text-xl font-black text-slate-900 uppercase mb-6">Education</h2>
            <div className="space-y-4">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <h3 className="text-base font-black text-slate-900 uppercase">{edu.degree}</h3>
                  <div className="text-sm text-slate-700">{edu.school} | {edu.year}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  </div>
);

const CleanTemplate = ({ data }: { data: ResumeData }) => (
  <div className="p-[25mm] min-h-[297mm] bg-white font-sans text-slate-800">
    <header className="mb-10 border-b border-slate-200 pb-6">
      <h1 className="text-5xl font-light text-slate-900 tracking-wide mb-2">{data.personalInfo.fullName}</h1>
    </header>
    <div className="space-y-10">
      {data.personalInfo.summary && (
        <section>
          <h2 className="text-lg font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-3">
             <span className="w-3 h-3 rounded-full bg-[#7bae6a]" /> About Me
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">{data.personalInfo.summary}</p>
        </section>
      )}
      {data.experience.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
             <span className="w-3 h-3 rounded-full bg-[#7bae6a]" /> Experience
          </h2>
          <div className="space-y-6">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-base font-bold text-slate-900">{exp.role}</h3>
                  <span className="text-sm text-slate-600">{exp.dates}</span>
                </div>
                <div className="text-sm text-slate-700 mb-2">{exp.company}</div>
                <ul className="list-disc ml-5 space-y-1 text-sm text-slate-700">
                  {exp.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
      {data.skills.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
             <span className="w-3 h-3 rounded-full bg-[#7bae6a]" /> Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, i) => (
              <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-md border border-slate-200">{skill}</span>
            ))}
          </div>
        </section>
      )}
      {data.education.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
             <span className="w-3 h-3 rounded-full bg-[#7bae6a]" /> Education
          </h2>
          <div className="space-y-4">
            {data.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <h3 className="text-base font-bold text-slate-900">{edu.degree}</h3>
                <span className="text-sm text-slate-600">{edu.year}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  </div>
);

const ProfessionalDarkTemplate = ({ data }: { data: ResumeData }) => (
  <div className="flex flex-col min-h-[297mm] bg-white font-sans text-slate-800">
    <header className="bg-[#2a3b4c] text-white p-12 pb-10 flex gap-10 items-center">
      <div className="w-32 h-32 rounded-full border-4 border-[#50667c] bg-slate-300 shrink-0" />
      <div>
        <h1 className="text-4xl font-black uppercase tracking-wide mb-2">{data.personalInfo.fullName}</h1>
        <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-300 mt-4">
          {data.personalInfo.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0 text-[#50667c]" /> {data.personalInfo.phone}</div>}
          {data.personalInfo.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0 text-[#50667c]" /> {data.personalInfo.email}</div>}
        </div>
      </div>
    </header>
    <div className="flex flex-1">
      <aside className="w-[85mm] p-8 space-y-8 bg-slate-50 border-r border-slate-200">
        <section>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-4">Contact</h2>
          <div className="space-y-3 text-sm font-bold text-slate-700">
             {data.personalInfo.phone && <div>{data.personalInfo.phone}</div>}
             {data.personalInfo.email && <div>{data.personalInfo.email}</div>}
             {data.personalInfo.website && <div>{data.personalInfo.website}</div>}
             {data.personalInfo.location && <div>{data.personalInfo.location}</div>}
          </div>
        </section>
        {data.skills.length > 0 && (
          <section>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-4">Core Competencies</h2>
            <div className="flex flex-wrap gap-2">
               {data.skills.map((skill, i) => (
                 <span key={i} className="px-3 py-1 bg-[#50667c] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">{skill}</span>
               ))}
            </div>
          </section>
        )}
      </aside>
      <main className="flex-1 p-10 pt-8 space-y-8">
        {data.personalInfo.summary && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest mb-4">Professional Summary</h2>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">{data.personalInfo.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest mb-6">Work Experience</h2>
            <div className="space-y-6">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <h3 className="text-base font-bold text-slate-900 uppercase">{exp.company}</h3>
                  <div className="text-sm font-medium text-slate-600 mb-2 flex justify-between">
                     <span>{exp.role}</span>
                     <span>{exp.dates}</span>
                  </div>
                  <ul className="list-disc ml-5 space-y-1 text-sm text-slate-700">
                    {exp.bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
        {data.education.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest mb-6">Education</h2>
            <div className="space-y-4">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <h3 className="text-base font-bold text-slate-900">{edu.school}</h3>
                  <div className="text-sm text-slate-700">{edu.degree} | {edu.year}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  </div>
);
