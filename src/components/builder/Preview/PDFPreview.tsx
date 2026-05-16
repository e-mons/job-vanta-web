"use client";

import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Font, Image } from '@react-pdf/renderer';
import { ResumeData } from '@/store/useResumeStore';

interface PDFPreviewProps {
  data: ResumeData;
  templateId?: string;
}

// Map template IDs to match the store and HTML version
const getStyles = (templateId: string) => {
  const baseStyles = {
    page: { padding: 40, fontSize: 10, color: '#334155', fontFamily: 'Helvetica' },
    section: { marginBottom: 15 },
    sectionTitle: { fontSize: 11, fontWeight: 'bold', borderBottom: 1, borderBottomColor: '#e2e8f0', paddingBottom: 3, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 1 },
    entry: { marginBottom: 10 },
    entryHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginBottom: 2 },
    entryTitle: { fontWeight: 'bold' as const, color: '#0f172a', fontSize: 11 },
    entrySubtitle: { color: '#64748b', fontSize: 10, fontWeight: 'bold' as const },
    bullet: { flexDirection: 'row' as const, marginBottom: 2, paddingLeft: 8 },
    bulletDot: { width: 10, fontSize: 10 },
    bulletText: { flex: 1, fontSize: 9.5, color: '#475569' },
  };

  switch (templateId) {
    case 'executive':
    case 'elegant':
      return StyleSheet.create({
        ...baseStyles,
        page: { ...baseStyles.page, fontFamily: 'Times-Roman', padding: 50 },
        header: { marginBottom: 25, textAlign: 'center', borderBottom: 2, borderBottomColor: '#b45309', paddingBottom: 15 },
        name: { fontSize: 28, fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase' },
        contact: { flexDirection: 'row', justifyContent: 'center', gap: 12, color: '#b45309', marginTop: 8, fontSize: 9, fontWeight: 'bold' },
        sectionTitle: { ...baseStyles.sectionTitle, color: '#b45309', borderBottomColor: '#b45309', fontSize: 12 },
      });
    case 'creative':
    case 'bold':
      return StyleSheet.create({
        ...baseStyles,
        page: { ...baseStyles.page, padding: 0, flexDirection: 'row' },
        sidebar: { width: '30%', backgroundColor: '#1e1b4b', color: '#fff', padding: 30 },
        main: { width: '70%', padding: 40, backgroundColor: '#fff' },
        name: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20, textTransform: 'uppercase' },
        sidebarSection: { marginBottom: 25 },
        sidebarTitle: { fontSize: 10, fontWeight: 'bold', color: '#818cf8', borderBottom: 1, borderBottomColor: '#312e81', paddingBottom: 5, marginBottom: 10, textTransform: 'uppercase' },
        mainSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e1b4b', borderBottom: 2, borderBottomColor: '#4f46e5', paddingBottom: 5, marginBottom: 15 },
        contactText: { fontSize: 9, color: '#e2e8f0', marginBottom: 6 },
        skillBadge: { fontSize: 8, color: '#fff', backgroundColor: '#312e81', padding: '4 8', borderRadius: 4, marginBottom: 5 },
      });
    case 'minimalist':
    case 'clean':
      return StyleSheet.create({
        ...baseStyles,
        page: { ...baseStyles.page, padding: 60 },
        header: { marginBottom: 40 },
        name: { fontSize: 22, fontWeight: 'light', color: '#000', letterSpacing: 3, textTransform: 'uppercase' },
        contact: { flexDirection: 'row', gap: 20, color: '#94a3b8', fontSize: 8, marginTop: 15, textTransform: 'uppercase' },
        sectionTitle: { ...baseStyles.sectionTitle, fontSize: 10, color: '#000', borderBottom: 1, borderBottomColor: '#f1f5f9', letterSpacing: 4 },
      });
    case 'techpro':
      return StyleSheet.create({
        ...baseStyles,
        page: { ...baseStyles.page, fontFamily: 'Courier', backgroundColor: '#fafafa' },
        header: { marginBottom: 25, borderBottom: 1, borderBottomColor: '#2563eb', paddingBottom: 15 },
        name: { fontSize: 22, color: '#0f172a', marginBottom: 5 },
        contact: { flexDirection: 'row', gap: 15, color: '#2563eb', fontSize: 9 },
        sectionTitle: { ...baseStyles.sectionTitle, color: '#2563eb', borderBottom: 0, borderLeft: 4, borderLeftColor: '#2563eb', paddingLeft: 10 },
      });
    case 'professional_dark':
      return StyleSheet.create({
        ...baseStyles,
        header: { backgroundColor: '#0f172a', padding: 40, margin: -40, marginBottom: 40, color: '#fff' },
        name: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
        contact: { flexDirection: 'row', gap: 12, color: '#94a3b8', fontSize: 9 },
        sectionTitle: { ...baseStyles.sectionTitle, color: '#2563eb', borderLeft: 4, borderLeftColor: '#2563eb', paddingLeft: 10, borderBottom: 0 },
      });
    default: // modern, corporate
      return StyleSheet.create({
        ...baseStyles,
        header: { marginBottom: 20, borderBottom: 3, borderBottomColor: '#2563eb', paddingBottom: 15 },
        name: { fontSize: 28, fontWeight: 'bold', color: '#0f172a', marginBottom: 5 },
        contact: { flexDirection: 'row', gap: 15, color: '#64748b', fontSize: 9 },
        sectionTitle: { ...baseStyles.sectionTitle, color: '#2563eb' },
      });
  }
};

const ResumeDocument = ({ data, templateId = 'modern' }: { data: ResumeData; templateId?: string }) => {
  const styles = getStyles(templateId);
  const isCreative = templateId === 'creative' || templateId === 'bold';

  const Content = () => (
    <>
      {data.personalInfo.summary && (
        <View style={styles.section}>
          <Text style={isCreative ? (styles as any).mainSectionTitle : styles.sectionTitle}>
            {templateId === 'executive' ? 'Executive Profile' : 'Professional Summary'}
          </Text>
          <Text style={{ fontSize: 9.5, lineHeight: 1.5, color: '#475569', textAlign: 'justify' }}>{data.personalInfo.summary}</Text>
        </View>
      )}

      {data.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={isCreative ? (styles as any).mainSectionTitle : styles.sectionTitle}>Experience</Text>
          {data.experience.map((exp) => (
            <View key={exp.id} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{exp.role}</Text>
                <Text style={{ fontSize: 8.5, color: '#64748b', fontWeight: 'bold' }}>{exp.dates}</Text>
              </View>
              <Text style={styles.entrySubtitle}>{exp.company}</Text>
              {exp.bullets.map((bullet, i) => (
                <View key={i} style={styles.bullet}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      {data.projects && data.projects.length > 0 && (
        <View style={styles.section}>
          <Text style={isCreative ? (styles as any).mainSectionTitle : styles.sectionTitle}>Key Projects</Text>
          {data.projects.map((proj) => (
            <View key={proj.id} style={styles.entry}>
              <Text style={styles.entryTitle}>{proj.name}</Text>
              <Text style={{ fontSize: 9, color: '#64748b', fontStyle: 'italic', marginBottom: 3 }}>{proj.description}</Text>
              <Text style={{ fontSize: 8, color: '#2563eb' }}>Tools: {proj.technologies.join(', ')}</Text>
            </View>
          ))}
        </View>
      )}

      {data.education.length > 0 && (
        <View style={styles.section}>
          <Text style={isCreative ? (styles as any).mainSectionTitle : styles.sectionTitle}>Education</Text>
          {data.education.map((edu) => (
            <View key={edu.id} style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{edu.degree}</Text>
                <Text style={{ fontSize: 8.5, color: '#64748b' }}>{edu.year}</Text>
              </View>
              <Text style={styles.entrySubtitle}>{edu.school}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );

  if (isCreative) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={(styles as any).sidebar}>
            {data.personalInfo.photo && (
              <Image 
                src={data.personalInfo.photo} 
                style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 20, alignSelf: 'center' as const, objectFit: 'cover', border: '2px solid white' }} 
              />
            )}
            <Text style={(styles as any).name}>{data.personalInfo.fullName || 'Your Name'}</Text>
            
            <View style={(styles as any).sidebarSection}>
              <Text style={(styles as any).sidebarTitle}>Contact</Text>
              <Text style={(styles as any).contactText}>{data.personalInfo.email}</Text>
              {data.personalInfo.phone && <Text style={(styles as any).contactText}>{data.personalInfo.phone}</Text>}
              {data.personalInfo.location && <Text style={(styles as any).contactText}>{data.personalInfo.location}</Text>}
            </View>

            {data.skills.length > 0 && (
              <View style={(styles as any).sidebarSection}>
                <Text style={(styles as any).sidebarTitle}>Expertise</Text>
                {data.skills.map((skill, i) => (
                  <Text key={i} style={(styles as any).contactText}>• {skill}</Text>
                ))}
              </View>
            )}

            {data.languages?.length > 0 && (
              <View style={(styles as any).sidebarSection}>
                <Text style={(styles as any).sidebarTitle}>Languages</Text>
                {data.languages.map((lang) => (
                  <Text key={lang.id} style={(styles as any).contactText}>{lang.name} ({lang.fluency})</Text>
                ))}
              </View>
            )}
          </View>

          <View style={(styles as any).main}>
            <Content />
          </View>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[(styles as any).header, data.personalInfo.photo ? { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const } : {}]}>
          <View>
            <Text style={(styles as any).name}>{data.personalInfo.fullName || 'Your Name'}</Text>
            <View style={(styles as any).contact}>
              <Text>{data.personalInfo.email}</Text>
              {data.personalInfo.phone && <Text>• {data.personalInfo.phone}</Text>}
              {data.personalInfo.location && <Text>• {data.personalInfo.location}</Text>}
            </View>
          </View>
          {data.personalInfo.photo && (
            <Image 
              src={data.personalInfo.photo} 
              style={{ width: 60, height: 60, borderRadius: 30, objectFit: 'cover' }} 
            />
          )}
        </View>

        <Content />

        {!isCreative && data.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills & Competencies</Text>
            <Text style={{ fontSize: 9, color: '#475569', lineHeight: 1.6 }}>{data.skills.join('  •  ')}</Text>
          </View>
        )}

        {!isCreative && data.languages?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={{ fontSize: 9, color: '#475569' }}>
              {data.languages.map(l => `${l.name} (${l.fluency})`).join('  |  ')}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default function PDFPreview({ data, templateId }: PDFPreviewProps) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl bg-white">
      <PDFViewer className="w-full h-full" showToolbar={false}>
        <ResumeDocument data={data} templateId={templateId} />
      </PDFViewer>
    </div>
  );
}
