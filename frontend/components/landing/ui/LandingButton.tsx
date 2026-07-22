import React from "react";
import Link from "next/link";

interface LandingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  href?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function LandingButton({
  variant = "primary",
  size = "md",
  href,
  children,
  className = "",
  icon,
  ...props
}: LandingButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-bold transition-all duration-300 ease-out select-none active:scale-[0.98]";

  const variantClasses = {
    primary:
      "text-white bg-gradient-to-r from-[#5964FF] to-[#8640FF] shadow-md hover:shadow-lg hover:shadow-[#8640FF]/30 hover:-translate-y-1 overflow-hidden relative group",
    secondary:
      "text-[#4F46E5] bg-[#EEEDFC] hover:bg-[#E0E0FE] border border-[#4F46E5]/20 hover:-translate-y-0.5",
    ghost:
      "text-[#64748B] hover:text-[#168BFF] hover:bg-[#F0F7FF]",
    outline:
      "text-[#0F172A] bg-white border border-[#E2E8F0] hover:border-[#168BFF]/40 hover:text-[#168BFF] hover:shadow-sm hover:-translate-y-0.5",
  }[variant];

  const sizeClasses = {
    sm: "h-9 px-4 rounded-lg text-xs gap-1.5",
    md: "h-11 px-6 rounded-xl text-sm gap-2",
    lg: "h-13 sm:h-14 px-8 rounded-2xl text-base gap-2.5",
  }[size];

  const content = (
    <>
      {variant === "primary" && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      <span>{children}</span>
      {icon}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {content}
    </button>
  );
}
