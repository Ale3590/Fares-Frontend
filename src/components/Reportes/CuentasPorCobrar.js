// frontend/src/components/Reportes/CuentasPorCobrar.js
import React, { useState, useEffect } from "react";
import axios from "axios";

const CuentasPorCobrar = () => {
  const [clientes, setClientes] = useState([]);
  const [ventasCredito, setVentasCredito] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // 🔹 Cargar clientes tipo crédito
  useEffect(() => {
    const fetchClientesCredito = async () => {
      try {
        const res = await axios.get("/api/clientes"); // Ajusta según tu ruta
        const credito = res.data.filter(c => c.tipo_pago === "credito");
        setClientes(credito);
      } catch (err) {
        console.error("Error fetch clientes crédito:", err);
      }
    };
    fetchClientesCredito();
  }, []);

  // 🔹 Filtrar ventas por cliente crédito y rango de fechas
  const fetchVentasCredito = async () => {
    if (!fechaDesde || !fechaHasta) {
      alert("Ingresa fecha desde y hasta");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get("/api/ventasreport", {
        params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta }
      });

      // 🔹 Filtrar solo ventas de clientes crédito y con estado pendiente
      const ventasFiltradas = res.data.filter(
        v => clientes.some(c => c.id === v.cliente_id) && v.estado === "pendiente"
      );

      setVentasCredito(ventasFiltradas);
    } catch (err) {
      console.error("Error fetch ventas crédito:", err);
      alert("Error al cargar ventas crédito");
    }
    setLoading(false);
  };

  // 🔹 Calcular total pendiente
  const totalPendiente = ventasCredito.reduce((acc, v) => acc + Number(v.total), 0);

  return (
    <div className="container mt-4">
      <h3>Cuentas por Cobrar</h3>

      <div className="row mb-3">
        <div className="col-md-3">
          <label>Fecha desde:</label>
          <input
            type="date"
            className="form-control"
            value={fechaDesde}
            onChange={e => setFechaDesde(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label>Fecha hasta:</label>
          <input
            type="date"
            className="form-control"
            value={fechaHasta}
            onChange={e => setFechaHasta(e.target.value)}
          />
        </div>
        <div className="col-md-3 align-self-end">
          <button className="btn btn-primary" onClick={fetchVentasCredito}>
            Filtrar
          </button>
        </div>
      </div>

      {loading && <p>Cargando ventas...</p>}

      <div className="mb-3">
        <strong>Total pendiente: </strong> Q{totalPendiente.toFixed(2)}
      </div>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Número de venta</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {ventasCredito.map(v => (
            <tr key={v.id}>
              <td>{v.cliente_nombre}</td>
              <td>{v.numero_venta}</td>
              <td>{new Date(v.fecha).toLocaleDateString()}</td>
              <td>{Number(v.total).toFixed(2)}</td>
              <td>{v.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CuentasPorCobrar;
