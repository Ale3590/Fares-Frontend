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
  FaUser,
  FaHome, // Agregado para el icono de Inicio
} from "react-icons/fa";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSection, setOpenSection] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [profileImage, setProfileImage] = useState(localStorage.getItem("profileImage") || null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("rol");
    localStorage.removeItem("permisos");
    localStorage.removeItem("profileImage");
    navigate("/");
  };

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result;
        setProfileImage(base64);
        localStorage.setItem("profileImage", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const usuario = JSON.parse(localStorage.getItem("usuario")) || {};
  const rol = localStorage.getItem("rol") || "Sin rol";
  const permisos = JSON.parse(localStorage.getItem("permisos")) || []; // Asumiendo que es un array

  return (
    <div className="d-flex flex-column vh-100 bg-dark text-white p-2" style={{ width: "250px" }}>
      {/* Título FARES y Logo (Imagen o Icono) */}
      <div className="mb-4 text-center">
        <div className="fw-bold fs-5 mb-2">FARES</div>
        <div
          className="cursor-pointer"
          onClick={() => setShowModal(true)}
          style={{ cursor: "pointer" }}
        >
          {profileImage ? (
            <img
              src={profileImage}
              alt="Perfil"
              className="rounded-circle"
              style={{ width: "80px", height: "80px", objectFit: "cover" }}
            />
          ) : (
            <FaUser size={80} />
          )}
        </div>
      </div>

      <div className="flex-grow-1">
        {/* Función para generar cada sección */}
        {[
          {
            key: "parametros",
            icon: <FaCog />,
            title: "Parámetros",
            links: [
              { path: "/dashboard/parametros/productos", label: "Productos" },
              { path: "/dashboard/parametros/categorias", label: "Categorías" },
              { path: "/dashboard/parametros/marcas", label: "Marcas" },
              { path: "/dashboard/parametros/clientes", label: "Clientes" },
              { path: "/dashboard/parametros/tipopago", label: "Tipo de Pago" },
              { path: "/dashboard/parametros/proveedores", label: "Proveedores" },
            ],
          },
          {
            key: "administracion",
            icon: <FaUsers />,
            title: "Administración",
            links: [
              { path: "/dashboard/administracion/crearusuario", label: "Crear Usuario" },
              { path: "/dashboard/administracion/rolespermisos", label: "Roles y Permisos" },
            ],
          },
          {
            key: "ventas",
            icon: <FaShoppingCart />,
            title: "Ventas",
            links: [
              { path: "/dashboard/ventas/facturacion", label: "Facturación" },
              { path: "/dashboard/ventas/pos", label: "Punto de Venta (POS)" },
            ],
          },
          {
            key: "compras",
            icon: <FaBox />,
            title: "Compras",
            links: [
              { path: "/dashboard/compras/ingreso", label: "Ingreso de Mercadería" },
            ],
          },
          {
            key: "saldos",
            icon: <FaFileAlt />,
            title: "Saldos",
            links: [
              { path: "/dashboard/saldos/abono-cliente", label: "Abono Cliente" },
              { path: "/dashboard/saldos/abono-proveedor", label: "Abono Proveedor" },
            ],
          },
          {
            key: "reportes",
            icon: <FaChartBar />,
            title: "Reportes",
            links: [
              { path: "/dashboard/reportes/ventas", label: "Ventas" },
              { path: "/dashboard/reportes/compras", label: "Compras" },
              { path: "/dashboard/reportes/inventario", label: "Inventario (Kardex)" },
              { path: "/dashboard/reportes/cuentas-cobrar", label: "Cuentas por Cobrar" },
              { path: "/dashboard/reportes/cuentasporpagar", label: "Cuentas por Pagar" },
            ],
          },
        ].map((section) => (
          <div key={section.key} className="mb-2">
            <button
              className="btn btn-dark w-100 d-flex justify-content-between align-items-center text-start"
              onClick={() => toggleSection(section.key)}
            >
              <span className="d-flex align-items-center gap-2">
                {section.icon} {section.title}
              </span>
              {openSection === section.key ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {openSection === section.key && (
              <div className="flex-column ps-3 mt-2">
                {section.links.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`btn btn-sm w-100 text-start text-white mb-1 ${isActive(link.path) ? "btn-primary" : "btn-dark"}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto">
        {/* Botón de Inicio */}
        <button className="btn btn-primary w-100 mb-2" onClick={() => navigate("/dashboard")}>
          <FaHome className="me-2" /> Inicio
        </button>
        <button className="btn btn-danger w-100" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div>

      {/* Modal de Perfil */}
      {showModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white p-4 rounded shadow"
            style={{ width: "400px", maxWidth: "90%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 className="text-center mb-3">Información del Usuario</h5>
            <div className="text-center mb-3">
              <img
                src={profileImage || "https://via.placeholder.com/100"}
                alt="Perfil"
                className="rounded-circle"
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
              />
              <div className="mt-2">
                <label className="form-label">Cambiar Imagen de Perfil</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="form-control"
                />
              </div>
            </div>
            <div className="mb-2">
              <strong>Nombre:</strong> {usuario.nombre || "No disponible"}
            </div>
            <div className="mb-2">
              <strong>Email:</strong> {usuario.email || "No disponible"}
            </div>
            <div className="mb-2">
              <strong>Rol:</strong> {rol}
            </div>
            <div className="mb-2">
              <strong>Permisos:</strong> {permisos.length > 0 ? permisos.join(", ") : "No disponibles"}
            </div>
            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

