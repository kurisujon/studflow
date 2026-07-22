import React from "react";

interface LandingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "muted" | "elevated" | "gradient" | "outline";
  padding?: "none" | "sm" | "md" | "lg";
  radius?: "md" | "lg" | "xl" | "2xl";
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function LandingCard({
  variant = "default",
  padding = "md",
  radius = "xl",
  children,
  className = "",
  hoverEffect = true,
  ...props
}: LandingCardProps) {
  const variantClasses = {
    default: "bg-white border border-[#E2E8F0] shadow-sm",
    muted: "bg-[#F8FAFC] border border-[#E2E8F0]",
    elevated: "bg-white border border-[#E2E8F0] shadow-[0_20px_40px_rgba(15,23,42,0.06)]",
    gradient: "bg-gradient-to-br from-white to-[#F8FAFC] border border-[#E2E8F0]",
    outline: "bg-transparent border border-[#E2E8F0]",
  }[variant];

  const paddingClasses = {
    none: "p-0",
    sm: "p-4 sm:p-5",
    md: "p-6 sm:p-8",
    lg: "p-8 sm:p-10 lg:p-12",
  }[padding];

  const radiusClasses = {
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-[24px]",
    "2xl": "rounded-[32px]",
  }[radius];

  const hoverClasses = hoverEffect
    ? "transition-all duration-300 hover:border-[#168BFF]/40 hover:shadow-lg hover:-translate-y-1"
    : "";

  return (
    <div
      className={`relative overflow-hidden ${variantClasses} ${paddingClasses} ${radiusClasses} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
