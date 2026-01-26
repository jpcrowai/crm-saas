import Sidebar from "../components/Sidebar";

export default function TenantLayout({ children }) {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "24px", background: "#f5f6fa" }}>
        {children}
      </main>
    </div>
  );
}
