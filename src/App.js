import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login/Login";
import Dashboard from "./components/Dashboard/Dashboard";

// ===================
// Dashboard principal
// ===================
import HomeDashboard from "./components/Dashboard/HomeDashboard";

// ===================
// Parámetros
// ===================
import Productos from "./components/Parametros/Productos";
import Categorias from "./components/Parametros/Categorias";
import Clientes from "./components/Parametros/Clientes";
import Marcas from "./components/Parametros/Marcas";
import TiposPago from "./components/Parametros/TiposPago";
import Proveedores from "./components/Proveedores/Proveedores";

// ===================
// Administración
// ===================
import CrearUsuario from "./components/Administracion/CrearUsuario";
import RolesPermisos from "./components/Administracion/RolesPermisos";

// ===================
// Ventas
// ===================
import Facturacion from "./components/Ventas/Facturacion";
import Devolucion from "./components/Ventas/Devolucion";
import POS from "./components/Ventas/POS"; // ✅ Importación corregida

// ===================
// Inventario
// ===================
import Movimientos from "./components/Inventario/Movimientos";
import Stock from "./components/Inventario/Stock";

// ===================
// Reportes
// ===================
import VentasReport from "./components/Reportes/VentasReport";
import ComprasReport from "./components/Reportes/ComprasReport";
import InventarioKardex from "./components/Reportes/InventarioKardex";
import CuentasPorCobrar from "./components/Reportes/CuentasPorCobrar";
import CuentasPagarReport from "./components/Reportes/CuentasPagarReport";

// ===================
// Compras
// ===================
import IngresoMercaderia from "./components/Compras/IngresoMercaderia";

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal */}
        <Route path="/" element={<Login />} />

        {/* Dashboard con subrutas */}
        <Route path="/dashboard/*" element={<Dashboard />}>
          {/* Ruta inicial del Dashboard */}
          <Route index element={<HomeDashboard />} />

          {/* Parámetros */}
          <Route path="parametros/productos" element={<Productos />} />
          <Route path="parametros/categorias" element={<Categorias />} />
          <Route path="parametros/clientes" element={<Clientes />} />
          <Route path="parametros/marcas" element={<Marcas />} />
          <Route path="parametros/tipopago" element={<TiposPago />} />
          <Route path="parametros/proveedores" element={<Proveedores />} />

          {/* Administración */}
          <Route path="administracion/crearusuario" element={<CrearUsuario />} />
          <Route path="administracion/rolespermisos" element={<RolesPermisos />} />

          {/* Ventas */}
          <Route path="ventas/facturacion" element={<Facturacion />} />
          <Route path="ventas/devolucion" element={<Devolucion />} />
          <Route path="ventas/pos" element={<POS />} /> {/* ✅ Ruta POS agregada */}

          {/* Inventario */}
          <Route path="inventario/movimientos" element={<Movimientos />} />
          <Route path="inventario/stock" element={<Stock />} />

          {/* Reportes */}
          <Route path="reportes/ventas" element={<VentasReport />} />
          <Route path="reportes/compras" element={<ComprasReport />} />
          <Route path="reportes/inventario" element={<InventarioKardex />} />
          <Route path="reportes/cuentas-cobrar" element={<CuentasPorCobrar />} />
          <Route path="reportes/cuentasporpagar" element={<CuentasPagarReport />} />

          {/* Compras */}
          <Route path="compras/ingreso" element={<IngresoMercaderia />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
