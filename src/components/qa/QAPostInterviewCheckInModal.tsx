"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, CheckCircle2, MessageSquare, Plus, Trash2, Send, Smile, Meh, Frown } from "lucide-react";

interface QAPostInterviewCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  stageId?: string | null;
  onComplete?: () => void;
}

export default function QAPostInterviewCheckInModal({
  isOpen,
  onClose,
  applicationId,
  stageId,
  onComplete,
}: QAPostInterviewCheckInModalProps) {
  const [feeling, setFeeling] = useState<"good" | "okay" | "difficult">("good");
  const [questions, setQuestions] = useState<{ text: string; difficulty: "handled_well" | "neutral" | "struggled" }[]>([
    { text: "", difficulty: "neutral" },
  ]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddQuestionRow = () => {
    setQuestions((prev) => [...prev, { text: "", difficulty: "neutral" }]);
  };

  const handleRemoveQuestionRow = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuestion = (index: number, text: string, difficulty: "handled_well" | "neutral" | "struggled") => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { text, difficulty } : q))
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Submit Interview Check-in
      await fetch("/api/qa/interview/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          stageId: stageId || null,
          feeling,
          notes: notes.trim() || null,
        }),
      });

      // 2. Submit actually asked questions
      const validQuestions = questions.filter((q) => q.text.trim().length > 0);
      for (const q of validQuestions) {
        await fetch("/api/qa/interview/actual-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId,
            stageId: stageId || null,
            questionText: q.text.trim(),
            difficultyRating: q.difficulty,
          }),
        });
      }

      if (onComplete) onComplete();
      onClose();
    } catch (err) {
      console.error("Interview check-in submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
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
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 to-indigo-50/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">Post-Interview Check-In</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Record what happened so Jobvanta can prepare you even better for the next round
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-white/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-left">
            {/* Question 1: How did it go? */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">
                1. Overall, how did the interview go?
              </label>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFeeling("good")}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    feeling === "good"
                      ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 text-emerald-950 font-bold"
                      : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 font-medium"
                  }`}
                >
                  <Smile className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                  <span className="text-xs block">Felt Good</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeeling("okay")}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    feeling === "okay"
                      ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 text-blue-950 font-bold"
                      : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 font-medium"
                  }`}
                >
                  <Meh className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                  <span className="text-xs block">Felt Okay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeeling("difficult")}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    feeling === "difficult"
                      ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 text-amber-950 font-bold"
                      : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 font-medium"
                  }`}
                >
                  <Frown className="w-6 h-6 mx-auto mb-1 text-amber-600" />
                  <span className="text-xs block">Difficult</span>
                </button>
              </div>
            </div>

            {/* Question 2: What did they actually ask you? */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">
                  2. What did they actually ask you?
                </label>
                <button
                  type="button"
                  onClick={handleAddQuestionRow}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Question
                </button>
              </div>

              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => handleUpdateQuestion(idx, e.target.value, q.difficulty)}
                        placeholder={`e.g. "How would you handle a delayed customer order?"`}
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestionRow(idx)}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        How it felt:
                      </span>
                      <div className="inline-flex p-0.5 rounded-lg bg-slate-200/70 text-[10px] font-bold text-slate-600">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestion(idx, q.text, "handled_well")}
                          className={`px-2 py-0.5 rounded-md ${
                            q.difficulty === "handled_well" ? "bg-emerald-600 text-white" : ""
                          }`}
                        >
                          Handled Well
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestion(idx, q.text, "neutral")}
                          className={`px-2 py-0.5 rounded-md ${
                            q.difficulty === "neutral" ? "bg-white text-slate-900 shadow-sm" : ""
                          }`}
                        >
                          Neutral
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestion(idx, q.text, "struggled")}
                          className={`px-2 py-0.5 rounded-md ${
                            q.difficulty === "struggled" ? "bg-rose-600 text-white" : ""
                          }`}
                        >
                          Struggled
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Question 3: Optional notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">
                3. Any notes or topics to prepare better next time?
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. They asked deep follow-ups on database scaling; practice those numbers next time."
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? "Saving..." : "Save & Learn"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
