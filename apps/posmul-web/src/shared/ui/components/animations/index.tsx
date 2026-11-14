"use client";

import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({ children, className }: FadeInProps) {
  return (
    <div className={cn("animate-in fade-in duration-300", className)}>
      {children}
    </div>
  );
}

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function ScaleIn({ children, className }: ScaleInProps) {
  return (
    <div className={cn("animate-in zoom-in-95 duration-300", className)}>
      {children}
    </div>
  );
}

interface HoverLiftProps {
  children: ReactNode;
  className?: string;
}

export function HoverLift({ children, className }: HoverLiftProps) {
  return (
    <div
      className={cn(
        "transition-transform duration-200 ease-out hover:-translate-y-2 hover:scale-[1.02]",
        className
      )}
    >
      {children}
    </div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
}

export function StaggerContainer({ children, className }: StaggerContainerProps) {
  return <div className={className}>{children}</div>;
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("animate-in fade-in duration-300", className)}>
      {children}
    </div>
  );
}
