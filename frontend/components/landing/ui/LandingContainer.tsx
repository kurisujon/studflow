import React from "react";

interface LandingContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "narrow" | "wide";
  children: React.ReactNode;
  className?: string;
}

export function LandingContainer({
  variant = "default",
  children,
  className = "",
  ...props
}: LandingContainerProps) {
  const maxWidthClass = {
    narrow: "max-w-[900px]",
    default: "max-w-[1200px]",
    wide: "max-w-[1320px]",
  }[variant];

  return (
    <div
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${maxWidthClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
