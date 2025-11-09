import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSearch, FaFileExcel, FaSync } from "react-icons/fa";

const API_URL = "http://localhost:5000/api";

const InventarioKardex = () => {
  const [productos, setProductos] = useState([]);
  const [kardex, setKardex] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Cargar productos desde el backend
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await axios.get(`${API_URL}/parametros/productos`);
        setProductos(res.data);
        console.log("✅ Productos cargados:", res.data);
      } catch (error) {
        console.error("❌ Error al cargar productos:", error);
      }
    };
    fetchProductos();
  }, []);

  // 🔹 Consultar movimientos del Kardex
  const buscarKardex = async () => {
    if (!productoSeleccionado) {
      alert("Seleccione un producto para consultar el Kardex.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/reportes/kardex/${productoSeleccionado}`, {
        params: { fechaInicio, fechaFin },
      });
      setKardex(res.data);
      console.log("✅ Movimientos obtenidos:", res.data);
    } catch (error) {
      console.error("❌ Error al obtener Kardex:", error);
      alert("Error al consultar el Kardex.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Limpiar formulario
  const limpiar = () => {
    setProductoSeleccionado("");
    setFechaInicio("");
    setFechaFin("");
    setKardex([]);
  };

  // 🔹 Exportar a Excel
  const exportarExcel = () => {
    if (kardex.length === 0) return;
    const encabezado =
      "Fecha\tTipo Movimiento\tDocumento\tEntrada\tSalida\tSaldo\n";
    const filas = kardex
      .map(
        (item) =>
          `${item.fecha}\t${item.tipo}\t${item.documento}\t${item.entrada}\t${item.salida}\t${item.saldo}`
      )
      .join("\n");
    const contenido = encabezado + filas;

    const blob = new Blob([contenido], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.setAttribute("download", "KardexProducto.xls");
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-lg">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">📦 Kardex de Inventario</h5>
          <div>
            <button
              className="btn btn-success btn-sm me-2"
              onClick={exportarExcel}
              disabled={kardex.length === 0}
            >
              <FaFileExcel /> Exportar
            </button>
            <button className="btn btn-secondary btn-sm" onClick={limpiar}>
              <FaSync /> Limpiar
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* 🔸 Filtros */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Producto</label>
              <select
                className="form-select"
                value={productoSeleccionado}
                onChange={(e) => setProductoSeleccionado(e.target.value)}
              >
                <option value="">Seleccione un producto</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} - {p.nombre} ({p.marca})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Fecha Inicio</label>
              <input
                type="date"
                className="form-control"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Fecha Fin</label>
              <input
                type="date"
                className="form-control"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-primary w-100"
                onClick={buscarKardex}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <>
                    <FaSearch /> Buscar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 🔸 Tabla Kardex */}
          {kardex.length > 0 ? (
            <div
              className="table-responsive"
              style={{ maxHeight: "65vh", overflowY: "auto" }}
            >
              <table className="table table-striped table-hover">
                <thead className="table-primary sticky-top">
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo Movimiento</th>
                    <th>Documento</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {kardex.map((item, index) => (
                    <tr key={index}>
                      <td>{item.fecha}</td>
                      <td>{item.tipo}</td>
                      <td>{item.documento}</td>
                      <td>{item.entrada}</td>
                      <td>{item.salida}</td>
                      <td>{item.saldo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !loading && (
              <div className="text-center text-muted mt-4">
                No hay movimientos para mostrar.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default InventarioKardex;
