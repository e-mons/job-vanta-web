"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Mic, 
  Square, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Keyboard, 
  Send, 
  ShieldCheck, 
  Clock, 
  TrendingUp,
  Flame,
  Volume2,
  AlertCircle
} from "lucide-react";
import type { QAQuestion, QAAnswer, QAPracticeFeedback, QAPracticeAttempt } from "@shared/types/qa";

interface QAPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QAQuestion;
  answer: QAAnswer | null;
  onPracticeSuccess?: (attempt: QAPracticeAttempt) => void;
}

export default function QAPracticeModal({
  isOpen,
  onClose,
  question,
  answer,
  onPracticeSuccess,
}: QAPracticeModalProps) {
  const [practiceMode, setPracticeMode] = useState<"voice" | "text">("voice");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [hideSuggestedAnswer, setHideSuggestedAnswer] = useState(true);
  const [feedbackResult, setFeedbackResult] = useState<QAPracticeFeedback | null>(null);
  const [transcriptResult, setTranscriptResult] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  if (!isOpen) return null;

  const startRecording = async () => {
    setMicError(null);
    setFeedbackResult(null);
    setTranscriptResult(null);
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/ogg";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          await submitAudioPractice(audioBlob);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("[Mic Access Error]:", err);
      setMicError("Microphone access is unavailable or was denied. You can practice by typing below.");
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const submitAudioPractice = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("questionId", question.id);
      formData.append("audio", blob, "practice_answer.webm");
      formData.append("durationSeconds", String(recordingSeconds || 45));

      const res = await fetch("/api/qa/practice/submit", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to process spoken practice");
      }

      const { data } = await res.json();
      setFeedbackResult(data.feedback);
      setTranscriptResult(data.transcript);
      if (onPracticeSuccess && data.attempt) {
        onPracticeSuccess(data.attempt);
      }
    } catch (err: any) {
      console.error("Audio submit error:", err);
      setMicError("We couldn't analyze that recording. Please try again or type your answer.");
    } finally {
      setIsProcessing(false);
    }
  };

  const submitTypedPractice = async () => {
    if (!typedAnswer.trim()) return;
    setIsProcessing(true);
    setMicError(null);
    setFeedbackResult(null);

    try {
      const res = await fetch("/api/qa/practice/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          typedText: typedAnswer.trim(),
          durationSeconds: 60,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to analyze typed practice");
      }

      const { data } = await res.json();
      setFeedbackResult(data.feedback);
      setTranscriptResult(data.transcript);
      if (onPracticeSuccess && data.attempt) {
        onPracticeSuccess(data.attempt);
      }
    } catch (err: any) {
      console.error("Typed submit error:", err);
      setMicError("Failed to analyze typed answer. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-[36px] shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Bar */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">Interview Practice</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Practise speaking your answer naturally with instant coaching
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Question Display */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                The Question You Are Answering:
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {question.question_text || (question as any).questionText}
              </h2>
            </div>

            {/* Answer Anchors / Suggested Answer Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Key Points to Anchor Your Story:
                </span>
                <button
                  type="button"
                  onClick={() => setHideSuggestedAnswer(!hideSuggestedAnswer)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                >
                  {hideSuggestedAnswer ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {hideSuggestedAnswer ? "Peek Full Answer" : "Hide Full Answer"}
                </button>
              </div>

              {/* Anchors Bullets */}
              {answer?.answer_anchors && answer.answer_anchors.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {answer.answer_anchors.map((anchor, idx) => (
                    <span key={idx} className="text-xs px-3 py-1 rounded-xl bg-white border border-slate-200/80 font-medium text-slate-700">
                      • {anchor.fact}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Speak naturally from your verified career experiences.</p>
              )}

              {!hideSuggestedAnswer && answer?.suggested_normal && (
                <div className="mt-3 p-3.5 rounded-xl bg-white border border-blue-100 text-xs text-slate-700 leading-relaxed font-medium">
                  {answer.suggested_normal}
                </div>
              )}
            </div>

            {/* Practice Mode Selector (Voice vs Text) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-slate-500">Practice Mode:</span>
              <div className="inline-flex p-1 rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setPracticeMode("voice")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                    practiceMode === "voice" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  Voice Practice
                </button>
                <button
                  type="button"
                  onClick={() => setPracticeMode("text")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                    practiceMode === "text" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
                  }`}
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  Type Answer
                </button>
              </div>
            </div>

            {/* Mic Error Banner if any */}
            {micError && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <span>{micError}</span>
              </div>
            )}

            {/* Interactive Recording Area */}
            {practiceMode === "voice" && !feedbackResult && !isProcessing && (
              <div className="p-8 rounded-3xl bg-slate-50/80 border border-slate-100 text-center space-y-5">
                <div className="relative inline-flex items-center justify-center">
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl transition-all hover:scale-105 active:scale-95 ${
                      isRecording
                        ? "bg-rose-600 shadow-rose-600/30 animate-pulse"
                        : "bg-blue-600 shadow-blue-600/30"
                    }`}
                  >
                    {isRecording ? <Square className="w-7 h-7" /> : <Mic className="w-8 h-8" />}
                  </button>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {isRecording ? "Recording your answer..." : "Ready when you are"}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {isRecording
                      ? `Elapsed: ${formatTime(recordingSeconds)} (Press stop when finished)`
                      : "Press the microphone, speak naturally, and Jobvanta will coach you."}
                  </p>
                </div>
              </div>
            )}

            {/* Interactive Typed Area */}
            {practiceMode === "text" && !feedbackResult && !isProcessing && (
              <div className="space-y-3">
                <textarea
                  rows={5}
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  placeholder="Type how you would naturally answer this question in an interview..."
                  className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={submitTypedPractice}
                    disabled={!typedAnswer.trim()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit for Coaching
                  </button>
                </div>
              </div>
            )}

            {/* Processing Loading Indicator */}
            {isProcessing && (
              <div className="p-12 rounded-3xl bg-slate-50 border border-slate-100 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <h4 className="font-bold text-slate-900 text-sm">Analysing your spoken response...</h4>
                <p className="text-xs text-slate-500 font-medium">
                  Checking story structure, role relevance, and Truth Lock consistency.
                </p>
              </div>
            )}

            {/* Feedback Results Card */}
            {feedbackResult && (
              <div className="space-y-5">
                {/* Overall Verdict Banner */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  feedbackResult.overallVerdict === "ready"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : feedbackResult.overallVerdict === "nearly_ready"
                    ? "bg-blue-50 border-blue-200 text-blue-950"
                    : "bg-amber-50 border-amber-200 text-amber-950"
                }`}>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="font-black text-sm block">
                        {feedbackResult.overallVerdict === "ready"
                          ? "Great Delivery — Answer Ready ✓"
                          : feedbackResult.overallVerdict === "nearly_ready"
                          ? "Solid Answer — 1 Quick Improvement"
                          : "Good Effort — Try One More Time"}
                      </span>
                      <span className="text-xs opacity-80">
                        {feedbackResult.durationFeedback}
                      </span>
                    </div>
                  </div>
                </div>

                {/* What You Actually Said (Transcript) */}
                {transcriptResult && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      What You Actually Said:
                    </span>
                    <p className="text-xs text-slate-700 italic font-medium leading-relaxed">
                      "{transcriptResult}"
                    </p>
                  </div>
                )}

                {/* Strengths & Improvements Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Strengths */}
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 block">
                      What Worked Well
                    </span>
                    <ul className="space-y-1.5 text-xs text-emerald-950 font-medium">
                      {feedbackResult.strengths.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-800 block">
                      Improve This Next
                    </span>
                    <ul className="space-y-1.5 text-xs text-blue-950 font-medium">
                      {feedbackResult.improvements.map((imp, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Truth Lock Spoken Warning if any */}
                {feedbackResult.truthCheck?.warning && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold block">Check statement consistency:</span>
                      <span>{feedbackResult.truthCheck.warning}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            {feedbackResult ? (
              <div className="flex items-center justify-between w-full">
                <button
                  type="button"
                  onClick={() => {
                    setFeedbackResult(null);
                    setTranscriptResult(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Try Again
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="flex justify-end w-full">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
