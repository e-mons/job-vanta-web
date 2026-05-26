import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import React from "react";
import { ResumeDocument } from "@/components/builder/Preview/ResumeDocument";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const resumeId = searchParams.get('id');
    const templateId = searchParams.get('templateId') || 'modern';

    if (!resumeId) {
      return NextResponse.json({ error: "No resume ID provided" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: resume, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();

    if (error || !resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const stream = await renderToStream(
      React.createElement(ResumeDocument, { data: resume.content, templateId }) as React.ReactElement<any>
    );

    // Convert NodeJS Readable stream to Web ReadableStream
    const readable = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      }
    });

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${resume.title || 'Resume'}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF Export error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
