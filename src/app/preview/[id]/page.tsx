import React from 'react';
import { createAdminClient } from '@/utils/supabase/admin';
import HTMLPreview from '@/components/builder/Preview/HTMLPreview';

export default async function PreviewPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ templateId?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const supabase = createAdminClient();
  const { data: resume, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (error || !resume) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-500 font-medium">
        Preview not available or resume not found.
      </div>
    );
  }

  const templateId = resolvedSearchParams.templateId || resume.template_id || 'modern';

  return (
    <div className="min-h-screen bg-transparent w-full p-0 m-0 overflow-y-auto overflow-x-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        body { background: transparent !important; margin: 0; padding: 0; overflow-y: auto; overflow-x: hidden; }
        ::-webkit-scrollbar { display: none; }
      `}} />
      <HTMLPreview data={resume.content} templateId={templateId} autoScale={true} />
    </div>
  );
}
