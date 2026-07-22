import React from "react";

interface LandingHeadingProps {
  level?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

export function LandingHeading({
  level = 2,
  children,
  subtitle,
  badge,
  align = "center",
  className = "",
}: LandingHeadingProps) {
  const alignClass = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  }[align];

  const sizeClasses = {
    1: "text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-[#0F172A]",
    2: "text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-[#0F172A]",
    3: "text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]",
    4: "text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A]",
  }[level];

  const Tag = `h${level}` as React.ElementType;

  return (
    <div className={`flex flex-col ${alignClass} mb-12 sm:mb-16 ${className}`}>
      {badge && <div className="mb-4">{badge}</div>}
      <Tag className={sizeClasses}>{children}</Tag>
      {subtitle && (
        <p className="mt-4 max-w-[720px] text-base sm:text-lg text-[#64748B] font-normal leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
