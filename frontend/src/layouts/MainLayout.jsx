import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      <Navbar />

      <div className="flex flex-1">

        <Sidebar />

        <main className="flex-1 bg-slate-50 pt-8 px-8 pb-8 overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
}

export default MainLayout;