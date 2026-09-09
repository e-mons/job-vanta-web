"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Sparkles, 
  Edit3, 
  Save, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  AlertCircle, 
  AlertTriangle, 
  Lightbulb, 
  Mic
} from "lucide-react";
import type { 
  QAQuestion, 
  QAAnswer, 
  QAClarification, 
  QAAnswerActiveVersion,
  RiskGroupType,
} from "@shared/types/qa";

interface QAQuestionCardProps {
  question: QAQuestion;
  answer: QAAnswer | null;
  pendingClarification?: QAClarification | null;
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onToggleReview: (questionId: string, isReviewed: boolean) => Promise<void>;
  onSubmitClarification: (clarificationId: string, responseValue: string) => Promise<void>;
  onUpdateAnswer: (answerId: string, userEditedText: string | null, activeVersion?: QAAnswerActiveVersion) => Promise<void>;
  riskGroup?: RiskGroupType;
  onStartPractice?: () => void;
  applicationId?: string;
  onOpenStoryBank?: () => void;
  onSaveAsStory?: (answerText: string) => void;
}

export default function QAQuestionCard({
  question,
  answer,
  pendingClarification,
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  onToggleReview,
  onSubmitClarification,
  onUpdateAnswer,
  riskGroup = "prepare",
  onStartPractice,
  applicationId = "",
  onOpenStoryBank,
  onSaveAsStory,
}: QAQuestionCardProps) {
  const [selectedVersion, setSelectedVersion] = useState<QAAnswerActiveVersion>(
    answer?.active_version || "normal"
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(
    answer?.user_edited_answer || answer?.suggested_normal || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingClarification, setIsSubmittingClarification] = useState(false);
  const [clarificationInput, setClarificationInput] = useState("");
  const [copied, setCopied] = useState(false);

  // Sync state if question or answer changes
  useEffect(() => {
    setSelectedVersion(answer?.active_version || "normal");
    setEditedText(answer?.user_edited_answer || answer?.suggested_normal || "");
    setIsEditing(false);
    setCopied(false);
  }, [question.id, answer?.id, answer?.active_version, answer?.user_edited_answer, answer?.suggested_normal]);

  // Active answer text based on selected variation
  const getDisplayAnswer = (): string => {
    if (answer?.user_edited_answer && selectedVersion === "custom") {
      return answer.user_edited_answer;
    }
    if (selectedVersion === "quick" && answer?.suggested_quick) {
      return answer.suggested_quick;
    }
    if (selectedVersion === "detailed" && answer?.suggested_detailed) {
      return answer.suggested_detailed;
    }
    return answer?.suggested_normal || answer?.suggested_quick || "No suggested answer available yet.";
  };

  const truthStatus = answer?.truth_status || "verified";

  const handleCopy = async () => {
    const text = getDisplayAnswer();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSaveEdit = async () => {
    if (!answer?.id) return;
    setIsSaving(true);
    try {
      await onUpdateAnswer(answer.id, editedText, "custom");
      setSelectedVersion("custom");
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToAI = async () => {
    if (!answer?.id) return;
    setIsSaving(true);
    try {
      await onUpdateAnswer(answer.id, null, "normal");
      setSelectedVersion("normal");
      setEditedText(answer.suggested_normal || "");
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVersionChange = async (ver: QAAnswerActiveVersion) => {
    setSelectedVersion(ver);
    if (answer?.id) {
      await onUpdateAnswer(answer.id, null, ver);
    }
  };

  const handleClarificationClick = async (val: string) => {
    if (!pendingClarification?.id) return;
    setIsSubmittingClarification(true);
    try {
      await onSubmitClarification(pendingClarification.id, val);
    } finally {
      setIsSubmittingClarification(false);
    }
  };

  const isLastQuestion = currentIndex >= totalQuestions - 1;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-sm space-y-6">
      {/* 1. Header: Question Meta & Risk Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs font-bold text-slate-600 capitalize">
            {question.category.replace(/_/g, " ")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {riskGroup === "strong" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Strong Area
            </span>
          )}
          {riskGroup === "prepare" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/80">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              Prepare Carefully
            </span>
          )}
          {riskGroup === "important" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200/80">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              High Priority
            </span>
          )}
        </div>
      </div>

      {/* 2. Main Question & Context Hint */}
      <div className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
          {question.question_text || (question as any).questionText}
        </h2>

        {/* Subtle 1-sentence Interviewer Focus */}
        {question.what_employer_means && (
          <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-600 bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100">
            <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <strong className="text-slate-800 font-bold">Interviewer Focus: </strong>
              <span>{question.what_employer_means}</span>
            </div>
          </div>
        )}

        {/* High priority reminder if applicable */}
        {riskGroup === "important" && question.risk_reason && (
          <div className="flex items-start gap-2 text-xs text-rose-800 bg-rose-50/60 rounded-2xl p-3 border border-rose-100">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <strong className="font-bold">Why prepare this: </strong>
              <span>{question.risk_reason}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Inline Clarification (Only if Gemini flagged missing skill/fact) */}
      {pendingClarification && truthStatus === "needs_clarification" && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200/90 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Quick Clarification Needed</span>
          </div>

          <p className="text-xs sm:text-sm text-amber-950 font-semibold leading-relaxed">
            {pendingClarification.question_prompt || `Do you have experience with ${pendingClarification.topic}?`}
          </p>

          {pendingClarification.clarification_type === "yes_no_little" ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isSubmittingClarification}
                onClick={() => handleClarificationClick("yes")}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                Yes, I have experience
              </button>
              <button
                type="button"
                disabled={isSubmittingClarification}
                onClick={() => handleClarificationClick("a_little")}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                A little / Basic exposure
              </button>
              <button
                type="button"
                disabled={isSubmittingClarification}
                onClick={() => handleClarificationClick("no")}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                No direct experience
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-1 max-w-sm">
              <input
                type="text"
                value={clarificationInput}
                onChange={(e) => setClarificationInput(e.target.value)}
                placeholder="Enter details..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                disabled={isSubmittingClarification || !clarificationInput.trim()}
                onClick={() => handleClarificationClick(clarificationInput.trim())}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50"
              >
                Save
              </button>
            </div>
          )}

          <p className="text-[11px] text-amber-700 font-medium">
            Your answer will immediately adapt to your real background without inflating claims.
          </p>
        </div>
      )}

      {/* 4. Your Recommended Answer Card */}
      <div className="space-y-3">
        {/* Answer Bar: Truth Status + Quick/Full Toggle + Copy / Edit */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
              Recommended Answer
            </span>

            {/* Truth Status Indicator */}
            {truthStatus === "verified" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Check className="w-3 h-3 text-emerald-600" />
                Verified with your experience
              </span>
            )}
            {truthStatus === "confirmed_by_user" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <Check className="w-3 h-3 text-blue-600" />
                Confirmed by you
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Quick vs Detailed Toggle */}
            {!isEditing && (
              <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => handleVersionChange("quick")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    selectedVersion === "quick" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
                  }`}
                >
                  Quick
                </button>
                <button
                  type="button"
                  onClick={() => handleVersionChange("normal")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    selectedVersion === "normal" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
                  }`}
                >
                  Full
                </button>
                {answer?.user_edited_answer && (
                  <button
                    type="button"
                    onClick={() => handleVersionChange("custom")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      selectedVersion === "custom" ? "bg-white text-blue-600 shadow-xs" : "hover:text-blue-600"
                    }`}
                  >
                    Custom
                  </button>
                )}
              </div>
            )}

            {/* Copy Button */}
            {!isEditing && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Copy answer to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            )}

            {/* Edit Button */}
            {!isEditing && (
              <button
                type="button"
                onClick={() => {
                  setEditedText(getDisplayAnswer());
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>

        {/* Answer Content / Textarea */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-slate-800 text-sm sm:text-base leading-relaxed font-normal">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                rows={6}
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-blue-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-normal leading-relaxed"
                placeholder="Edit your personalized answer..."
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetToAI}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 font-bold transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset to Original AI
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSaving || !editedText.trim()}
                    className="inline-flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-slate-800 font-normal">
              {getDisplayAnswer()}
            </p>
          )}
        </div>

        {/* Key Points to Remember (Answer Anchors) */}
        {answer?.answer_anchors && answer.answer_anchors.length > 0 && (
          <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Key points to remember
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {answer.answer_anchors.map((anchor, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>{anchor.fact}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Clear, Obvious Bottom Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
        {/* Left: Previous Button */}
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={onPrevious}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {/* Center/Right Actions: Practice Aloud + Mark as Ready + Next */}
        <div className="flex items-center gap-2">
          {onStartPractice && (
            <button
              type="button"
              onClick={onStartPractice}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-all shadow-xs"
              title="Practice answering with your microphone"
            >
              <Mic className="w-3.5 h-3.5 text-blue-600" />
              <span>Practice Aloud</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onToggleReview(question.id, !question.is_reviewed)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              question.is_reviewed
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{question.is_reviewed ? "Reviewed ✓" : "Mark as Ready"}</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all active:scale-95"
          >
            <span>{isLastQuestion ? "Finish Preparation" : "Next Question"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
