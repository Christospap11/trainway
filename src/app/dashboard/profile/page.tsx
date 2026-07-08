import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Mail, Calendar, BadgeCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getProfile } from "@/lib/queries";

export const metadata: Metadata = { title: "Profile" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default async function ProfilePage() {
  const user = await getSession();
  if (!user) return null;
  const profile = await getProfile(user.id);
  const { performance, qualified } = profile;
  const demoUser = {
    initials: profile.initials,
    name: profile.name,
    tier: profile.tier,
    email: profile.email,
    location: profile.country,
    memberSince: profile.memberSince,
    languages: profile.languages,
    skills: profile.skills,
  };

  const perf = [
    { label: "Quality score", value: `${performance.qualityScore}%` },
    { label: "Acceptance rate", value: `${performance.acceptanceRate}%` },
    { label: "Tasks completed", value: performance.tasksCompleted.toLocaleString() },
    { label: "Hours logged", value: `${performance.hoursLogged}h` },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold tracking-tight">Profile</h2>

      {/* identity card */}
      <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-brand-indigo via-brand-violet to-brand-fuchsia text-2xl font-semibold text-white">
            {demoUser.initials}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">{demoUser.name}</h3>
              <BadgeCheck size={18} className="text-primary" />
            </div>
            <span className="mt-1 inline-block rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
              {demoUser.tier}
            </span>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Mail size={14} /> {demoUser.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} /> {demoUser.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} /> Joined {fmtDate(demoUser.memberSince)}
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            className="rounded-full border border-ink/15 bg-ink/5 px-5 py-2 text-sm font-medium transition-colors hover:bg-ink/10"
          >
            Edit profile
          </Link>
        </div>
      </div>

      {/* performance */}
      <div>
        <h3 className="mb-4 font-semibold">Performance</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {perf.map((p) => (
            <div
              key={p.label}
              className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-5"
            >
              <div className="text-2xl font-semibold tracking-tight">
                {p.value}
              </div>
              <div className="mt-1 text-sm text-muted">{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* skills & languages */}
        <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
          <h3 className="font-semibold">Skills & languages</h3>
          <div className="mt-4">
            <div className="text-sm text-muted">Skills</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {demoUser.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-ink/10 bg-ink/5 px-3 py-1 text-sm"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <div className="text-sm text-muted">Languages</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {demoUser.languages.map((l) => (
                <span
                  key={l}
                  className="rounded-full border border-ink/10 bg-ink/5 px-3 py-1 text-sm"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* qualifications */}
        <div className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
          <h3 className="font-semibold">Qualifications</h3>
          <p className="mt-1 text-sm text-muted">
            Projects you&apos;re cleared to work on.
          </p>
          <div className="mt-4 space-y-3">
            {qualified.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <BadgeCheck size={18} className="shrink-0 text-emerald-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-muted">{p.taskType}</div>
                </div>
                <span className="text-sm font-semibold text-primary">
                  {p.payRate}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
