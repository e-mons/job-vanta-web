"use client";

import { useState } from "react";

interface CompanyLogoProps {
  logoUrl?: string | null;
  companyName: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

function companyColor(name: string): string {
  const colors = [
    "from-blue-600 to-indigo-600",
    "from-indigo-600 to-violet-600",
    "from-emerald-600 to-teal-600",
    "from-orange-600 to-rose-600",
    "from-sky-600 to-blue-700",
    "from-amber-600 to-orange-600",
    "from-violet-600 to-purple-600",
    "from-cyan-600 to-blue-700",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function CompanyLogo({ 
  logoUrl, 
  companyName, 
  className = "", 
  size = "md" 
}: CompanyLogoProps) {
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: "w-12 h-12 rounded-xl text-base",
    md: "w-16 h-16 rounded-[22px] text-xl",
    lg: "w-32 h-32 rounded-[32px] text-4xl",
    xl: "w-32 h-32 rounded-[36px] text-4xl",
  };

  const initial = companyName ? companyName.charAt(0).toUpperCase() : "J";

  if (logoUrl && !error) {
    return (
      <div className={`bg-white border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm shrink-0 ${sizeClasses[size]} ${className}`}>
        <img 
          src={logoUrl} 
          alt={companyName} 
          className="w-full h-full object-contain p-2" 
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br ${companyColor(companyName || "Company")} flex items-center justify-center text-white font-black shadow-lg shrink-0 ${sizeClasses[size]} ${className}`}>
      {initial}
    </div>
  );
}
