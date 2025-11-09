import React, { useEffect, useState } from "react";
import axios from "axios";

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tiposPago, setTiposPago] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    codigo: "",
    nombre: "",
    nit: "",
    direccion: "",
    telefono: "",
    correo: "",
    tipo_pago_id: 1, // por defecto "contado"
    activo: true,
  });
  const [modo, setModo] = useState("create");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchProveedores();
    fetchTiposPago();
  }, []);

  const fetchProveedores = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/proveedores");
      setProveedores(res.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los proveedores");
    } finally {
      setLoading(false);
    }
  };

  const fetchTiposPago = async () => {
    // Puedes cargar dinámicamente desde tu tabla tipos_pago si quieres
    setTiposPago([
      { id: 1, nombre: "contado" },
      { id: 2, nombre: "credito" },
    ]);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "tipo_pago_id" ? Number(value) : value,
    }));
    if (error) setError("");
  };

  const handleEdit = (prov) => {
    setFormData({
      id: prov.id,
      codigo: prov.codigo || "",
      nombre: prov.nombre || "",
      nit: prov.nit || "",
      direccion: prov.direccion || "",
      telefono: prov.telefono || "",
      correo: prov.correo || "",
      tipo_pago_id: prov.tipo_pago_id || 1,
      activo: prov.activo !== false,
    });
    setModo("edit");
    setSuccess("");
    document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCancel = () => {
    setFormData({
      id: "",
      codigo: "",
      nombre: "",
      nit: "",
      direccion: "",
      telefono: "",
      correo: "",
      tipo_pago_id: 1,
      activo: true,
    });
    setModo("create");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    if (!formData.codigo.trim() || !formData.nombre.trim() || !formData.tipo_pago_id) {
      setError("Código, nombre y tipo de pago son requeridos");
      setSaving(false);
      return;
    }

    const url =
      modo === "edit"
        ? `http://localhost:5000/api/proveedores/${formData.id}`
        : "http://localhost:5000/api/proveedores";
    const method = modo === "edit" ? "put" : "post";

    try {
      const res = await axios[method](url, formData);
      setSuccess(modo === "edit" ? "Proveedor actualizado exitosamente" : "Proveedor creado exitosamente");
      handleCancel();
      fetchProveedores();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al guardar proveedor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este proveedor?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/proveedores/${id}`);
      setSuccess("Proveedor eliminado exitosamente");
      fetchProveedores();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Error al eliminar proveedor");
    }
  };

  const filteredProveedores = proveedores.filter((p) =>
    `${p.codigo} ${p.nombre} ${p.nit}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProveedores.length / itemsPerPage);
  const currentData = filteredProveedores.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <p>Cargando proveedores...</p>;

  return (
    <div className="container mt-4">
      <h1 className="text-center">Gestión de Proveedores</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div id="form-section" className="card mb-4">
        <div className="card-header">{modo === "edit" ? "Editar Proveedor" : "Crear Proveedor"}</div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Código *</label>
                <input
                  type="text"
                  className="form-control"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label>Nombre *</label>
                <input
                  type="text"
                  className="form-control"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label>NIT</label>
                <input
                  type="text"
                  className="form-control"
                  name="nit"
                  value={formData.nit}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label>Dirección</label>
                <input
                  type="text"
                  className="form-control"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Teléfono</label>
                <input
                  type="text"
                  className="form-control"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label>Correo</label>
                <input
                  type="email"
                  className="form-control"
                  name="correo"
                  value={formData.correo}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Tipo de Pago *</label>
                <select
                  className="form-control"
                  name="tipo_pago_id"
                  value={formData.tipo_pago_id}
                  onChange={handleInputChange}
                  required
                >
                  {tiposPago.map(tp => (
                    <option key={tp.id} value={tp.id}>{tp.nombre}</option>
                  ))}
                </select>
              </div>
              {modo === "edit" && (
                <div className="col-md-6 mb-3">
                  <label>Activo</label>
                  <input
                    type="checkbox"
                    className="form-check-input ms-2"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </div>

            <div className="text-end">
              <button
                type="button"
                className="btn btn-secondary me-2"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Guardando..." : modo === "edit" ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <input
        type="text"
        className="form-control mb-3"
        placeholder="Buscar por código, nombre o NIT..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Código</th>
              <th>Nombre</th>
              <th>NIT</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Tipo Pago</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.codigo}</td>
                  <td>{p.nombre}</td>
                  <td>{p.nit || "-"}</td>
                  <td>{p.direccion || "-"}</td>
                  <td>{p.telefono || "-"}</td>
                  <td>{p.correo || "-"}</td>
                  <td>{p.tipo_pago || "-"}</td>
                  <td>{p.activo ? "Sí" : "No"}</td>
                  <td>
                    <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(p)}>Editar</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="text-center">No hay proveedores</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav>
          <ul className="pagination justify-content-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <li key={page} className={`page-item ${page === currentPage ? "active" : ""}`}>
                <button className="page-link" onClick={() => setCurrentPage(page)}>{page}</button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
};

export default Proveedores;
