import type { ReactNode } from "react";
import Footer from "~/components/layout/Footer";
import Header from "~/components/layout/Header";
import { useDayMode } from "~/hooks/useDayMode";

interface PageShellProps {
  children: (isDayMode: boolean) => ReactNode;
}

export default function PageShell({ children }: PageShellProps) {
  const [isDayMode, toggleDayMode] = useDayMode();
  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${isDayMode ? "bg-white" : "bg-black"}`}>
      <div className="print:hidden">
        <Header isDayMode={isDayMode} onToggleDayMode={toggleDayMode} />
      </div>
      <main className="flex-1">{children(isDayMode)}</main>
      <div className="print:hidden">
        <Footer isDayMode={isDayMode} />
      </div>
    </div>
  );
}
