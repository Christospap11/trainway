"use client";

import { useState } from "react";

const MIN_RATE = 20;
const MAX_RATE = 40;
const WEEKS_PER_MONTH = 4.33;

const MIN_HOURS = 2;
const MAX_HOURS = 40;

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/**
 * Drag-to-explore earnings estimate. Deliberately shows a range rather than a
 * single number — pay depends on the project and the trainer's qualifications,
 * and quoting one figure would read as a promise we can't make.
 */
export function EarningsCalculator() {
  const [hours, setHours] = useState(12);

  const pct = ((hours - MIN_HOURS) / (MAX_HOURS - MIN_HOURS)) * 100;
  const monthLow = hours * MIN_RATE * WEEKS_PER_MONTH;
  const monthHigh = hours * MAX_RATE * WEEKS_PER_MONTH;

  return (
    <div>
      <div className="text-sm uppercase tracking-[0.2em] text-muted">
        Estimate your earnings
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-gradient text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
          {money(monthLow)}–{money(monthHigh)}
        </span>
      </div>
      <div className="mt-1 text-xl text-muted">per month</div>

      <div className="mt-8">
        <label
          htmlFor="hours"
          className="flex items-baseline justify-between text-sm"
        >
          <span className="text-muted">Hours per week</span>
          <span className="text-lg font-medium tabular-nums">{hours}</span>
        </label>

        <input
          id="hours"
          type="range"
          min={MIN_HOURS}
          max={MAX_HOURS}
          step={1}
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          style={{ "--pct": `${pct}%` } as React.CSSProperties}
          className="range-brand mt-3 h-6 w-full"
          aria-describedby="hours-help"
        />

        <div
          id="hours-help"
          className="mt-1 flex justify-between text-xs text-muted"
        >
          <span>{MIN_HOURS} hrs</span>
          <span>
            at ${MIN_RATE}–{MAX_RATE}/hour
          </span>
          <span>{MAX_HOURS} hrs</span>
        </div>
      </div>

      <p className="mt-6 max-w-sm text-sm text-muted">
        An estimate, not a guarantee — rates vary by project complexity and the
        qualifications you hold. There is no minimum commitment.
      </p>
    </div>
  );
}
