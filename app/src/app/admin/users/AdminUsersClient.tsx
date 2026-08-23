"use client";

import { useState } from "react";
import {
  Search,
  Shield,
  Sparkles,
  GraduationCap,
  Calendar,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  LogOut,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  grantProEntitlement,
  revokeUserEntitlement,
  resetUserSessions,
} from "./actions";

export function AdminUsersClient({
  users,
}: {
  users: Array<{
    id: string;
    email: string | null;
    full_name: string | null;
    college: string | null;
    role: string;
    created_at: string;
    activeEntitlement?: {
      id: string;
      plan_key: string;
      status: string;
      source: string;
      expires_at: string | null;
    } | null;
  }>;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [modalType, setModalType] = useState<"grant" | "revoke" | "sessions" | null>(null);
  const [durationDays, setDurationDays] = useState(30);
  const [planKey, setPlanKey] = useState<"pro_30d" | "pro_90d" | "pro_365d" | "lifetime">("pro_30d");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      (u.email || "").toLowerCase().includes(q) ||
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.college || "").toLowerCase().includes(q) ||
      (u.activeEntitlement?.plan_key || "").toLowerCase().includes(q)
    );
  });

  async function handleGrant() {
    if (!selectedUser) return;
    setLoading(true);
    setMsg(null);
    try {
      await grantProEntitlement({
        targetUserId: selectedUser.id,
        planKey,
        durationDays,
        reason: reason || "Manual admin grant",
      });
      setMsg(`Granted ${planKey} to ${selectedUser.email || selectedUser.full_name}`);
      setModalType(null);
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    if (!selectedUser || !selectedUser.activeEntitlement) return;
    setLoading(true);
    setMsg(null);
    try {
      await revokeUserEntitlement({
        targetUserId: selectedUser.id,
        entitlementId: selectedUser.activeEntitlement.id,
        reason: reason || "Manual admin revocation",
      });
      setMsg(`Revoked entitlement for ${selectedUser.email}`);
      setModalType(null);
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetSessions() {
    if (!selectedUser) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await resetUserSessions({
        targetUserId: selectedUser.id,
        reason: reason || "Admin session reset",
      });
      setMsg(`Revoked ${res.count} active session(s) for ${selectedUser.email}`);
      setModalType(null);
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs font-medium text-foreground">
          {msg}
        </div>
      )}

      {/* Search Bar & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users by email, name, college, or plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5 font-semibold">User</th>
                <th className="px-5 py-3.5 font-semibold">Plan / Status</th>
                <th className="px-5 py-3.5 font-semibold">Source</th>
                <th className="px-5 py-3.5 font-semibold">Expires</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isIITB = u.email?.toLowerCase().endsWith("@iitb.ac.in");
                  const plan = u.activeEntitlement?.plan_key || (isIITB ? "iitb_free" : "free");
                  const isPro = plan.startsWith("pro_") || plan === "lifetime";

                  return (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold uppercase text-[11px]">
                            {(u.full_name || u.email || "U")[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{u.full_name || "Anonymous User"}</p>
                            <p className="text-muted-foreground text-[11px] font-mono">{u.email}</p>
                            {u.college && <p className="text-muted-foreground/80 text-[10px]">{u.college}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            isPro
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : isIITB
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isPro ? <Sparkles className="size-3" /> : isIITB ? <GraduationCap className="size-3" /> : null}
                          {plan.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground uppercase text-[10px]">
                        {u.activeEntitlement?.source || "system"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {u.activeEntitlement?.expires_at ? (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Clock className="size-3 text-primary" />
                            {format(new Date(u.activeEntitlement.expires_at), "dd MMM yyyy")}
                          </span>
                        ) : (
                          <span className="text-[11px]">Permanent / Active</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(u);
                              setModalType("grant");
                            }}
                            className="h-7 text-[11px] gap-1"
                          >
                            <Plus className="size-3" /> Grant Pro
                          </Button>
                          {isPro && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedUser(u);
                                setModalType("revoke");
                              }}
                              className="h-7 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              Revoke
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(u);
                              setModalType("sessions");
                            }}
                            title="Reset active device sessions"
                            className="h-7 text-[11px]"
                          >
                            <LogOut className="size-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant Modal */}
      {modalType === "grant" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Grant Pro Access</h3>
            <p className="text-xs text-muted-foreground">
              Manually assign or extend a Pro pass for <strong>{selectedUser.email}</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Plan Tier</label>
                <select
                  value={planKey}
                  onChange={(e) => setPlanKey(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-background p-2 text-xs"
                >
                  <option value="pro_30d">Pro (30 Days)</option>
                  <option value="pro_90d">Pro (90 Days)</option>
                  <option value="pro_365d">Pro (1 Year)</option>
                  <option value="lifetime">Lifetime Pro</option>
                </select>
              </div>

              {planKey !== "lifetime" && (
                <div>
                  <label className="font-semibold block mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value) || 30)}
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold block mb-1">Audit Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Manual payment via UPI, student promo, testing"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setModalType(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleGrant} disabled={loading}>
                Confirm Grant
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {modalType === "revoke" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-destructive">Revoke Entitlement</h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to revoke the active Pro access for <strong>{selectedUser.email}</strong>?
            </p>

            <input
              type="text"
              placeholder="Reason for revocation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2 text-xs"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setModalType(null)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleRevoke} disabled={loading}>
                Confirm Revocation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Sessions Modal */}
      {modalType === "sessions" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Reset User Sessions</h3>
            <p className="text-xs text-muted-foreground">
              Sign out all active device sessions for <strong>{selectedUser.email}</strong>.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setModalType(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleResetSessions} disabled={loading}>
                Reset All Sessions
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
