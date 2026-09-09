"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, ArrowLeft, Bot, Zap, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSubscriptionStore } from "@/store/useSubscription";
import UpgradeModal from "@/components/shared/UpgradeModal";
import QAGenerationLoading from "./QAGenerationLoading";
import QAGenerationError from "./QAGenerationError";
import QAPreparationHero from "./QAPreparationHero";
import QAReadinessCard from "./QAReadinessCard";
import QAQuestionCard from "./QAQuestionCard";
import QAAllQuestionsView from "./QAAllQuestionsView";
import QAWhatYouSentDrawer from "./QAWhatYouSentDrawer";
import QAPracticeModal from "./QAPracticeModal";
import QAFiveMinuteRefreshModal from "./QAFiveMinuteRefreshModal";
import QANervousModeModal from "./QANervousModeModal";
import QACareerStoryBankModal from "./QACareerStoryBankModal";
import QAPostInterviewCheckInModal from "./QAPostInterviewCheckInModal";
import type { 
  QAWorkspace, 
  QAStage, 
  QAQuestion, 
  QAAnswer, 
  QAClarification, 
  ApplicationMemory, 
  RiskRadarSummary, 
  ReadinessBreakdown, 
  StageJourneySummary, 
  QAAnswerActiveVersion,
  RiskGroupType,
  QAPracticeAttempt,
  FiveMinuteRefreshPayload,
  NervousModePayload,
} from "@shared/types/qa";

interface QAPreparationContainerProps {
  applicationId: string;
}

export default function QAPreparationContainer({ applicationId }: QAPreparationContainerProps) {
  // Loading & State variables
  const [isLoading, setIsLoading] = useState(true);
  const [isPreparing, setIsPreparing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Subscription check
  const { getPlanTier, fetchSubscription, isLoading: isSubLoading, status: subStatus } = useSubscriptionStore();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Ensure subscription is fetched on mount
  useEffect(() => {
    if (subStatus === "none") {
      fetchSubscription().catch(() => {});
    }
  }, [subStatus, fetchSubscription]);

  // Core domain data
  const [workspace, setWorkspace] = useState<QAWorkspace | null>(null);
  const [stages, setStages] = useState<QAStage[]>([]);
  const [activeStage, setActiveStage] = useState<QAStage | null>(null);
  const [questions, setQuestions] = useState<(QAQuestion & { answer: QAAnswer | null; riskGroup?: RiskGroupType })[]>([]);
  const [clarifications, setClarifications] = useState<QAClarification[]>([]);
  const [memory, setMemory] = useState<ApplicationMemory | null>(null);
  const [radar, setRadar] = useState<RiskRadarSummary | null>(null);
  const [journeySummary, setJourneySummary] = useState<StageJourneySummary | null>(null);

  // Modal payloads
  const [refreshData, setRefreshData] = useState<FiveMinuteRefreshPayload | null>(null);
  const [nervousData, setNervousData] = useState<NervousModePayload | null>(null);

  // Application metadata
  const [applicationMeta, setApplicationMeta] = useState<{ title: string; company: string; location?: string | null; status: string }>({
    title: "Job Application",
    company: "Company",
    location: null,
    status: "applied",
  });

  // UI state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"single" | "all">("single");
  const [isWhatYouSentOpen, setIsWhatYouSentOpen] = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [isRefreshOpen, setIsRefreshOpen] = useState(false);
  const [isNervousOpen, setIsNervousOpen] = useState(false);
  const [isStoryBankOpen, setIsStoryBankOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [activeRiskFilter, setActiveRiskFilter] = useState<string>("all");

  // 1. Fetch Complete Q&A State
  const loadQASystemState = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Fetch Workspace & Questions
      const res = await fetch(`/api/qa/${applicationId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Application not found");
        }
        throw new Error("Failed to load preparation workspace");
      }

      const { data } = await res.json();
      setWorkspace(data.workspace);
      setStages(data.stages || []);
      const resolvedStage =
        data.activeStage ||
        (data.stages && data.stages.find((s: any) => s.is_current_stage)) ||
        (data.stages && data.stages[0]) ||
        null;
      setActiveStage(resolvedStage);

      if (data.applicationMeta) {
        setApplicationMeta(data.applicationMeta);
      }

      if (data.workspace?.status === "preparing") {
        setIsPreparing(true);
      } else {
        setIsPreparing(false);
      }

      // Read raw questions from API response (support both questions and questionsWithAnswers keys)
      const rawQuestions = data.questions || data.questionsWithAnswers || [];

      // If workspace is ready, load radar, journey, clarifications, and memory
      if (data.workspace?.status === "ready" && rawQuestions.length > 0) {
        const [radarRes, journeyRes, clarRes, memRes] = await Promise.all([
          fetch(`/api/qa/${applicationId}/radar`),
          fetch(`/api/qa/${applicationId}/journey`),
          fetch(`/api/qa/${applicationId}/clarifications`),
          fetch(`/api/qa/${applicationId}/memory`),
        ]);

        let loadedRadar: RiskRadarSummary | null = null;
        if (radarRes.ok) {
          const radarData = await radarRes.json();
          loadedRadar = radarData.data;
          setRadar(radarData.data);
        }

        if (journeyRes.ok) {
          const journeyData = await journeyRes.json();
          setJourneySummary(journeyData.data);
        }

        if (clarRes.ok) {
          const clarData = await clarRes.json();
          setClarifications(clarData.data || []);
        }

        if (memRes.ok) {
          const memData = await memRes.json();
          setMemory(memData.data);
        }

        // Merge Risk Group metadata onto questions
        const enrichedQuestions = rawQuestions.map((q: any) => {
          let riskGroup: RiskGroupType = "prepare";
          if (loadedRadar) {
            if (loadedRadar.strongItems?.some((item: any) => item.questionId === q.id)) {
              riskGroup = "strong";
            } else if (loadedRadar.importantItems?.some((item: any) => item.questionId === q.id)) {
              riskGroup = "important";
            } else if (loadedRadar.prepareItems?.some((item: any) => item.questionId === q.id)) {
              riskGroup = "prepare";
            }
          }
          return { ...q, riskGroup };
        });
        setQuestions(enrichedQuestions);
      } else {
        setQuestions(rawQuestions);
      }
    } catch (err: any) {
      console.error("[QAPreparationContainer Load Error]:", err);
      setErrorMessage(err?.message || "Could not load preparation details.");
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadQASystemState();
  }, [loadQASystemState]);

  // 2. Trigger "Prepare Me" (First-time or explicit regeneration)
  const handlePrepareMe = async (forceRegenerate: boolean = false) => {
    setIsPreparing(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/qa/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          stageType: activeStage?.stage_type || "application",
          forceRegenerate,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to generate preparation questions.");
      }

      const json = await res.json();
      if (json.data?.questions && json.data.questions.length > 0) {
        setQuestions(json.data.questions);
      }

      toast.success(forceRegenerate ? "Questions regenerated!" : "Preparation ready!");
      await loadQASystemState();
    } catch (err: any) {
      console.error("[Prepare Me Error]:", err);
      setErrorMessage(err?.message || "Preparation failed. Please try again.");
      toast.error(err?.message || "Preparation failed. Please try again.");
    } finally {
      setIsPreparing(false);
    }
  };

  // 3. Toggle Question Review state
  const handleToggleReview = async (questionId: string, isReviewed: boolean) => {
    // Optimistic update
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, is_reviewed: isReviewed } : q))
    );

    if (isReviewed) {
      toast.success("Marked as ready!");
    }

    try {
      const res = await fetch(`/api/qa/questions/${questionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isReviewed }),
      });

      if (!res.ok) throw new Error("Failed to update review status");

      // Refresh readiness calculation in background
      const journeyRes = await fetch(`/api/qa/${applicationId}/journey`);
      if (journeyRes.ok) {
        const journeyData = await journeyRes.json();
        setJourneySummary(journeyData.data);
      }
    } catch (err) {
      console.error("Toggle review error:", err);
      // Revert on error
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, is_reviewed: !isReviewed } : q))
      );
      toast.error("Failed to update review status");
    }
  };

  // 4. Submit Inline Clarification
  const handleSubmitClarification = async (clarificationId: string, responseValue: string) => {
    try {
      const res = await fetch("/api/qa/clarifications/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clarificationId,
          responseValue,
          scope: "global",
        }),
      });

      if (!res.ok) throw new Error("Failed to submit clarification");

      const { data } = await res.json();

      // Update question answer in state
      if (data.updatedAnswer) {
        setQuestions((prev) =>
          prev.map((q) =>
            q.answer?.id === data.updatedAnswer.id
              ? { ...q, answer: data.updatedAnswer }
              : q
          )
        );
      }

      // Remove pending clarification from list
      setClarifications((prev) => prev.filter((c) => c.id !== clarificationId));
      toast.success("Answer adapted to your background!");

      // Refresh radar and journey
      const [radarRes, journeyRes] = await Promise.all([
        fetch(`/api/qa/${applicationId}/radar`),
        fetch(`/api/qa/${applicationId}/journey`),
      ]);
      if (radarRes.ok) setRadar((await radarRes.json()).data);
      if (journeyRes.ok) setJourneySummary((await journeyRes.json()).data);
    } catch (err) {
      console.error("Submit clarification error:", err);
      toast.error("Could not save clarification");
    }
  };

  // 5. Update User-Edited Answer
  const handleUpdateAnswer = async (
    answerId: string,
    userEditedText: string | null,
    activeVersion?: QAAnswerActiveVersion
  ) => {
    try {
      const res = await fetch(`/api/qa/answers/${answerId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEditedAnswer: userEditedText,
          activeVersion,
        }),
      });

      if (!res.ok) throw new Error("Failed to update answer");

      const { data: updated } = await res.json();

      setQuestions((prev) =>
        prev.map((q) => (q.answer?.id === answerId ? { ...q, answer: updated } : q))
      );
      toast.success(userEditedText ? "Custom answer saved!" : "Answer reset to AI default");
    } catch (err) {
      console.error("Update answer error:", err);
      toast.error("Failed to update answer");
    }
  };

  // 6. 5-Minute Refresh Modal Opener
  const handleOpenRefresh = async () => {
    try {
      const res = await fetch(`/api/qa/${applicationId}/refresh`);
      if (res.ok) {
        const json = await res.json();
        setRefreshData(json.data);
        setIsRefreshOpen(true);
      }
    } catch (err) {
      console.error("Refresh modal fetch error:", err);
    }
  };

  // 7. Nervous Mode Modal Opener
  const handleOpenNervous = async () => {
    try {
      const res = await fetch(`/api/qa/${applicationId}/nervous`);
      if (res.ok) {
        const json = await res.json();
        setNervousData(json.data);
        setIsNervousOpen(true);
      }
    } catch (err) {
      console.error("Nervous modal fetch error:", err);
    }
  };

  // 8. Practice Success Handler
  const handlePracticeSuccess = async (attempt: QAPracticeAttempt) => {
    if (attempt.feedback?.overallVerdict === "ready") {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === attempt.question_id ? { ...q, is_reviewed: true } : q
        )
      );

      toast.success("Great job! Practice completed and marked ready.");

      // Refresh journey
      const journeyRes = await fetch(`/api/qa/${applicationId}/journey`);
      if (journeyRes.ok) {
        setJourneySummary((await journeyRes.json()).data);
      }
    }
  };

  // Handle Risk Filter click
  const handleFilterGroup = (group: string) => {
    setActiveRiskFilter(group);
    if (group !== "all") {
      setViewMode("all");
    }
  };

  // Render Loading States
  if (isPreparing) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <QAGenerationLoading
          jobTitle={applicationMeta.title}
          companyName={applicationMeta.company}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">
          Loading Interview Preparation...
        </p>
      </div>
    );
  }

  // Free Tier Plan Lock Screen (only when subscription state has fully loaded)
  if (!isSubLoading && subStatus !== "none" && getPlanTier() === "free") {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white shadow-xl border border-slate-800 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pro & Unlimited Feature</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Prepare Me</span> Intelligence
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed max-w-xl mx-auto">
            Role-specific interview preparation is available on the <strong className="text-white">Pro</strong> and <strong className="text-white">Unlimited</strong> plans. Practice predicted questions, examine Truth Lock talking points, and rehearse with audio feedback.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-blue-600/25 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Upgrade to Pro ($29/mo)</span>
            </button>

            <Link
              href="/jobs/history"
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all text-center border border-white/10"
            >
              Return to Applications
            </Link>
          </div>
        </div>

        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          targetTier="pro"
          featureContext="prepare_me"
          reason="The Prepare Me feature (Job-Specific AI Questions & Answers) is available exclusively on Pro and Unlimited plans. Upgrade to Pro Plan to continue."
        />
      </div>
    );
  }

  if (errorMessage && (!workspace || workspace.status === "failed")) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <QAGenerationError
          errorMessage={errorMessage}
          onRetry={() => handlePrepareMe(true)}
        />
      </div>
    );
  }

  // First-Time Experience (Not Prepared Yet)
  if (!workspace || workspace.status === "not_prepared" || questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm text-center space-y-6">
          <Link
            href="/jobs/history"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Applications</span>
          </Link>

          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <Bot className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Prepare for {applicationMeta.title}
            </h1>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              Jobvanta will analyze <strong className="text-slate-800">{applicationMeta.company}</strong>&apos;s requirements against your submitted resume to generate tailored interview questions and answers.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => handlePrepareMe(false)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Prepare Me Now</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Question resolution
  const safeIndex = Math.min(Math.max(0, currentQuestionIndex), Math.max(0, questions.length - 1));
  const currentQuestion = questions[safeIndex] || questions[0];
  const pendingClarification = clarifications.find(
    (c) => c.question_id === currentQuestion?.id && c.status === "pending"
  );

  const fallbackReadiness: ReadinessBreakdown = {
    readinessScore: 75,
    readinessLevel: "Making Progress",
    totalQuestions: questions.length,
    reviewedCount: questions.filter((q) => q.is_reviewed).length,
    strongCount: questions.filter((q) => q.riskGroup === "strong").length,
    prepareCount: questions.filter((q) => q.riskGroup === "prepare").length,
    importantCount: questions.filter((q) => q.riskGroup === "important").length,
    unresolvedTruthCount: 0,
    activeStageType: activeStage?.stage_type || "application",
    activeStageTitle: activeStage?.title || "Application",
  };

  const readinessData = journeySummary?.readiness || fallbackReadiness;
  const reviewedIndices = questions
    .map((q, idx) => (q.is_reviewed ? idx : -1))
    .filter((idx) => idx !== -1);

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-16">
      {/* 1. Distraction-Free Header with Consolidated Toolkit Dropdown */}
      <QAPreparationHero
        jobTitle={applicationMeta.title}
        companyName={applicationMeta.company}
        location={applicationMeta.location}
        activeStageType={activeStage?.stage_type || "application"}
        onOpenWhatYouSent={() => setIsWhatYouSentOpen(true)}
        onRefreshPreparation={() => handlePrepareMe(true)}
        onOpenRefresh={handleOpenRefresh}
        onOpenNervous={handleOpenNervous}
        onOpenStoryBank={() => setIsStoryBankOpen(true)}
        onOpenCheckIn={() => setIsCheckInOpen(true)}
        isRefreshing={isPreparing}
        recentDiff={journeySummary?.recentDiff}
      />

      {/* 2. Compact Progress & Question Stepper Bar */}
      <QAReadinessCard
        readiness={readinessData}
        radar={radar}
        onFilterGroup={handleFilterGroup}
        activeFilter={activeRiskFilter}
        currentIndex={safeIndex}
        totalQuestions={questions.length}
        onSelectQuestion={(idx) => {
          setCurrentQuestionIndex(idx);
          setViewMode("single");
        }}
        reviewedIndices={reviewedIndices}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
      />

      {/* 3. Question Preparation View (Focus Mode 1-by-1 vs List View) */}
      {viewMode === "single" && currentQuestion ? (
        <QAQuestionCard
          question={currentQuestion}
          answer={currentQuestion.answer}
          pendingClarification={pendingClarification}
          currentIndex={safeIndex}
          totalQuestions={questions.length}
          onPrevious={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
          onNext={() => {
            if (safeIndex < questions.length - 1) {
              setCurrentQuestionIndex((prev) => prev + 1);
            } else {
              toast.success("You've reached the end! Review any question or practice aloud.");
              setViewMode("all");
            }
          }}
          onToggleReview={handleToggleReview}
          onSubmitClarification={handleSubmitClarification}
          onUpdateAnswer={handleUpdateAnswer}
          riskGroup={currentQuestion.riskGroup || "prepare"}
          onStartPractice={() => setIsPracticeOpen(true)}
          applicationId={applicationId}
          onOpenStoryBank={() => setIsStoryBankOpen(true)}
          onSaveAsStory={async (answerText) => {
            try {
              const qText = currentQuestion.question_text || (currentQuestion as any).questionText || "Career Example";
              await fetch("/api/qa/stories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  rawDraft: answerText,
                  title: `Example for: ${qText.slice(0, 45)}`,
                  applicationId,
                  sourceType: "qa_answer",
                  sourceId: currentQuestion.id,
                }),
              });
              toast.success("Saved to Career Story Bank!");
              setIsStoryBankOpen(true);
            } catch (err) {
              console.error("Save as story error:", err);
              toast.error("Failed to save to story bank");
            }
          }}
        />
      ) : (
        <QAAllQuestionsView
          questions={questions}
          onSelectQuestion={(idx) => {
            setCurrentQuestionIndex(idx);
            setViewMode("single");
          }}
          onToggleReview={handleToggleReview}
        />
      )}

      {/* "What You Sent" Drawer */}
      <QAWhatYouSentDrawer
        isOpen={isWhatYouSentOpen}
        onClose={() => setIsWhatYouSentOpen(false)}
        memory={memory}
        jobTitle={applicationMeta.title}
        companyName={applicationMeta.company}
      />

      {/* "Practice Answer" Modal */}
      {currentQuestion && (
        <QAPracticeModal
          isOpen={isPracticeOpen}
          onClose={() => setIsPracticeOpen(false)}
          question={currentQuestion}
          answer={currentQuestion.answer}
          onPracticeSuccess={handlePracticeSuccess}
        />
      )}

      {/* "5-Minute Interview Refresh" Modal */}
      <QAFiveMinuteRefreshModal
        isOpen={isRefreshOpen}
        onClose={() => setIsRefreshOpen(false)}
        data={refreshData}
      />

      {/* "I'm Nervous" Minimal Modal */}
      <QANervousModeModal
        isOpen={isNervousOpen}
        onClose={() => setIsNervousOpen(false)}
        data={nervousData}
        onStartPractice={() => setIsPracticeOpen(true)}
      />

      {/* "Career Story Bank" Modal */}
      <QACareerStoryBankModal
        isOpen={isStoryBankOpen}
        onClose={() => setIsStoryBankOpen(false)}
      />

      {/* "Post-Interview Check-In" Modal */}
      <QAPostInterviewCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        applicationId={applicationId}
        stageId={activeStage?.id}
        onComplete={() => loadQASystemState()}
      />
    </div>
  );
}
