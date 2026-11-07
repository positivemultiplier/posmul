import React from "react";
import { cn } from "@/shared/ui/utils/cn";

/**
 * shadcn/ui Dark Theme Admin Primitives (zinc-950 / zinc-900 / zinc-800)
 */

export function AdminCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800/80 bg-[#0c0d12] text-zinc-100 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AdminCardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function AdminCardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-bold leading-none tracking-tight text-zinc-100 text-sm sm:text-base",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function AdminCardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs text-zinc-400 leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function AdminCardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

export function AdminCardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center p-5 pt-0 border-t border-zinc-800/60 mt-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type AdminBadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "destructive"
  | "live"
  | "info";

export function AdminBadge({
  className,
  variant = "default",
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: AdminBadgeVariant }) {
  const variants: Record<AdminBadgeVariant, string> = {
    default: "bg-zinc-100 text-zinc-900 border-transparent",
    secondary: "bg-zinc-800/90 text-zinc-200 border-zinc-700/60",
    outline: "bg-transparent text-zinc-300 border-zinc-700",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    destructive: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    live: "bg-red-500/20 text-red-400 border-red-500/40",
    info: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export type AdminButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "amber"
  | "emerald";

export function AdminButton({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AdminButtonVariant;
  size?: "sm" | "default" | "lg" | "icon";
}) {
  const variants: Record<AdminButtonVariant, string> = {
    default:
      "bg-zinc-100 text-zinc-950 hover:bg-white shadow-sm font-bold",
    secondary:
      "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700/80 font-semibold",
    outline:
      "border border-zinc-800 bg-[#0c0d12] hover:bg-zinc-900 text-zinc-200 font-semibold",
    ghost: "hover:bg-zinc-800/70 text-zinc-300 hover:text-white font-medium",
    destructive:
      "bg-rose-600 text-white hover:bg-rose-500 shadow-sm font-bold",
    amber:
      "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm font-extrabold",
    emerald:
      "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm font-bold",
  };

  const sizes = {
    sm: "h-8 rounded-lg px-3 text-xs",
    default: "h-9 rounded-lg px-4 py-2 text-xs",
    lg: "h-10 rounded-xl px-5 text-sm",
    icon: "h-8 w-8 rounded-lg flex items-center justify-center",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminTable({
  className,
  children,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto rounded-lg border border-zinc-800/80">
      <table
        className={cn("w-full caption-bottom text-xs", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function AdminTableHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("bg-zinc-900/80 border-b border-zinc-800/80", className)}
      {...props}
    >
      {children}
    </thead>
  );
}

export function AdminTableBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn("divide-y divide-zinc-800/60 bg-[#0c0d12]", className)}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function AdminTableRow({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-zinc-900/50 data-[state=selected]:bg-zinc-900",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function AdminTableHead({
  className,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-10 px-4 text-left align-middle font-bold text-zinc-400 tracking-wide uppercase text-[11px]",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function AdminTableCell({
  className,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("p-3.5 px-4 align-middle text-zinc-200", className)}
      {...props}
    >
      {children}
    </td>
  );
}

