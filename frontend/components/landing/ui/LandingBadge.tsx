import React from "react";

interface LandingBadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "accent" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function LandingBadge({
  children,
  variant = "primary",
  icon,
  className = "",
}: LandingBadgeProps) {
  const variantClasses = {
    primary: "bg-[#F0F7FF] text-[#168BFF] border-[#168BFF]/20",
    secondary: "bg-[#EEEDFC] text-[#4F46E5] border-[#4F46E5]/20",
    accent: "bg-[#F5F3FF] text-[#7C3AED] border-[#7C3AED]/20",
    neutral: "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]",
  }[variant];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide select-none ${variantClasses} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
