"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  BookOpen, 
  Sparkles, 
  Star, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Check, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import type { UserCareerStory } from "@shared/types/qa";

interface QACareerStoryBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStory?: (story: UserCareerStory) => void;
}

export default function QACareerStoryBankModal({
  isOpen,
  onClose,
  onSelectStory,
}: QACareerStoryBankModalProps) {
  const [stories, setStories] = useState<UserCareerStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [situation, setSituation] = useState("");
  const [action, setAction] = useState("");
  const [result, setResult] = useState("");
  const [rawDraft, setRawDraft] = useState("");
  const [isAiStructuring, setIsAiStructuring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchStories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/qa/stories");
      if (res.ok) {
        const json = await res.json();
        setStories(json.data || []);
      }
    } catch (err) {
      console.error("Fetch stories error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStories();
      setIsAdding(false);
      setEditingStoryId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveStory = async () => {
    setIsSaving(true);
    try {
      if (editingStoryId) {
        const res = await fetch(`/api/qa/stories/${editingStoryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, situation, action, result }),
        });
        if (res.ok) {
          await fetchStories();
          setEditingStoryId(null);
        }
      } else {
        const res = await fetch("/api/qa/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            situation,
            action,
            result,
            rawDraft: rawDraft.trim() || undefined,
          }),
        });
        if (res.ok) {
          await fetchStories();
          setIsAdding(false);
          setTitle("");
          setSituation("");
          setAction("");
          setResult("");
          setRawDraft("");
        }
      }
    } catch (err) {
      console.error("Save story error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm("Are you sure you want to delete this Career Story?")) return;
    try {
      const res = await fetch(`/api/qa/stories/${storyId}`, { method: "DELETE" });
      if (res.ok) {
        setStories((prev) => prev.filter((s) => s.id !== storyId));
      }
    } catch (err) {
      console.error("Delete story error:", err);
    }
  };

  const handleToggleFavorite = async (story: UserCareerStory) => {
    try {
      const res = await fetch(`/api/qa/stories/${story.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !story.is_favorite }),
      });
      if (res.ok) {
        setStories((prev) =>
          prev.map((s) => (s.id === story.id ? { ...s, is_favorite: !s.is_favorite } : s))
        );
      }
    } catch (err) {
      console.error("Toggle favorite error:", err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-[36px] shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">My Career Story Bank</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Your strongest real achievements, reusable across all job interviews
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isAdding && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(true);
                    setEditingStoryId(null);
                    setTitle("");
                    setSituation("");
                    setAction("");
                    setResult("");
                    setRawDraft("");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Story
                </button>
              )}

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
            {/* Add / Edit Form Mode */}
            {(isAdding || editingStoryId) ? (
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 text-sm">
                    {editingStoryId ? "Edit Career Story" : "Add New Real Career Story"}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingStoryId(null);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                </div>

                {!editingStoryId && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Quick Notes / Draft (Optional — Jobvanta AI will organize):
                    </label>
                    <textarea
                      rows={3}
                      value={rawDraft}
                      onChange={(e) => setRawDraft(e.target.value)}
                      placeholder="Paste your rough notes about what happened, what you did, and the result..."
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                )}

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Story Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Resolved Delayed Enterprise Customer Order"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Situation (Context)</label>
                    <textarea
                      rows={2}
                      value={situation}
                      onChange={(e) => setSituation(e.target.value)}
                      placeholder="What was the challenge or background?"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Action (What you did)</label>
                    <textarea
                      rows={2}
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      placeholder="What specific actions did you execute?"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Result (Outcome)</label>
                    <textarea
                      rows={2}
                      value={result}
                      onChange={(e) => setResult(e.target.value)}
                      placeholder="What was the concrete outcome?"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveStory}
                    disabled={isSaving || (!rawDraft.trim() && (!title.trim() || !situation.trim()))}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? "Saving..." : "Save Story"}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Stories List */}
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                Loading your Career Stories...
              </div>
            ) : stories.length === 0 && !isAdding ? (
              <div className="py-12 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">No Career Stories saved yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add your go-to stories or save strong examples directly from your Q&A preparation answers.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stories.map((story) => (
                  <div
                    key={story.id}
                    className="p-5 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all space-y-3"
                  >
                    {/* Story Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-black text-slate-900 text-base">
                            {story.title}
                          </h4>
                          {story.truth_status === "verified" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Supported
                            </span>
                          )}
                        </div>

                        {/* Competency Badges */}
                        {story.supported_competencies && story.supported_competencies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {story.supported_competencies.map((comp, idx) => (
                              <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                {comp}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Top Action Icons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(story)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            story.is_favorite ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:bg-slate-100"
                          }`}
                          title="Toggle Favorite"
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingStoryId(story.id);
                            setTitle(story.title);
                            setSituation(story.situation);
                            setAction(story.action);
                            setResult(story.result);
                            setIsAdding(false);
                          }}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
                          title="Edit Story"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteStory(story.id)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                          title="Delete Story"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Story Content Breakdown */}
                    <div className="text-xs text-slate-700 space-y-1.5 bg-white p-3.5 rounded-2xl border border-slate-100">
                      <p><strong className="text-slate-900">Situation:</strong> {story.situation}</p>
                      <p><strong className="text-slate-900">Action:</strong> {story.action}</p>
                      <p><strong className="text-slate-900">Result:</strong> {story.result}</p>
                    </div>

                    {/* Select Story Action if callback provided */}
                    {onSelectStory && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectStory(story);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors"
                        >
                          Use This Story
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
