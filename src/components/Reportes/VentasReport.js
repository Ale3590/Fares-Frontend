import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf'; // npm i jspdf
import * as XLSX from 'xlsx'; // npm i xlsx
import { saveAs } from 'file-saver'; // npm i file-saver
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Table, Spinner, Alert, Form } from 'react-bootstrap';

const VentasReport = () => {
  const [ventas, setVentas] = useState([]);
  const [ventaDetails, setVentaDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fechaDesde, setFechaDesde] = useState('2025-10-01');
  const [fechaHasta, setFechaHasta] = useState('2025-10-31');
  const [showModal, setShowModal] = useState(false);

useEffect(() => {
  fetchVentas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


  // 🔄 Obtener ventas del backend
  const fetchVentas = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (fechaDesde) params.append('fecha_desde', fechaDesde);
      if (fechaHasta) params.append('fecha_hasta', fechaHasta);

      const url = `http://localhost:5000/api/ventasreport?${params.toString()}`;
      console.log('🔍 Frontend fetch URL:', url);

      const res = await fetch(url);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errText}`);
      }

      const data = await res.json();
      setVentas(data);

      if (data.length === 0) {
        setError(`No hay ventas registradas entre ${fechaDesde} y ${fechaHasta}.`);
      }
    } catch (err) {
      console.error('Error fetch ventas:', err);
      setError('Error al cargar ventas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 📄 Ver detalles de una venta
  const verDetalles = async (ventaId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/ventasreport/${ventaId}`);
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const details = await res.json();
      setVentaDetails(details);
      setShowModal(true);
    } catch (err) {
      setError('Error al cargar detalles de venta: ' + err.message);
    }
  };

  // 🧹 Limpiar filtros
  const limpiarFiltros = () => {
    setFechaDesde('');
    setFechaHasta('');
    fetchVentas();
  };

  // 📄 Exportar a PDF
  const exportPDF = () => {
    if (ventas.length === 0) {
      setError('No hay ventas para exportar.');
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text('Reporte de Ventas ERP', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    const rangoTexto = fechaDesde && fechaHasta
      ? `Rango: ${fechaDesde} al ${fechaHasta}`
      : 'Todas las ventas';
    doc.text(rangoTexto, pageWidth / 2, 30, { align: 'center' });
    doc.text(
      `Fecha Reporte: ${new Date().toLocaleDateString()} | Ventas: ${ventas.length} | Total: Q ${ventas.reduce((sum, v) => sum + Number(v.total), 0).toFixed(2)}`,
      pageWidth / 2,
      40,
      { align: 'center' }
    );

    // Tabla
    let y = 60;
    doc.setFontSize(10);
    doc.text('No. Venta', 20, y);
    doc.text('Cliente', 70, y);
    doc.text('Total', 140, y);
    doc.text('Fecha', 170, y);
    doc.text('Estado', 210, y);
    y += 10;

    ventas.forEach((v) => {
      if (y > 190) {
        doc.addPage();
        y = 20;
      }
      doc.text(v.numero_venta || `VEN-${v.id}`, 20, y);
      doc.text(v.cliente_nombre || '-', 70, y);
      doc.text(`Q${Number(v.total).toFixed(2)}`, 140, y);
      doc.text(new Date(v.fecha).toLocaleDateString(), 170, y);
      doc.text(v.estado || 'pendiente', 210, y);
      y += 10;
    });

    doc.save(`Reporte_Ventas_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // 📊 Exportar Excel
  const exportExcel = () => {
    if (ventas.length === 0) {
      setError('No hay ventas para exportar.');
      return;
    }

    const wsData = ventas.map(v => ({
      'No. Venta': v.numero_venta,
      'Cliente': v.cliente_nombre,
      'Total': Number(v.total).toFixed(2),
      'Fecha': new Date(v.fecha).toLocaleDateString(),
      'Estado': v.estado,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Reporte_Ventas_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-center">📊 Reporte de Ventas</h2>

      {/* 🔍 Filtros */}
      <Form className="row g-3 mb-3">
        <div className="col-md-3">
          <Form.Label>Desde</Form.Label>
          <Form.Control
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <Form.Label>Hasta</Form.Label>
          <Form.Control
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>
        <div className="col-md-6 d-flex align-items-end gap-2">
          <Button variant="primary" onClick={fetchVentas}>
            🔍 Buscar
          </Button>
          <Button variant="secondary" onClick={limpiarFiltros}>
            🧹 Limpiar
          </Button>
          <Button variant="success" onClick={exportPDF}>
            📄 Exportar PDF
          </Button>
          <Button variant="success" onClick={exportExcel} className="ms-2">
            📊 Exportar Excel
          </Button>
        </div>
      </Form>

      {/* ⚠️ Mensajes */}
      {loading && (
        <div className="text-center my-3">
          <Spinner animation="border" /> Cargando ventas...
        </div>
      )}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* 📋 Tabla */}
      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>No. Venta</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {ventas.length > 0 ? (
            ventas.map((v) => (
              <tr key={v.id}>
                <td>{v.numero_venta}</td>
                <td>{v.cliente_nombre}</td>
                <td>Q{Number(v.total).toFixed(2)}</td>
                <td>{new Date(v.fecha).toLocaleDateString()}</td>
                <td>
                  <span
                    className={`badge ${v.estado === 'pagada' ? 'bg-success' : 'bg-warning text-dark'}`}
                  >
                    {v.estado}
                  </span>
                </td>
                <td>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => verDetalles(v.id)}
                  >
                    Ver Detalles
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">
                No hay ventas registradas en este rango.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* 🪟 Modal Detalles */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Detalles de Venta #{ventaDetails?.numero_venta || ventaDetails?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {ventaDetails ? (
            <>
              <p><b>Cliente:</b> {ventaDetails.cliente_nombre}</p>
              <p><b>Fecha:</b> {new Date(ventaDetails.fecha).toLocaleString()}</p>
              <p><b>Total de la venta:</b> Q{Number(ventaDetails.total).toFixed(2)}</p>

              {ventaDetails.detalles && ventaDetails.detalles.length > 0 ? (
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
                    {ventaDetails.detalles.map((d, idx) => (
                      <tr key={idx}>
                        {/* ✅ CAMBIO AQUÍ: d.nombre → d.producto */}
                        <td>{d.producto}</td>
                        <td>{d.cantidad}</td>
                        <td>Q{Number(d.precio).toFixed(2)}</td>
                        <td>Q{(d.cantidad * d.precio).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No hay productos en esta venta.</p>
              )}
            </>
          ) : (
            <p>Cargando detalles...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default VentasReport;