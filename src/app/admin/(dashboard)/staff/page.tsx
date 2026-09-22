"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  AlertCircle, 
  X,
  Mail,
  User,
  Key
} from "lucide-react";
import type { SupportStaffProfile, AdminRole } from "@shared/types";

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<SupportStaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    displayName: string;
    tempPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState<AdminRole>("support_agent");

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      if (data.success) {
        setStaffList(data.staff || []);
      }
    } catch (err) {
      console.error("Failed to load staff list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: nameInput.trim(),
          email: emailInput.trim(),
          role: roleInput,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to invite staff");
      }

      setCreatedCredentials({
        email: emailInput.trim(),
        displayName: nameInput.trim(),
        tempPassword: data.temporaryPassword,
      });

      // Clear form & refresh
      setNameInput("");
      setEmailInput("");
      fetchStaff();
    } catch (err: any) {
      setInviteError(err.message || "Failed to invite staff member");
    } finally {
      setInviting(false);
    }
  };

  const handleToggleActive = async (staffId: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          isActive: !currentActive,
        }),
      });
      if (res.ok) {
        fetchStaff();
      }
    } catch (err) {
      console.error("Failed to update staff status:", err);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `JobVanta Staff Onboarding Credentials:\nPortal: ${window.location.origin}/admin/login\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.tempPassword}\n\nPlease change your password upon logging in.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              Staff & Operations Roster
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Manage support agents, leads, and operational permissions.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setCreatedCredentials(null);
            setIsInviteOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer transition-all flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite New Staff Member</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">Staff Member</th>
                <th className="py-3.5 px-6">Assigned Role</th>
                <th className="py-3.5 px-6">Presence & State</th>
                <th className="py-3.5 px-6">Active Tickets</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading staff roster...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No staff members found.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                          {staff.display_name?.[0] || "S"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{staff.display_name}</p>
                          <p className="text-[11px] text-slate-400">{staff.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        staff.role === "super_admin"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : staff.role === "support_lead"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {staff.role?.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          staff.is_active
                            ? (staff.is_online ? "bg-emerald-500 animate-pulse" : "bg-slate-300")
                            : "bg-red-400"
                        }`} />
                        <span className="font-semibold text-slate-700">
                          {staff.is_active 
                            ? (staff.is_online ? "Online Now" : "Offline") 
                            : "Disabled"}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900">
                        {staff.active_tickets_count || 0}
                      </span>
                      <span className="text-slate-400 text-[11px] ml-1">
                        / {staff.max_concurrent_tickets} max
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      {staff.role !== "super_admin" && (
                        <button
                          onClick={() => handleToggleActive(staff.id, staff.is_active)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            staff.is_active
                              ? "text-red-600 hover:bg-red-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {staff.is_active ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Invite Staff Member</h3>
                <p className="text-xs text-slate-500">Provide portal access for support and operations.</p>
              </div>
            </div>

            {createdCredentials ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Staff Account Created!</span>
                  </div>
                  <p className="text-xs">
                    Please provide these login credentials to <strong>{createdCredentials.displayName}</strong>:
                  </p>
                  <div className="p-3 bg-white rounded-xl border border-emerald-200/80 font-mono text-xs space-y-1">
                    <p><span className="text-slate-400">Portal:</span> /admin/login</p>
                    <p><span className="text-slate-400">Email:</span> {createdCredentials.email}</p>
                    <p><span className="text-slate-400">Password:</span> {createdCredentials.tempPassword}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyCredentials}
                    className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-blue-500/20"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Copied to Clipboard!" : "Copy Credentials"}</span>
                  </button>
                  <button
                    onClick={() => {
                      setCreatedCredentials(null);
                      setIsInviteOpen(false);
                    }}
                    className="h-11 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-700 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                {inviteError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{inviteError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Staff Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="sarah@jobvanta.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Operational Role
                  </label>
                  <select
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value as AdminRole)}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="support_agent">Support Agent (Handle assigned tickets)</option>
                    <option value="support_lead">Support Lead (Triage, team coordination)</option>
                    <option value="support_manager">Support Manager (Full staff management)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={inviting}
                    className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
                  >
                    {inviting ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <span>Generate Access Credentials</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
