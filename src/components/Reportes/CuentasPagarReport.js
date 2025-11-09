import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Table, Button, Spinner, Alert, Form, Modal } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

const CuentasPagarReport = () => {
  const [compras, setCompras] = useState([]);
  const [compraDetails, setCompraDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fechaDesde, setFechaDesde] = useState("2024-01-01");
  const [fechaHasta, setFechaHasta] = useState("2024-12-31");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCompras();
  }, []);

  const fetchCompras = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (fechaDesde) params.append("fecha_desde", fechaDesde);
      if (fechaHasta) params.append("fecha_hasta", fechaHasta);

      const res = await fetch(`http://localhost:5000/api/compras?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setCompras(data);
      if (data.length === 0) setError("No hay compras en el rango seleccionado.");
    } catch (err) {
      console.error("Error en fetchCompras:", err);
      setError("Error al cargar compras: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const verDetalles = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/compras/${id}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setCompraDetails(data);
      setShowModal(true);
    } catch (err) {
      setError("Error al cargar detalles de la compra: " + err.message);
    }
  };

  const limpiarFiltros = () => {
    setFechaDesde("");
    setFechaHasta("");
    fetchCompras();
  };

  const exportPDF = () => {
    if (compras.length === 0) {
      setError("No hay compras para exportar.");
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text("Reporte de Cuentas por Pagar", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(12);
    const rangoTexto = fechaDesde && fechaHasta
      ? `Rango: ${fechaDesde} al ${fechaHasta}`
      : "Todas las compras";
    doc.text(rangoTexto, pageWidth / 2, 30, { align: "center" });
    doc.text(
      `Fecha Reporte: ${new Date().toLocaleDateString()} | Compras: ${compras.length} | Total: Q ${compras.reduce((sum, c) => sum + Number(c.total), 0).toFixed(2)}`,
      pageWidth / 2,
      40,
      { align: "center" }
    );

    let y = 60;
    doc.setFontSize(10);
    doc.text("N° Factura", 20, y);
    doc.text("Proveedor", 70, y);
    doc.text("Total", 120, y);
    doc.text("Fecha", 160, y);
    doc.text("Tipo Pago", 210, y); // Ajusta posición para PDF
    y += 10;

    compras.forEach((c) => {
      if (y > 190) {
        doc.addPage();
        y = 20;
      }
      doc.text(c.numero_factura, 20, y);
      doc.text(c.proveedor_nombre, 70, y);
      doc.text(`Q${Number(c.total).toFixed(2)}`, 120, y);
      doc.text(new Date(c.fecha).toLocaleDateString(), 160, y);
      doc.text(c.tipo_pago || "-", 210, y);
      y += 10;
    });

    doc.save(`Reporte_CuentasPorPagar_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const exportExcel = () => {
    if (compras.length === 0) {
      setError("No hay compras para exportar.");
      return;
    }

    const wsData = compras.map(c => ({
      "N° Factura": c.numero_factura,
      "Proveedor": c.proveedor_nombre,
      "Total": Number(c.total).toFixed(2),
      "Fecha": new Date(c.fecha).toLocaleDateString(),
      "Tipo Pago": c.tipo_pago || "-"
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "CuentasPorPagar");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), `Reporte_CuentasPorPagar_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-center">📊 Reporte de Cuentas por Pagar</h2>

      <Form className="row g-3 mb-3">
        <div className="col-md-3">
          <Form.Label>Desde</Form.Label>
          <Form.Control type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
        </div>
        <div className="col-md-3">
          <Form.Label>Hasta</Form.Label>
          <Form.Control type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
        </div>
        <div className="col-md-6 d-flex align-items-end gap-2">
          <Button variant="primary" onClick={fetchCompras}>🔍 Buscar</Button>
          <Button variant="secondary" onClick={limpiarFiltros}>🧹 Limpiar</Button>
          <Button variant="success" onClick={exportPDF}>📄 Exportar PDF</Button>
          <Button variant="success" onClick={exportExcel}>📊 Exportar Excel</Button>
        </div>
      </Form>

      {loading && <div className="text-center my-3"><Spinner animation="border" /> Cargando compras...</div>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>N° Factura</th>
            <th>Proveedor</th>
            <th>Total</th>
            <th>Fecha</th>
            <th>Tipo Pago</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {compras.length > 0 ? (
            compras.map(c => (
              <tr key={c.id}>
                <td>{c.numero_factura}</td>
                <td>{c.proveedor_nombre}</td>
                <td>Q{Number(c.total).toFixed(2)}</td>
                <td>{new Date(c.fecha).toLocaleDateString()}</td>
                <td>{c.tipo_pago || "-"}</td>
                <td>
                  <Button variant="info" size="sm" onClick={() => verDetalles(c.id)}>Ver Detalles</Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">No hay datos disponibles</td>
            </tr>
          )}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalles de Factura #{compraDetails?.numero_factura}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {compraDetails ? (
            <>
              <p><b>Proveedor:</b> {compraDetails.proveedor_nombre}</p>
              <p><b>Fecha:</b> {new Date(compraDetails.fecha).toLocaleString()}</p>
              <p><b>Total:</b> Q{Number(compraDetails.total).toFixed(2)}</p>
              <p><b>Tipo Pago:</b> {compraDetails.tipo_pago || "-"}</p>

              {compraDetails.detalles && compraDetails.detalles.length > 0 ? (
                <Table striped bordered size="sm">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compraDetails.detalles.map((d, idx) => (
                      <tr key={idx}>
                        <td>{d.producto}</td>
                        <td>{d.cantidad}</td>
                        <td>Q{Number(d.precio).toFixed(2)}</td>
                        <td>Q{(d.cantidad * d.precio).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No hay productos registrados en esta compra.</p>
              )}
            </>
          ) : (
            <p>Cargando detalles...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CuentasPagarReport;
