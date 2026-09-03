import { useState } from "react";
import { cx } from "../lib/core";
import { useStore } from "../lib/store";
import { IBell, ICheck, IListChecks, IPlus, ISpark, IX } from "../components/Icons";
import { useToast } from "../components/ui";

export function ListsTab() {
  const store = useStore();
  const { state } = store;
  const { push } = useToast();
  const [checkInput, setCheckInput] = useState("");
  const [remInput, setRemInput] = useState("");

  const done = state.checklist.filter((c) => c.done).length;
  const total = state.checklist.length;
  const remaining = total - done;
  const pct = total ? (done / total) * 100 : 0;

  const addCheck = () => {
    if (!checkInput.trim()) return;
    store.addCheck(checkInput);
    setCheckInput("");
    push(`“${checkInput.trim()}” added to the list`);
  };
  const addRem = () => {
    if (!remInput.trim()) return;
    store.addReminder(remInput);
    setRemInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-2 pt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-faint">Plan before you go</p>
        <h1 className="font-display text-[24px] font-extrabold leading-tight">Shopping Lists</h1>
      </div>

      <div className="stagger flex-1 space-y-3 overflow-y-auto px-5 pb-6 scroll-thin">
        {/* checklist */}
        <div className="rounded-[16px] border border-line bg-raise p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand">
                <IListChecks size={16} />
              </span>
              <p className="font-display text-[15px] font-bold">Checklist</p>
            </div>
            <span className={cx(
              "rounded-full px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums",
              remaining === 0 && total > 0 ? "bg-brand-soft text-brand-deep" : "bg-surface text-soft ring-1 ring-line",
            )}>
              {total === 0 ? "empty" : remaining === 0 ? "all done" : `${remaining} remaining`}
            </span>
          </div>

          {total > 0 && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface ring-1 ring-line">
              <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <input
              value={checkInput}
              onChange={(e) => setCheckInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCheck()}
              placeholder="e.g. Cooking oil"
              className="w-full rounded-full border border-line bg-surface px-4 py-2.5 text-[13.5px] placeholder:text-faint focus:border-brand"
            />
            <button onClick={addCheck} className="press flex h-10 w-10 flex-none items-center justify-center self-center rounded-full bg-brand text-white" aria-label="Add item">
              <IPlus size={17} />
            </button>
          </div>

          <div className="mt-3 space-y-1">
            {state.checklist.map((c) => (
              <div key={c.id} className="group flex items-center gap-3 rounded-[11px] px-1.5 py-1.5 hover:bg-surface">
                <button
                  onClick={() => store.toggleCheck(c.id)}
                  className={cx(
                    "press flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 transition-colors",
                    c.done ? "border-brand bg-brand text-white" : "border-line bg-raise text-transparent",
                  )}
                  aria-label={`Toggle ${c.name}`}
                >
                  <ICheck size={13} />
                </button>
                <span className={cx("flex-1 text-[13.5px] font-semibold transition-all", c.done && "text-faint line-through")}>
                  {c.name}
                </span>
                <button
                  onClick={() => store.removeCheck(c.id)}
                  className="press flex h-7 w-7 items-center justify-center rounded-full text-faint opacity-60 hover:bg-danger-soft hover:text-danger"
                  aria-label={`Remove ${c.name}`}
                >
                  <IX size={13} />
                </button>
              </div>
            ))}
            {total === 0 && (
              <p className="rounded-[12px] border border-dashed border-line px-4 py-5 text-center text-[12.5px] text-faint">
                Write what you need before you leave home — scanned items tick themselves off.
              </p>
            )}
          </div>

          {done > 0 && (
            <button onClick={() => { store.resetChecks(); push("Checklist reset for the next run"); }} className="press mt-2 w-full rounded-full border border-line bg-surface py-2 text-[12px] font-semibold text-soft">
              Reset ticks for next trip
            </button>
          )}
        </div>

        <div className="flex items-start gap-2.5 rounded-[14px] border border-brand/20 bg-brand-soft px-4 py-3">
          <ISpark size={16} className="mt-0.5 flex-none text-brand" />
          <p className="text-[12px] leading-relaxed text-brand-deep dark:text-brand">
            Scan <strong>Milk</strong> in the store and the matching checklist entry is ticked automatically — the
            “remaining” count updates live while you shop.
          </p>
        </div>

        {/* reminders */}
        <div className="rounded-[16px] border border-line bg-raise p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-soft text-amber">
              <IBell size={16} />
            </span>
            <p className="font-display text-[15px] font-bold">Reminders</p>
            <span className="ml-auto text-[11px] font-semibold text-faint">optional</span>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={remInput}
              onChange={(e) => setRemInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRem()}
              placeholder="e.g. Weekly shopping — Sunday 10 AM"
              className="w-full rounded-full border border-line bg-surface px-4 py-2.5 text-[13.5px] placeholder:text-faint focus:border-brand"
            />
            <button onClick={addRem} className="press flex h-10 w-10 flex-none items-center justify-center self-center rounded-full bg-amber text-[#241a04]" aria-label="Add reminder">
              <IPlus size={17} />
            </button>
          </div>
          <div className="mt-2.5 space-y-1">
            {state.reminders.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-[11px] px-1.5 py-1.5 hover:bg-surface">
                <IBell size={14} className="flex-none text-amber" />
                <span className="flex-1 text-[13px] font-semibold">{r.text}</span>
                <button onClick={() => store.removeReminder(r.id)} className="press flex h-7 w-7 items-center justify-center rounded-full text-faint hover:bg-danger-soft hover:text-danger" aria-label="Remove reminder">
                  <IX size={13} />
                </button>
              </div>
            ))}
            {state.reminders.length === 0 && (
              <p className="px-1 py-2 text-center text-[12px] text-faint">No reminders — enjoy the quiet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
