import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function MainLayout({ children, clusterHealth = "Healthy", leaderName = "Node 1", nodes = [], currentPage = "Dashboard", onPageChange, onLogout }) {
  return (
    <div className="h-screen bg-theme-base text-theme-primary flex flex-col overflow-hidden font-sans transition-colors duration-200">

      <Navbar clusterHealth={clusterHealth} leaderName={leaderName} nodes={nodes} onLogout={onLogout} />

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
