"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
  userEmail?: string;
}

function IconDashboard() {
  return (
    <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function IconMirror() {
  return (
    <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9V5.25a.75.75 0 01.75-.75H8.25M3.75 15v3.75c0 .414.336.75.75.75H8.25M15.75 4.5h3.75c.414 0 .75.336.75.75V9M15.75 19.5h3.75a.75.75 0 00.75-.75V15" />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", Icon: IconDashboard },
  { href: "/mirror",    label: "The Mirror", Icon: IconMirror },
  { href: "/history",   label: "History",    Icon: IconHistory },
] as const;

export default function Layout({ children, userEmail }: LayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar */}
      <aside className="w-[210px] flex-shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col">

        {/* Logo */}
        <div style={{ padding: "20px 24px 24px" }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "18px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px" }}>
            Proof
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0">
          <div>
            {NAV_ITEMS.map(({ href, label, Icon }) => {
              const active =
                pathname === href ||
                (href === "/mirror" && (pathname?.startsWith("/mirror") ?? false));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-[4px] mx-2 mb-1 px-4 py-2 rounded-lg text-[13px] transition-colors ${
                    active
                      ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                      : "text-[#475569] font-normal hover:bg-[#F1F5F9]"
                  }`}
                >
                  <Icon />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User avatar — pinned to bottom */}
        {userEmail && (
          <div style={{ borderTop: "1px solid #E2E8F0", padding: "16px" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                <span className="text-[#2563EB] text-[12px] font-semibold">
                  {userEmail.split("@")[0].slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="text-[13px] text-[#475569] truncate">
                {userEmail.split("@")[0]}
              </span>
            </div>
          </div>
        )}

      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 bg-[#F8FAFC] overflow-hidden">
        {children}
      </main>

    </div>
  );
}
