import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function MainLayout({ children, clusterHealth = "Healthy", leaderName = "Node 1", currentPage = "Dashboard", onPageChange }) {
  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans">

      <Navbar clusterHealth={clusterHealth} leaderName={leaderName} />

      <div className="flex flex-1 overflow-hidden">

        <Sidebar clusterHealth={clusterHealth} currentPage={currentPage} onPageChange={onPageChange} />

        <main className="flex-1 bg-transparent p-4 sm:p-6 lg:p-8 overflow-y-auto scroll-gpu">
          {children}
        </main>

      </div>

    </div>
  );
}

export default MainLayout;
