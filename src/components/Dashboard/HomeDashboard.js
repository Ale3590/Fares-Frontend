import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  ReferenceLine,
} from "recharts";

// ✅ Componentes Card básicos con sombra más moderna
const Card = ({ children }) => (
  <div className="bg-white rounded-2xl shadow-xl p-4 w-full min-h-[300px] flex flex-col hover:shadow-2xl transition-shadow duration-300">
    {children}
  </div>
);

const CardContent = ({ children }) => (
  <div className="h-full w-full flex flex-col items-center justify-center">
    {children}
  </div>
);

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const HomeDashboard = () => {
  const [clientesTipoPago, setClientesTipoPago] = useState([]);
  const [ventasSemana, setVentasSemana] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [loadingVentas, setLoadingVentas] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);

  // 🔹 Cargar clientes por tipo de pago
  useEffect(() => {
    fetch("http://localhost:5000/api/clientes/tipo-pago")
      .then((res) => res.json())
      .then((data) => {
        const fixed = data.map((d) => ({
          tipo_pago: d.tipo_pago,
          cantidad: Number(d.cantidad),
        }));
        setClientesTipoPago(fixed);
        setLoadingClientes(false);
      })
      .catch((err) => {
        console.error(err);
        setClientesTipoPago([]);
        setLoadingClientes(false);
      });
  }, []);

  // 🔹 Cargar ventas de la semana
  useEffect(() => {
    fetch("http://localhost:5000/api/ventas/semana")
      .then((res) => res.json())
      .then((data) => {
        const diasEsp = {
          Mon: "Lun",
          Tue: "Mar",
          Wed: "Mié",
          Thu: "Jue",
          Fri: "Vie",
          Sat: "Sáb",
          Sun: "Dom",
        };
        const mapeado = data.map((d) => ({
          ...d,
          name: diasEsp[d.name] || d.name,
        }));
        setVentasSemana(mapeado);
        setLoadingVentas(false);
      })
      .catch((err) => {
        console.error(err);
        setVentasSemana([]);
        setLoadingVentas(false);
      });
  }, []);

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="text-sm">{`${label}: Q ${payload[0].value.toLocaleString(
            "es-GT"
          )}`}</p>
        </div>
      );
    }
    return null;
  };

  // Calcular totales
  const totalVentas = ventasSemana.reduce((acc, v) => acc + v.ventas, 0);
  const promedioVentas = ventasSemana.length
    ? Math.round(totalVentas / ventasSemana.length)
    : 0;
  const diaMayorVenta = ventasSemana.length
    ? ventasSemana.reduce(
        (prev, curr) => (curr.ventas > prev.ventas ? curr : prev),
        ventasSemana[0]
      ).name
    : "-";
  const diaMenorVenta = ventasSemana.length
    ? ventasSemana.reduce(
        (prev, curr) => (curr.ventas < prev.ventas ? curr : prev),
        ventasSemana[0]
      ).name
    : "-";
  const maxVenta = ventasSemana.length
    ? Math.max(...ventasSemana.map((v) => v.ventas))
    : 0;
  const minVenta = ventasSemana.length
    ? Math.min(...ventasSemana.map((v) => v.ventas))
    : 0;

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* 📊 Tarjeta de ventas por día */}
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Ventas de la Semana
          </h2>
          {loadingVentas ? (
            <p className="text-gray-500">Cargando datos...</p>
          ) : ventasSemana.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventasSemana}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => `Q ${v.toLocaleString("es-GT")}`}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={maxVenta} label="Máx" stroke="#10B981" strokeDasharray="3 3" />
                <ReferenceLine y={minVenta} label="Mín" stroke="#EF4444" strokeDasharray="3 3" />
                <Bar
                  dataKey="ventas"
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  barSize={60} // más gruesa
                  label={{
                    position: "top",
                    formatter: (val) => `Q ${val.toLocaleString("es-GT")}`,
                  }}
                  isAnimationActive
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">No hay ventas registradas esta semana</p>
          )}
        </CardContent>
      </Card>

      {/* 🧍‍♂️ Tarjeta de clientes por tipo de pago */}
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Clientes por Tipo de Pago
          </h2>
          {loadingClientes ? (
            <p className="text-gray-500">Cargando datos...</p>
          ) : clientesTipoPago.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={clientesTipoPago}
                  dataKey="cantidad"
                  nameKey="tipo_pago"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={3}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  activeIndex={activeIndex}
                  activeShape={(props) => (
                    <g>
                      <text
                        x={props.cx}
                        y={props.cy}
                        dy={8}
                        textAnchor="middle"
                        fill="#111"
                        fontSize={14}
                      >
                        {props.name}
                      </text>
                      <Sector
                        cx={props.cx}
                        cy={props.cy}
                        innerRadius={props.innerRadius}
                        outerRadius={props.outerRadius + 10}
                        startAngle={props.startAngle}
                        endAngle={props.endAngle}
                        fill={props.fill}
                        stroke="#fff"
                      />
                    </g>
                  )}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {clientesTipoPago.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">No hay datos disponibles</p>
          )}
        </CardContent>
      </Card>

      {/* 💰 Tarjeta resumen rápida */}
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Resumen General
          </h2>
          <div className="space-y-2 text-gray-600">
            <p>
              🧾 Ventas totales:{" "}
              <span className="font-semibold text-gray-800">
                {`Q ${totalVentas.toLocaleString("es-GT")}`}
              </span>
            </p>
            <p>
              📈 Promedio diario:{" "}
              <span className="font-semibold text-gray-800">
                {`Q ${promedioVentas.toLocaleString("es-GT")}`}
              </span>
            </p>
            <p>
              🌟 Día con mayor venta:{" "}
              <span className="font-semibold text-gray-800">{diaMayorVenta}</span>
            </p>
            <p>
              🔻 Día con menor venta:{" "}
              <span className="font-semibold text-gray-800">{diaMenorVenta}</span>
            </p>
            <p>
              👥 Clientes con crédito:{" "}
              <span className="font-semibold text-gray-800">
                {clientesTipoPago.find((c) =>
                  ["crédito", "credito"].includes(c.tipo_pago.toLowerCase())
                )?.cantidad || 0}
              </span>
            </p>
            <p>
              📦 Pedidos pendientes:{" "}
              <span className="font-semibold text-gray-800">5</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomeDashboard;
