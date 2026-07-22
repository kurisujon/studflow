"use client";

import { Navbar } from "@/components/navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main
        style={{
          minHeight: "calc(100dvh - var(--nav-height))",
          paddingTop: "var(--nav-height)",
        }}
      >
        {children}
      </main>
    </>
  );
}
