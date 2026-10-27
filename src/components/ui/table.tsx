import type { ComponentProps, ReactNode } from "react";
import { cn } from "./index";

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[720px] text-left text-sm [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-brand-50/50 [&_tbody_tr:last-child_td]:border-b-0">{children}</table>
    </div>
  );
}

export function Th({ children, className, ...props }: ComponentProps<"th">) {
  return (
    <th className={cn("whitespace-nowrap border-y border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400", className)} {...props}>
      {children}
    </th>
  );
}

export function Td({ children, className, ...props }: ComponentProps<"td">) {
  return (
    <td className={cn("border-b border-slate-100 px-5 py-3.5 align-middle", className)} {...props}>
      {children}
    </td>
  );
}

export function TableToolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">{children}</div>;
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="relative lg:w-72">
      <svg className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-50"
      />
    </label>
  );
}

export function Pagination({ total, label }: { total: number; label: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 text-sm text-slate-500">
      <span>
        {total} {label}
      </span>
      <div className="flex gap-1">
        {["‹", "1", "2", "3", "›"].map((p, i) => (
          <button key={i} className={cn("size-8 rounded-lg font-semibold transition", p === "1" ? "bg-brand-600 text-white" : "hover:bg-slate-100")}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
