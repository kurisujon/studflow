import React from "react";

interface LandingSectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: "none" | "sm" | "md" | "lg" | "xl";
  background?: "default" | "muted" | "card" | "gradient" | "transparent";
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const LandingSection = React.forwardRef<HTMLElement, LandingSectionProps>(
  (
    {
      spacing = "md",
      background = "transparent",
      children,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const spacingClasses = {
      none: "py-0",
      sm: "py-8 sm:py-12 lg:py-16",
      md: "py-12 sm:py-16 lg:py-24",
      lg: "py-16 sm:py-24 lg:py-32",
      xl: "py-20 sm:py-32 lg:py-40",
    }[spacing];

    const backgroundClasses = {
      transparent: "",
      default: "bg-[#F8FAFC]",
      muted: "bg-[#F1F5F9]",
      card: "bg-white",
      gradient: "bg-gradient-to-b from-[#F8FAFC] to-white",
    }[background];

    return (
      <section
        ref={ref}
        id={id}
        className={`relative w-full scroll-mt-20 ${spacingClasses} ${backgroundClasses} ${className}`}
        {...props}
      >
        {children}
      </section>
    );
  }
);

LandingSection.displayName = "LandingSection";
