import Link from "next/link";
import Image from "next/image";

export function LandingFooter() {
  const links = [
    { label: "Features", href: "#features" },
    { label: "Documentation", href: "/docs" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Contact", href: "mailto:support@studflow.com" },
    { label: "GitHub", href: "https://github.com/kurisujon/studflow" }
  ];

  return (
    <footer className="w-full bg-[#0A0A0A] border-t border-white/10 flex flex-col items-center pt-16 pb-8">
      <div className="w-full max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
        
        {/* Brand */}
        <div className="flex flex-col items-center md:items-start gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-[#F9FAFB]">
            <Image src="/studflow_logo.png" alt="Studflow Logo" width={28} height={28} />
            Studflow
          </Link>
          <p className="text-[#A1A1AA] text-sm text-center md:text-left max-w-xs">
            The AI-powered learning workspace that transforms your documents into personalized study sessions.
          </p>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-4 text-center md:text-left">
          {links.map(link => (
            <Link 
              key={link.label}
              href={link.href}
              className="text-[#A1A1AA] hover:text-[#F9FAFB] text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="w-full max-w-7xl px-6 mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-[#A1A1AA] text-sm">
          © {new Date().getFullYear()} Studflow. All rights reserved.
        </p>
        <p className="text-[#A1A1AA] text-sm">
          Designed for better learning.
        </p>
      </div>
    </footer>
  );
}
