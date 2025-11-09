import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaChevronDown,
  FaChevronUp,
  FaBox,
  FaUsers,
  FaShoppingCart,
  FaFileAlt,
  FaChartBar,
  FaCog,
} from "react-icons/fa";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 🔹 Obtenemos la ruta actual
  const [openSection, setOpenSection] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("rol");
    localStorage.removeItem("permisos");
    navigate("/");
  };

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  // 🔹 Función para determinar si la ruta está activa
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="sidebar">
      {/* Título clickeable */}
      <div
        className="sidebar-header"
        onClick={() => navigate("/dashboard")}
        style={{ cursor: "pointer" }}
      >
        <h2>FLINK - FARES</h2>
      </div>

      <div className="sidebar-menu">
        {/* Parámetros */}
        <div className="menu-section">
          <div
            className={`menu-header ${openSection === "parametros" ? "active-section" : ""}`}
            onClick={() => toggleSection("parametros")}
          >
            <FaCog className="menu-icon" />
            <span>Parámetros</span>
            {openSection === "parametros" ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          {openSection === "parametros" && (
            <div className="menu-items">
              <Link className={isActive("/dashboard/parametros/productos") ? "active-link" : ""} to="/dashboard/parametros/productos">
                Productos
              </Link>
              <Link className={isActive("/dashboard/parametros/categorias") ? "active-link" : ""} to="/dashboard/parametros/categorias">
                Categorías
              </Link>
              <Link className={isActive("/dashboard/parametros/marcas") ? "active-link" : ""} to="/dashboard/parametros/marcas">
                Marcas
              </Link>
              <Link className={isActive("/dashboard/parametros/clientes") ? "active-link" : ""} to="/dashboard/parametros/clientes">
                Clientes
              </Link>
              <Link className={isActive("/dashboard/parametros/tipopago") ? "active-link" : ""} to="/dashboard/parametros/tipopago">
                Tipo de Pago
              </Link>
              <Link className={isActive("/dashboard/parametros/proveedores") ? "active-link" : ""} to="/dashboard/parametros/proveedores">
                Proveedores
              </Link>
            </div>
          )}
        </div>

        {/* Administración */}
        <div className="menu-section">
          <div
            className={`menu-header ${openSection === "administracion" ? "active-section" : ""}`}
            onClick={() => toggleSection("administracion")}
          >
            <FaUsers className="menu-icon" />
            <span>Administración</span>
            {openSection === "administracion" ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          {openSection === "administracion" && (
            <div className="menu-items">
              <Link className={isActive("/dashboard/administracion/crearusuario") ? "active-link" : ""} to="/dashboard/administracion/crearusuario">
                Crear Usuario
              </Link>
              <Link className={isActive("/dashboard/administracion/rolespermisos") ? "active-link" : ""} to="/dashboard/administracion/rolespermisos">
                Roles y Permisos
              </Link>
            </div>
          )}
        </div>

        {/* Ventas */}
        <div className="menu-section">
          <div
            className={`menu-header ${openSection === "ventas" ? "active-section" : ""}`}
            onClick={() => toggleSection("ventas")}
          >
            <FaShoppingCart className="menu-icon" />
            <span>Ventas</span>
            {openSection === "ventas" ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          {openSection === "ventas" && (
            <div className="menu-items">
              <Link className={isActive("/dashboard/ventas/facturacion") ? "active-link" : ""} to="/dashboard/ventas/facturacion">
                Facturación
              </Link>
            </div>
          )}
        </div>

        {/* Compras */}
        <div className="menu-section">
          <div
            className={`menu-header ${openSection === "compras" ? "active-section" : ""}`}
            onClick={() => toggleSection("compras")}
          >
            <FaBox className="menu-icon" />
            <span>Compras</span>
            {openSection === "compras" ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          {openSection === "compras" && (
            <div className="menu-items">
              <Link className={isActive("/dashboard/compras/ingreso") ? "active-link" : ""} to="/dashboard/compras/ingreso">
                Ingreso de Mercadería
              </Link>
            </div>
          )}
        </div>

        {/* Saldos */}
        <div className="menu-section">
          <div
            className={`menu-header ${openSection === "saldos" ? "active-section" : ""}`}
            onClick={() => toggleSection("saldos")}
          >
            <FaFileAlt className="menu-icon" />
            <span>Saldos</span>
            {openSection === "saldos" ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          {openSection === "saldos" && (
            <div className="menu-items">
              <Link className={isActive("/dashboard/saldos/abono-cliente") ? "active-link" : ""} to="/dashboard/saldos/abono-cliente">
                Abono Cliente
              </Link>
              <Link className={isActive("/dashboard/saldos/abono-proveedor") ? "active-link" : ""} to="/dashboard/saldos/abono-proveedor">
                Abono Proveedor
              </Link>
            </div>
          )}
        </div>

        {/* Reportes */}
        <div className="menu-section">
          <div
            className={`menu-header ${openSection === "reportes" ? "active-section" : ""}`}
            onClick={() => toggleSection("reportes")}
          >
            <FaChartBar className="menu-icon" />
            <span>Reportes</span>
            {openSection === "reportes" ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          {openSection === "reportes" && (
            <div className="menu-items">
              <Link className={isActive("/dashboard/reportes/ventas") ? "active-link" : ""} to="/dashboard/reportes/ventas">
                Ventas
              </Link>
              <Link className={isActive("/dashboard/reportes/compras") ? "active-link" : ""} to="/dashboard/reportes/compras">
                Compras
              </Link>
              <Link className={isActive("/dashboard/reportes/inventario") ? "active-link" : ""} to="/dashboard/reportes/inventario">
                Inventario (Kardex)
              </Link>
              <Link className={isActive("/dashboard/reportes/cuentas-cobrar") ? "active-link" : ""} to="/dashboard/reportes/cuentas-cobrar">
                Cuentas por Cobrar
              </Link>
              <Link className={isActive("/dashboard/reportes/cuentasporpagar") ? "active-link" : ""} to="/dashboard/reportes/cuentasporpagar">
                Cuentas por Pagar
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <button onClick={handleLogout}>Cerrar Sesión</button>
      </div>
    </div>
  );
};

export default Sidebar;
