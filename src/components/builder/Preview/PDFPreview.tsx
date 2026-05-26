"use client";

import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { ResumeData } from '@/store/useResumeStore';
import { ResumeDocument } from './ResumeDocument';

interface PDFPreviewProps {
  data: ResumeData;
  templateId?: string;
}

export default function PDFPreview({ data, templateId }: PDFPreviewProps) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl bg-white">
      <PDFViewer className="w-full h-full" showToolbar={false}>
        <ResumeDocument data={data} templateId={templateId} />
      </PDFViewer>
    </div>
  );
}
