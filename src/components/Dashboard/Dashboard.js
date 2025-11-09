import Sidebar from "../Layout/Sidebar";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        {/* Sidebar */}
        <nav
          className="col-12 col-md-3 col-lg-2 bg-light border-end p-0 d-flex flex-column"
          style={{ minHeight: "100vh" }}
        >
          <Sidebar />
        </nav>

        {/* Contenido principal */}
        <main className="col-12 col-md-9 col-lg-10 p-4 overflow-auto">
          <Outlet /> {/* Aquí se renderizarán los subcomponentes según la ruta */}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
