"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  Crown,
  Flag,
  MessageCircle,
  Radio,
  Rocket,
  ShieldAlert,
  UserPlus,
  Users,
} from "lucide-react";
import { AppChrome } from "@/components/app-chrome";
import { cn } from "@/lib/utils";
import type { MemberRow, ReportRow, SiteOverview } from "@/lib/admin-stats";

type AdminDashboardProps = {
  data: SiteOverview;
  adminEmail: string;
};

const numberFormat = new Intl.NumberFormat("en-GB");

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        accent ? "border-[#ffc800]/40 bg-[#161200]" : "border-white/10 bg-white/[0.03]",
      )}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
        <Icon className={cn("size-3.5", accent && "text-[#ffc800]")} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-black text-white">
        {typeof value === "number" ? numberFormat.format(value) : value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "amber" | "sky";
}) {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-9 shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </span>
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-white/5">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "amber" ? "bg-[#ffc800]" : "bg-sky-400",
          )}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-bold tabular-nums text-zinc-300">
        {value}
      </span>
    </div>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-full object-cover"
        unoptimized
      />
    );
  }
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-zinc-300">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function AdminDashboard({ data, adminEmail }: AdminDashboardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { stats, activity, reports, members } = data;
  const maxSignups = Math.max(1, ...activity.map((point) => point.signups));
  const maxMessages = Math.max(1, ...activity.map((point) => point.messages));

  async function run(key: string, request: () => Promise<Response>) {
    setError(null);
    setBusyId(key);
    try {
      const res = await request();
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Action failed");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("Network error — try again");
    } finally {
      setBusyId(null);
    }
  }

  function moderateUser(id: string, action: string, tier?: string) {
    return run(`${action}:${id}`, () =>
      fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, tier }),
      }),
    );
  }

  function resolveReport(id: string) {
    return run(`report:${id}`, () =>
      fetch(`/api/admin/reports/${id}`, { method: "DELETE" }),
    );
  }

  const actionsDisabled = pending || busyId !== null;

  return (
    <AppChrome locationLabel="Admin · Site overview">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffc800]">
              Control room
            </p>
            <h1 className="mt-1 text-3xl font-black">Overlook the whole site</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Signed in as {adminEmail}. Live traffic, engagement, and moderation.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white"
          >
            Back to grid
          </Link>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard icon={Users} label="Members" value={stats.totalMembers} hint="Active accounts" />
          <StatCard
            icon={Radio}
            label="Online now"
            value={stats.onlineNow}
            hint={`${stats.activeRecently} active < 90 min`}
            accent
          />
          <StatCard
            icon={UserPlus}
            label="New today"
            value={stats.newToday}
            hint={`${stats.newThisWeek} this week`}
          />
          <StatCard
            icon={MessageCircle}
            label="Messages today"
            value={stats.messagesToday}
            hint={`${numberFormat.format(stats.messages)} all time`}
          />
          <StatCard icon={Crown} label="Unlimited" value={stats.unlimitedMembers} hint="Paying members" />
          <StatCard icon={Rocket} label="Boosted" value={stats.boostedMembers} hint="Promoted profiles" />
          <StatCard icon={Activity} label="Conversations" value={stats.conversations} hint={`${stats.meetups} meetups`} />
          <StatCard
            icon={ShieldAlert}
            label="Open reports"
            value={stats.openReports}
            hint={`${stats.suspendedMembers} suspended`}
            accent={stats.openReports > 0}
          />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="size-4 text-[#ffc800]" />
              <h2 className="text-sm font-black uppercase tracking-[0.14em]">Signups · 7 days</h2>
            </div>
            <div className="mt-4 space-y-2">
              {activity.map((point) => (
                <BarRow
                  key={`s-${point.day}`}
                  label={point.label}
                  value={point.signups}
                  max={maxSignups}
                  tone="amber"
                />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-4 text-sky-400" />
              <h2 className="text-sm font-black uppercase tracking-[0.14em]">Messages · 7 days</h2>
            </div>
            <div className="mt-4 space-y-2">
              {activity.map((point) => (
                <BarRow
                  key={`m-${point.day}`}
                  label={point.label}
                  value={point.messages}
                  max={maxMessages}
                  tone="sky"
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2">
            <Flag className="size-4 text-red-400" />
            <h2 className="text-sm font-black uppercase tracking-[0.14em]">Moderation queue</h2>
            <span className="ml-auto text-xs text-zinc-500">{reports.length} open</span>
          </div>
          {reports.length === 0 ? (
            <p className="mt-4 rounded-xl border border-white/10 bg-black/40 px-4 py-6 text-center text-sm text-zinc-500">
              Nothing to review. Reported members show up here.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  disabled={actionsDisabled}
                  busyId={busyId}
                  onSuspend={() =>
                    report.target && moderateUser(report.target.id, "suspend")
                  }
                  onResolve={() => resolveReport(report.id)}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-[#ffc800]" />
            <h2 className="text-sm font-black uppercase tracking-[0.14em]">Recent members</h2>
            <span className="ml-auto text-xs text-zinc-500">Newest {members.length}</span>
          </div>
          <ul className="mt-4 space-y-2">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                disabled={actionsDisabled}
                busyId={busyId}
                onBoost={() => moderateUser(member.id, member.isBoosted ? "unboost" : "boost")}
                onTier={() =>
                  moderateUser(member.id, "tier", member.unlimited ? "free" : "unlimited")
                }
                onSuspend={() =>
                  moderateUser(member.id, member.suspended ? "restore" : "suspend")
                }
              />
            ))}
          </ul>
        </section>
      </div>
    </AppChrome>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: "amber" | "green" | "zinc" | "red" }) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.1em]",
        tone === "amber" && "bg-[#ffc800] text-black",
        tone === "green" && "bg-emerald-400/20 text-emerald-300",
        tone === "zinc" && "bg-white/10 text-zinc-300",
        tone === "red" && "bg-red-500/20 text-red-300",
      )}
    >
      {children}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  busy,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  busy: boolean;
  tone?: "default" | "danger" | "amber";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors disabled:opacity-40",
        tone === "default" && "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10",
        tone === "amber" && "border-[#ffc800]/40 bg-[#ffc800]/10 text-[#ffc800] hover:bg-[#ffc800]/20",
        tone === "danger" && "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20",
      )}
    >
      {busy ? "…" : children}
    </button>
  );
}

function ReportCard({
  report,
  disabled,
  busyId,
  onSuspend,
  onResolve,
}: {
  report: ReportRow;
  disabled: boolean;
  busyId: string | null;
  onSuspend: () => void;
  onResolve: () => void;
}) {
  return (
    <li className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="flex items-start gap-3">
        <Avatar src={report.target?.image ?? null} name={report.target?.name ?? "?"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-white">
              {report.target?.name ?? "Deleted member"}
            </span>
            <Pill tone="red">{report.reason}</Pill>
            {report.target?.suspended ? <Pill tone="zinc">Suspended</Pill> : null}
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">
            Reported by {report.reporter?.name ?? "someone"} ·{" "}
            {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
          </p>
          {report.details ? (
            <p className="mt-1 line-clamp-2 text-xs text-zinc-500">“{report.details}”</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          {report.target && !report.target.suspended ? (
            <ActionButton
              onClick={onSuspend}
              disabled={disabled}
              busy={busyId === `suspend:${report.target.id}`}
              tone="danger"
            >
              Suspend
            </ActionButton>
          ) : null}
          <ActionButton
            onClick={onResolve}
            disabled={disabled}
            busy={busyId === `report:${report.id}`}
          >
            Resolve
          </ActionButton>
        </div>
      </div>
    </li>
  );
}

function MemberCard({
  member,
  disabled,
  busyId,
  onBoost,
  onTier,
  onSuspend,
}: {
  member: MemberRow;
  disabled: boolean;
  busyId: string | null;
  onBoost: () => void;
  onTier: () => void;
  onSuspend: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-2.5">
      <Avatar src={member.image} name={member.name} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-bold text-white">{member.name}</span>
          {member.unlimited ? <Pill tone="amber">Unlimited</Pill> : null}
          {member.isBoosted ? <Pill tone="amber">Boost</Pill> : null}
          {member.isOnline && !member.suspended ? <Pill tone="green">Online</Pill> : null}
          {member.suspended ? <Pill tone="red">Suspended</Pill> : null}
        </div>
        <p className="truncate text-[11px] text-zinc-500">
          {member.email ?? "no email"}
          {member.city ? ` · ${member.city}` : ""} · joined{" "}
          {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <ActionButton
          onClick={onBoost}
          disabled={disabled}
          busy={busyId === `boost:${member.id}` || busyId === `unboost:${member.id}`}
          tone={member.isBoosted ? "default" : "amber"}
        >
          {member.isBoosted ? "Unboost" : "Boost"}
        </ActionButton>
        <ActionButton
          onClick={onTier}
          disabled={disabled}
          busy={busyId === `tier:${member.id}`}
        >
          {member.unlimited ? "→ Free" : "→ Unlimited"}
        </ActionButton>
        <ActionButton
          onClick={onSuspend}
          disabled={disabled}
          busy={busyId === `suspend:${member.id}` || busyId === `restore:${member.id}`}
          tone={member.suspended ? "default" : "danger"}
        >
          {member.suspended ? "Restore" : "Suspend"}
        </ActionButton>
      </div>
    </li>
  );
}
