"use client";

import { useState, useEffect } from "react";
import { BookOpen, Sparkles, CheckCircle2, ChevronRight, Plus, Bookmark } from "lucide-react";
import type { UserCareerStory, QAQuestion, QAAnswer } from "@shared/types/qa";

interface QACareerStorySelectorProps {
  question: QAQuestion;
  answer: QAAnswer | null;
  applicationId: string;
  onApplyStory: (story: UserCareerStory) => void;
  onOpenStoryBank: () => void;
  onSaveAsStory: () => void;
}

export default function QACareerStorySelector({
  question,
  answer,
  applicationId,
  onApplyStory,
  onOpenStoryBank,
  onSaveAsStory,
}: QACareerStorySelectorProps) {
  const [recommendedStories, setRecommendedStories] = useState<UserCareerStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function loadRecommended() {
      try {
        setIsLoading(true);
        const qText = question.question_text || (question as any).questionText || "";
        const res = await fetch(
          `/api/qa/stories/recommend?category=${encodeURIComponent(question.category)}&questionText=${encodeURIComponent(qText)}`
        );
        if (res.ok) {
          const json = await res.json();
          setRecommendedStories(json.data || []);
          setCurrentIndex(0);
        }
      } catch (err) {
        console.error("Load recommended story error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadRecommended();
  }, [question.id, question.category]);

  const activeStory = recommendedStories[currentIndex] || null;

  return (
    <div className="p-4 rounded-3xl bg-indigo-50/50 border border-indigo-100/80 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900">
            Career Story Bank
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSaveAsStory}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
            title="Save this answer as a reusable Career Story"
          >
            <Bookmark className="w-3.5 h-3.5" />
            Save Answer as Story
          </button>

          <button
            type="button"
            onClick={onOpenStoryBank}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline ml-2"
          >
            All Stories
          </button>
        </div>
      </div>

      {activeStory ? (
        <div className="p-3.5 rounded-2xl bg-white border border-indigo-100 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">
                Recommended Real Example:
              </span>
              <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                {activeStory.title}
              </h5>
            </div>

            <button
              type="button"
              onClick={() => onApplyStory(activeStory)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors shrink-0"
            >
              Use This Story
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-2">
            <strong className="text-slate-800">Action:</strong> {activeStory.action}
          </p>

          {recommendedStories.length > 1 && (
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Example {currentIndex + 1} of {recommendedStories.length}
              </span>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev + 1) % recommendedStories.length)}
                className="font-bold text-indigo-600 hover:text-indigo-700"
              >
                Try Another Example →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-slate-500 font-medium">
          No matching Career Story yet. You can{" "}
          <button type="button" onClick={onSaveAsStory} className="text-indigo-600 font-bold underline">
            save this answer
          </button>{" "}
          to your Story Bank to reuse in future jobs.
        </div>
      )}
    </div>
  );
}
