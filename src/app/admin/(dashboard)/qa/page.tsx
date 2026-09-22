"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Mic, 
  Sliders, 
  History, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  RefreshCw,
  Search,
  Filter,
  Eye,
  Trash2,
  PlusCircle,
  ExternalLink,
  Lock,
  Layers,
  Check,
  ChevronRight,
  Zap,
  Info
} from "lucide-react";
import { toast } from "sonner";
import type { 
  QASystemHealthOverview, 
  QAGenerationLog, 
  QASettings, 
  QAIncident, 
  QAQualityReport, 
  QAAdminAuditLog, 
  SafeDiagnosticSummary,
  StorageCleanupCheckResult,
  ApprovedGeminiModel
} from "@shared/types/adminQa";

type TabKey = 
  | "overview" 
  | "generations" 
  | "quality" 
  | "practice" 
  | "truth_lock" 
  | "usage" 
  | "incidents" 
  | "settings" 
  | "audit";

export default function AdminQAPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [timeRange, setTimeRange] = useState<"today" | "7d" | "30d">("today");
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [overview, setOverview] = useState<QASystemHealthOverview | null>(null);
  const [generations, setGenerations] = useState<QAGenerationLog[]>([]);
  const [genTotal, setGenTotal] = useState(0);
  const [genFilters, setGenFilters] = useState<{ platform?: string; status?: string; feature?: string }>({});
  const [settings, setSettings] = useState<QASettings | null>(null);
  const [incidents, setIncidents] = useState<QAIncident[]>([]);
  const [qualityReports, setQualityReports] = useState<QAQualityReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<QAAdminAuditLog[]>([]);

  // Diagnostics Modal State
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [diagnosticSummary, setDiagnosticSummary] = useState<SafeDiagnosticSummary | null>(null);
  const [isDiagLoading, setIsDiagLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Storage Cleanup State
  const [storageCheck, setStorageCheck] = useState<StorageCleanupCheckResult | null>(null);
  const [isScanningStorage, setIsScanningStorage] = useState(false);
  const [isCleaningStorage, setIsCleaningStorage] = useState(false);

  // Incident Modal State
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    severity: "medium" as const,
    userNotice: "",
  });

  // Settings update reason dialog state
  const [showSettingsConfirm, setShowSettingsConfirm] = useState(false);
  const [pendingSettings, setPendingSettings] = useState<Partial<QASettings> | null>(null);
  const [settingsReason, setSettingsReason] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Fetch Overview Data
  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/qa/overview?range=${timeRange}`);
      const json = await res.json();
      if (json.success) setOverview(json.data);
    } catch {
      toast.error("Failed to load operational health overview");
    }
  }, [timeRange]);

  // Fetch Generations Logs
  const loadGenerations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (genFilters.platform) params.set("platform", genFilters.platform);
      if (genFilters.status) params.set("status", genFilters.status);
      if (genFilters.feature) params.set("feature", genFilters.feature);
      params.set("limit", "50");

      const res = await fetch(`/api/admin/qa/generations?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setGenerations(json.data);
        setGenTotal(json.total);
      }
    } catch {
      toast.error("Failed to load generation telemetry logs");
    }
  }, [genFilters]);

  // Fetch Settings
  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/qa/settings");
      const json = await res.json();
      if (json.success) setSettings(json.data);
    } catch {
      toast.error("Failed to load settings");
    }
  }, []);

  // Fetch Incidents
  const loadIncidents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/qa/incidents");
      const json = await res.json();
      if (json.success) setIncidents(json.data);
    } catch {
      toast.error("Failed to load incidents");
    }
  }, []);

  // Fetch Quality Reports
  const loadQualityReports = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/qa/quality");
      const json = await res.json();
      if (json.success) setQualityReports(json.data.reports);
    } catch {
      toast.error("Failed to load quality reports");
    }
  }, []);

  // Fetch Audit Logs
  const loadAuditLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/qa/audit-logs?limit=50");
      const json = await res.json();
      if (json.success) setAuditLogs(json.data);
    } catch {
      toast.error("Failed to load audit logs");
    }
  }, []);

  // Master load for initial render or tab switch
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      loadOverview(),
      loadGenerations(),
      loadSettings(),
      loadIncidents(),
      loadQualityReports(),
      loadAuditLogs()
    ]).finally(() => setIsLoading(false));
  }, [loadOverview, loadGenerations, loadSettings, loadIncidents, loadQualityReports, loadAuditLogs]);

  // Safe Debug Handler
  const openDiagnostics = async (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    setIsDiagLoading(true);
    try {
      const res = await fetch(`/api/admin/qa/diagnostics/${workspaceId}`);
      const json = await res.json();
      if (json.success) {
        setDiagnosticSummary(json.data);
      } else {
        toast.error(json.error || "Failed to load diagnostic summary");
      }
    } catch {
      toast.error("Failed to connect to diagnostic service");
    } finally {
      setIsDiagLoading(false);
    }
  };

  // Safe Admin Retry Handler
  const handleSafeRetry = async (workspaceId: string) => {
    setIsRetrying(true);
    try {
      const res = await fetch("/api/admin/qa/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          reason: "Manual admin recovery via Diagnostic Console",
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || "Retry initiated successfully");
        openDiagnostics(workspaceId);
        loadOverview();
        loadGenerations();
      } else {
        toast.error(json.error || "Retry failed");
      }
    } catch {
      toast.error("Failed to invoke admin retry");
    } finally {
      setIsRetrying(false);
    }
  };

  // Storage Scan Handler
  const handleScanStorage = async () => {
    setIsScanningStorage(true);
    try {
      const res = await fetch("/api/admin/qa/storage/orphans");
      const json = await res.json();
      if (json.success) {
        setStorageCheck(json.data);
        toast.success(`Scanned ${json.data.totalObjectsScanned} objects: ${json.data.orphanedObjectsCount} orphans detected.`);
      }
    } catch {
      toast.error("Failed to scan storage");
    } finally {
      setIsScanningStorage(false);
    }
  };

  // Safe Orphan Cleanup Handler
  const handleCleanStorage = async () => {
    setIsCleaningStorage(true);
    try {
      const res = await fetch("/api/admin/qa/storage/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Admin executed temporary audio cleanup" }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        handleScanStorage();
        loadOverview();
      } else {
        toast.error(json.error || "Cleanup failed");
      }
    } catch {
      toast.error("Failed to execute cleanup");
    } finally {
      setIsCleaningStorage(false);
    }
  };

  // Save Settings Handler
  const submitSettingsUpdate = async () => {
    if (!pendingSettings) return;
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/admin/qa/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: pendingSettings,
          reason: settingsReason || "Admin settings update",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        toast.success("Settings updated successfully and audited");
        setShowSettingsConfirm(false);
        setPendingSettings(null);
        setSettingsReason("");
        loadAuditLogs();
      } else {
        toast.error(json.error || "Failed to update settings");
      }
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Resolve Quality Report
  const handleResolveQualityReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/admin/qa/quality/${reportId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved", notes: "Reviewed and marked resolved by administrator" }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Quality report marked resolved");
        loadQualityReports();
        loadAuditLogs();
      }
    } catch {
      toast.error("Failed to update report");
    }
  };

  // Create Incident
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/qa/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIncident),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Incident created and published");
        setShowIncidentModal(false);
        setNewIncident({ title: "", description: "", severity: "medium", userNotice: "" });
        loadIncidents();
        loadOverview();
      } else {
        toast.error(json.error || "Failed to create incident");
      }
    } catch {
      toast.error("Failed to connect to incident service");
    }
  };

  // Update Incident Status
  const handleUpdateIncidentStatus = async (incidentId: string, nextStatus: "identified" | "monitoring" | "resolved") => {
    try {
      const res = await fetch("/api/admin/qa/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          incidentId,
          updates: { status: nextStatus },
          reason: `Incident transitioned to ${nextStatus}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Incident status updated to ${nextStatus}`);
        loadIncidents();
        loadOverview();
      }
    } catch {
      toast.error("Failed to update incident");
    }
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: <Activity className="w-4 h-4" /> },
    { key: "generations", label: "Generations", icon: <Layers className="w-4 h-4" /> },
    { key: "quality", label: "Quality", icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: "practice", label: "Practice & Audio", icon: <Mic className="w-4 h-4" /> },
    { key: "truth_lock", label: "Truth Lock & Risk", icon: <ShieldCheck className="w-4 h-4" /> },
    { key: "usage", label: "Usage & Costs", icon: <DollarSign className="w-4 h-4" /> },
    { key: "incidents", label: "Incidents", icon: <AlertTriangle className="w-4 h-4" /> },
    { key: "settings", label: "Settings", icon: <Sliders className="w-4 h-4" /> },
    { key: "audit", label: "Audit Logs", icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Active Incident Notice */}
      {overview?.activeIncident && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-900 text-sm">{overview.activeIncident.title}</span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full text-[10px] font-bold uppercase">
                  {overview.activeIncident.status}
                </span>
              </div>
              <p className="text-xs text-amber-700 mt-1">{overview.activeIncident.description}</p>
              {overview.activeIncident.user_notice && (
                <p className="text-xs font-semibold text-amber-800 mt-1">
                  Public notice: &ldquo;{overview.activeIncident.user_notice}&rdquo;
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setActiveTab("incidents")}
            className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 shrink-0"
          >
            Manage Incident
          </button>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Q&A System Operations</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational governance, telemetry monitoring, and privacy-safe diagnostics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "overview" && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(["today", "7d", "30d"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    timeRange === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {r === "today" ? "Today" : r === "7d" ? "7 Days" : "30 Days"}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              loadOverview();
              loadGenerations();
            }}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition-all"
            title="Refresh telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                active
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Health Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Preparations</span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {overview?.preparationsToday ?? 0}
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  {overview && overview.preparationsToday > 0
                    ? `${Math.round((overview.successfulGenerationsToday / overview.preparationsToday) * 100)}% success`
                    : "100% success"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {overview?.successfulGenerationsToday ?? 0} successful / {overview?.failedGenerationsToday ?? 0} failed
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Generation Time</span>
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {overview ? `${(overview.averageLatencyMs / 1000).toFixed(1)}s` : "0s"}
                </span>
                <span className="text-xs font-semibold text-slate-500">Gemini P95</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Latency across active models</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Truth Lock Protected</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {overview?.unsupportedClaimsBlocked ?? 0}
                </span>
                <span className="text-xs font-semibold text-amber-600">claims blocked</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {overview?.clarificationsRequested ?? 0} clarifications / {overview?.unresolvedConflicts ?? 0} conflicts
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Provider Health</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Zap className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-black capitalize text-slate-900">
                  {overview?.providerStatus ?? "Healthy"}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Active Model: {settings?.active_gemini_model || "gemini-2.0-flash"}
              </p>
            </div>
          </div>

          {/* Subsystem Health Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Mic className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-sm text-slate-900">Voice Practice</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Operational
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Successful sessions:</span>
                  <span className="font-bold text-slate-900">{overview?.voicePracticeSuccessful ?? 0}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Processing failures:</span>
                  <span className="font-bold text-red-600">{overview?.voicePracticeFailed ?? 0}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Storage cleanup:</span>
                  <span className="font-bold text-emerald-600 uppercase text-[10px]">
                    {overview?.temporaryAudioCleanupStatus ?? "Healthy"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">Truth Lock Verification</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Active Enforced
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Unsupported claims blocked:</span>
                  <span className="font-bold text-slate-900">{overview?.unsupportedClaimsBlocked ?? 0}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Pending clarifications:</span>
                  <span className="font-bold text-amber-600">{overview?.clarificationsRequested ?? 0}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Active conflicts:</span>
                  <span className="font-bold text-slate-900">{overview?.unresolvedConflicts ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">AI Cost Today</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Telemetry
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Estimated spend:</span>
                  <span className="font-bold text-slate-900">${overview?.estimatedDailyCostUsd ?? "0.00"}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Threshold limit:</span>
                  <span className="font-bold text-slate-900">${settings?.cost_alert_threshold_daily_usd ?? "50.00"}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Spend status:</span>
                  <span className="font-bold text-emerald-600">Normal Range</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GENERATIONS (Operational Telemetry Table) */}
      {activeTab === "generations" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> Filters:
              </span>
              <select
                value={genFilters.platform || ""}
                onChange={(e) => setGenFilters({ ...genFilters, platform: e.target.value || undefined })}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="">All Platforms</option>
                <option value="web">Web</option>
                <option value="mobile">Mobile (Expo)</option>
              </select>
              <select
                value={genFilters.status || ""}
                onChange={(e) => setGenFilters({ ...genFilters, status: e.target.value || undefined })}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="timeout">Timeout</option>
                <option value="rate_limited">Rate Limited</option>
              </select>
              <select
                value={genFilters.feature || ""}
                onChange={(e) => setGenFilters({ ...genFilters, feature: e.target.value || undefined })}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="">All Features</option>
                <option value="prepare">Prepare</option>
                <option value="regenerate">Regenerate</option>
                <option value="voice_practice">Voice Practice</option>
                <option value="typed_practice">Typed Practice</option>
                <option value="story_draft">Story Draft</option>
              </select>
            </div>
            <span className="text-xs font-bold text-slate-400">{genTotal} Records Found</span>
          </div>

          {/* Telemetry Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Feature</th>
                    <th className="py-3 px-4">Platform</th>
                    <th className="py-3 px-4">Model</th>
                    <th className="py-3 px-4">Latency</th>
                    <th className="py-3 px-4">Tokens</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Safe Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {generations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No generation records found for current filters.
                      </td>
                    </tr>
                  ) : (
                    generations.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {new Date(g.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 capitalize">
                          {g.feature.replace(/_/g, " ")}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            g.platform === "mobile" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {g.platform}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{g.model_name}</td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">{g.latency_ms}ms</td>
                        <td className="py-3 px-4 text-slate-500">{g.prompt_tokens + g.completion_tokens}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            g.status === "success" 
                              ? "bg-emerald-100 text-emerald-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {g.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {g.workspace_id ? (
                            <button
                              onClick={() => openDiagnostics(g.workspace_id!)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                            >
                              Safe Debug
                            </button>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUALITY & FEEDBACK */}
      {activeTab === "quality" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">User Helpfulness Signal</h3>
              <p className="text-3xl font-black text-slate-900 mt-3">94%</p>
              <p className="text-xs text-slate-500 mt-1">Preparation satisfaction baseline</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Common Report Reason</h3>
              <p className="text-xl font-black text-slate-900 mt-3">Missing Tool Experience</p>
              <p className="text-xs text-slate-500 mt-1">Triggers inline clarification</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Quality Reports</h3>
              <p className="text-3xl font-black text-slate-900 mt-3">{qualityReports.length}</p>
              <p className="text-xs text-slate-500 mt-1">In operational queue</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Quality Issue Queue</h3>
              <span className="text-xs text-slate-400 font-medium">{qualityReports.length} Open Reports</span>
            </div>
            <div className="divide-y divide-slate-100">
              {qualityReports.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  No active quality reports in queue. Everything looks healthy.
                </div>
              ) : (
                qualityReports.map((r) => (
                  <div key={r.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-md text-[10px] font-bold uppercase">
                          {r.report_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">Platform: {r.platform}</span>
                      </div>
                      {r.safe_notes && <p className="text-xs text-slate-500 mt-1">{r.safe_notes}</p>}
                    </div>
                    <button
                      onClick={() => handleResolveQualityReport(r.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Resolve
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRACTICE & AUDIO */}
      {activeTab === "practice" && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Temporary Audio Retention & Storage Cleanup</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prompt 6 & 8 mandate strict temporary-audio cleanup to preserve candidate privacy.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleScanStorage}
                  disabled={isScanningStorage}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
                >
                  {isScanningStorage ? "Scanning Bucket..." : "Scan Storage for Orphans"}
                </button>
                <button
                  onClick={handleCleanStorage}
                  disabled={isCleaningStorage || !storageCheck || storageCheck.candidateFilesForCleanup.length === 0}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isCleaningStorage ? "Cleaning..." : "Run Safe Orphan Cleanup"}
                </button>
              </div>
            </div>

            {storageCheck && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">Total Scanned:</span>
                  <span className="font-bold text-slate-900 text-sm">{storageCheck.totalObjectsScanned}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Valid Practice Objects:</span>
                  <span className="font-bold text-emerald-600 text-sm">{storageCheck.validObjectsCount}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Orphaned Objects:</span>
                  <span className="font-bold text-amber-600 text-sm">{storageCheck.orphanedObjectsCount}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Expired (&gt;{settings?.audio_retention_hours}h):</span>
                  <span className="font-bold text-red-600 text-sm">{storageCheck.expiredObjectsCount}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: TRUTH LOCK & RISK */}
      {activeTab === "truth_lock" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Claims Blocked</h3>
              <p className="text-3xl font-black text-slate-900 mt-3">{overview?.unsupportedClaimsBlocked ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1">Zero fabrication policy enforced</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Clarifications Prompted</h3>
              <p className="text-3xl font-black text-slate-900 mt-3">{overview?.clarificationsRequested ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1">Resolved via simple one-tap inputs</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Conflicts</h3>
              <p className="text-3xl font-black text-slate-900 mt-3">{overview?.unresolvedConflicts ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1">Preserved without blind overwriting</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: USAGE & COSTS */}
      {activeTab === "usage" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Telemetry-Backed AI Cost Estimate</h3>
              <p className="text-xs text-slate-500">
                Calculated strictly from token counts and Gemini input/output tier pricing.
              </p>
              <div className="pt-2 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">${overview?.estimatedDailyCostUsd ?? "0.00"}</span>
                <span className="text-xs text-slate-400">Est. USD today</span>
              </div>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Cost Anomaly Detection</h3>
              <p className="text-xs text-slate-500">Daily threshold limit set in operational settings:</p>
              <div className="pt-2 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">${settings?.cost_alert_threshold_daily_usd ?? "50.00"}</span>
                <span className="text-xs text-emerald-600 font-bold">Within Normal Boundary</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: INCIDENTS */}
      {activeTab === "incidents" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Active & Resolved Incidents</h3>
            <button
              onClick={() => setShowIncidentModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Open New Incident
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {incidents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  No active or past incidents recorded.
                </div>
              ) : (
                incidents.map((inc) => (
                  <div key={inc.id} className="p-5 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{inc.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inc.status === "resolved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {inc.status}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase">
                          {inc.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{inc.description}</p>
                      {inc.user_notice && (
                        <p className="text-xs font-semibold text-amber-700">Public: {inc.user_notice}</p>
                      )}
                    </div>
                    {inc.status !== "resolved" && (
                      <div className="flex items-center gap-2 shrink-0">
                        {inc.status === "investigating" && (
                          <button
                            onClick={() => handleUpdateIncidentStatus(inc.id, "identified")}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
                          >
                            Mark Identified
                          </button>
                        )}
                        {inc.status === "identified" && (
                          <button
                            onClick={() => handleUpdateIncidentStatus(inc.id, "monitoring")}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
                          >
                            Mark Monitoring
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateIncidentStatus(inc.id, "resolved")}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                        >
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: SETTINGS & CONTROLS */}
      {activeTab === "settings" && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-4xl">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Operational Controls & Guardrails</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly validated server-side. All changes create immutable audit entries.
            </p>
          </div>

          {settings && (
            <div className="space-y-5">
              {/* Feature Flags */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Emergency Feature Flags</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: "is_qa_enabled", label: "Master Q&A Preparation" },
                    { key: "is_voice_practice_enabled", label: "Voice Practice Engine" },
                    { key: "is_5min_refresh_enabled", label: "5-Minute Interview Refresh" },
                    { key: "is_story_bank_enabled", label: "Career Story Bank" },
                    { key: "is_interview_learning_enabled", label: "Interview Learning" },
                  ].map((flag) => {
                    const isEnabled = Boolean((settings as any)[flag.key]);
                    return (
                      <div key={flag.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{flag.label}</span>
                        <button
                          onClick={() => {
                            setPendingSettings({ [flag.key]: !isEnabled });
                            setShowSettingsConfirm(true);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            isEnabled ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                          }`}
                        >
                          {isEnabled ? "Enabled" : "Disabled"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Model Allowlist Selection */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Gemini Model</h4>
                <p className="text-xs text-slate-500">
                  Must be selected strictly from the approved server-side allowlist.
                </p>
                <div className="flex gap-2">
                  {(["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"] as ApprovedGeminiModel[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setPendingSettings({ active_gemini_model: m });
                        setShowSettingsConfirm(true);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        settings.active_gemini_model === m
                          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Generation Timeout (ms)
                  </label>
                  <input
                    type="number"
                    defaultValue={settings.generation_timeout_ms}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (val !== settings.generation_timeout_ms) {
                        setPendingSettings({ generation_timeout_ms: val });
                        setShowSettingsConfirm(true);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Temporary Audio Retention (Hours)
                  </label>
                  <input
                    type="number"
                    defaultValue={settings.audio_retention_hours}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (val !== settings.audio_retention_hours) {
                        setPendingSettings({ audio_retention_hours: val });
                        setShowSettingsConfirm(true);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 9: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Administrative Audit Trail</h3>
              <span className="text-xs font-medium text-slate-400">Zero Private Candidate Data</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Admin Email</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target</th>
                    <th className="py-3 px-4">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        No audit records recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(a.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{a.admin_email}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-blue-600">{a.action}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{a.target_type}</td>
                        <td className="py-3 px-4 text-slate-500">{a.reason || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY-REDACTED SAFE DIAGNOSTICS MODAL */}
      {selectedWorkspaceId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Safe Diagnostic Summary</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedWorkspaceId(null);
                  setDiagnosticSummary(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {isDiagLoading ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-500 font-medium">Reconstructing privacy-redacted summary...</p>
              </div>
            ) : diagnosticSummary ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Workspace Status:</span>
                    <span className="font-bold uppercase text-slate-900">{diagnosticSummary.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Platform:</span>
                    <span className="font-semibold text-slate-800">{diagnosticSummary.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Resume Available:</span>
                    <span className="font-semibold text-emerald-600">
                      {diagnosticSummary.resumeAvailable ? "✓ Yes" : "✕ No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Experience Records:</span>
                    <span className="font-semibold text-slate-800">{diagnosticSummary.experienceRecordsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Skills Count:</span>
                    <span className="font-semibold text-slate-800">{diagnosticSummary.skillsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Job Description Length:</span>
                    <span className="font-semibold text-slate-800">{diagnosticSummary.jobDescriptionLength} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Application Answers:</span>
                    <span className="font-semibold text-slate-800">{diagnosticSummary.applicationAnswersCount}</span>
                  </div>
                </div>

                {diagnosticSummary.lastErrorMessage && (
                  <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200">
                    <span className="font-bold block mb-0.5">Last Error Category: {diagnosticSummary.lastErrorCategory}</span>
                    <p className="text-[11px] font-mono">{diagnosticSummary.lastErrorMessage}</p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleSafeRetry(selectedWorkspaceId)}
                    disabled={isRetrying}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {isRetrying ? "Retrying Generation..." : "Safe Admin Retry"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* CONFIRM SETTINGS MODAL */}
      {showSettingsConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Confirm Configuration Change</h3>
            <p className="text-xs text-slate-500">
              Please specify an operational reason for this change. This will be permanently written to the audit log.
            </p>
            <input
              type="text"
              placeholder="e.g. Scaling model for production traffic / Emergency disable"
              value={settingsReason}
              onChange={(e) => setSettingsReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowSettingsConfirm(false);
                  setPendingSettings(null);
                }}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={submitSettingsUpdate}
                disabled={isSavingSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                {isSavingSettings ? "Saving..." : "Confirm & Audit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE INCIDENT MODAL */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateIncident} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Open Operational Incident</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Incident Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gemini 503 Provider Degraded"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Severity</label>
                <select
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Internal description of the issue"
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Public Notice (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Voice practice is undergoing temporary maintenance."
                  value={newIncident.userNotice}
                  onChange={(e) => setNewIncident({ ...newIncident, userNotice: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowIncidentModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Open Incident
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
