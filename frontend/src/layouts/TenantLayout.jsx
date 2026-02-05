import { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { getCalendarInfo } from "../services/api";

export default function TenantLayout({ children }) {
  useEffect(() => {
    // Proactively check/refresh Google Calendar connection when entering the platform
    getCalendarInfo().catch(() => { });
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "24px", background: "#f5f6fa" }}>
        {children}
      </main>
    </div>
  );
}
