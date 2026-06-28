"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

const DOCTORES = [
  "Mauro Panichelli",
  "Anchaba Nicolas",
  "Andres Vonpopelen",
  "Mariana Villareal",
  "Lara Juan",
  "Romina Jaime",
  "Ruben Lorenzetti",
  "Dario Pascual",
  "Simon Ponce",
];

export default function PacientesPorOftalmologo() {
  const router = useRouter();
  const [doctor, setDoctor] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("nombre");
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const setRapido = (tipo) => {
    const hoy = new Date();
    const fmt = (d) => d.toISOString().split("T")[0];
    if (tipo === "hoy") { setFechaDesde(fmt(hoy)); setFechaHasta(fmt(hoy)); }
    if (tipo === "mes") { setFechaDesde(fmt(new Date(hoy.getFullYear(), hoy.getMonth(), 1))); setFechaHasta(fmt(hoy)); }
    if (tipo === "3meses") { const d = new Date(hoy); d.setMonth(d.getMonth() - 3); setFechaDesde(fmt(d)); setFechaHasta(fmt(hoy)); }
    if (tipo === "anio") { setFechaDesde(fmt(new Date(hoy.getFullYear(), 0, 1))); setFechaHasta(fmt(hoy)); }
  };

  const buscar = async () => {
    if (!doctor) return;
    setLoading(true);
    let query = supabase.from("fichas_opticas").select("*, clientes(id, nombre, apellido)").eq("doctor", doctor);
    if (fechaDesde) query = query.gte("fecha_examen", fechaDesde);
    if (fechaHasta) query = query.lte("fecha_examen", fechaHasta);
    const { data } = await query.order("fecha_examen", { ascending: false });
    if (data) setFichas(data);
    setLoading(false);
    setBuscado(true);
  };

  const fichasFiltradas = fichas.filter(f => {
    const nombre = (f.clientes?.nombre + " " + f.clientes?.apellido).toLowerCase();
    return nombre.includes(busqueda.toLowerCase());
  });

  const pacientesAgrupados = fichasFiltradas.reduce((acc, f) => {
    const id = f.clientes?.id;
    if (!id) return acc;
    if (!acc[id]) {
      acc[id] = { id, nombre: f.clientes?.nombre, apellido: f.clientes?.apellido, fichas: [], total: 0 };
    }
    acc[id].fichas.push(f);
    acc[id].total += (f.monto_total || 0);
    return acc;
  }, {});

  let pacientes = Object.values(pacientesAgrupados);
  if (orden === "nombre") pacientes.sort((a, b) => a.apellido.localeCompare(b.apellido));
  if (orden === "total") pacientes.sort((a, b) => b.total - a.total);
  if (orden === "fecha") pacientes.sort((a, b) => new Date(b.fichas[0].fecha_examen) - new Date(a.fichas[0].fecha_examen));

  const totalGeneral = pacientes.reduce((acc, p) => acc + p.total, 0);
  const totalCobrado = fichasFiltradas.reduce((acc, f) => acc + (f.sena || 0), 0);
  const honorariosTotal = totalGeneral * 0.1;

  const exportarTXT = () => {
    const lineas = [
      "LIQUIDACION OFTALMOLOGO",
      "Doctor: " + doctor,
      "Periodo: " + (fechaDesde || "inicio") + " al " + (fechaHasta || "hoy"),
      "",
      ...pacientes.map(p =>
        p.apellido + ", " + p.nombre + " | " + p.fichas.length + " consulta(s) | Honorarios profesionales: $" + (p.total * 0.1).toLocaleString("es-AR")
      ),
      "",
      "Total pacientes: " + pacientes.length,
      "Honorarios profesionales total: $" + honorariosTotal.toLocaleString("es-AR"),
    ];
    const blob = new Blob([lineas.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "liquidacion-" + doctor + "-" + fechaDesde + "-" + fechaHasta + ".txt";
    a.click();
  };

  const exportarCSV = () => {
    const filas = [
      ["Apellido", "Nombre", "Cantidad consultas", "Total paciente", "Honorarios profesionales"].join(","),
      ...pacientes.map(p => [p.apellido, p.nombre, p.fichas.length, p.total, (p.total * 0.1)].join(","))
    ].join("\n");
    const blob = new Blob([filas], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "liquidacion-" + doctor + ".csv";
    a.click();
  };

  const menuItems = [
    { label: "Inicio", path: "/dashboard" },
    { label: "Clientes", path: "/clientes" },
    { label: "Fichas opticas", path: "/fichas" },
    { label: "Lentes de contacto", path: "/lentes-contacto" },
    { label: "Ventas", path: "/ventas" },
    { label: "Cuenta corriente", path: "/cuenta-corriente" },
    { label: "Por oftalmologo", path: "/oftalmologos" },
    { label: "Eval. Neurosensorial", path: "/neurosensorial" },
    { label: "Terapias", path: "/terapias" },
    { label: "Calendario Terapia", path: "/calendario-terapia" },
    { label: "Horarios disponibles", path: "/horarios-disponibles" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7fb" }}>
      <div style={{ width: "220px", background: "#1e3a5f", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #2a4f7a" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>Optica Ponce</div>
          <div style={{ fontSize: "12px", color: "#85b7eb", marginTop: "2px" }}>Sistema de gestion</div>
        </div>
        <div style={{ flex: 1, padding: "10px 0" }}>
          {menuItems.map(item => (
            <div key={item.path} onClick={() => router.push(item.path)} style={{ padding: "11px 20px", color: item.path === "/oftalmologos" ? "#fff" : "#b5d4f4", background: item.path === "/oftalmologos" ? "#185FA5" : "transparent", cursor: "pointer", fontSize: "14px" }}>
              {item.label}
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid #2a4f7a" }}>
          <div onClick={async () => { await supabase.auth.signOut(); router.push("/"); }} style={{ color: "#f09595", cursor: "pointer", fontSize: "14px" }}>Cerrar sesion</div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #dde3ec", padding: "14px 24px" }}>
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f" }}>Liquidacion por oftalmologo</span>
        </div>

        <div style={{ padding: "24px" }}>
          <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "14px" }}>Filtros</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Oftalmologo</label>
                <select value={doctor} onChange={(e) => setDoctor(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", background: "#fff" }}>
                  <option value="">Seleccionar...</option>
                  {DOCTORES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Fecha desde</label>
                <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Fecha hasta</label>
                <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
              {[["hoy", "Hoy"], ["mes", "Este mes"], ["3meses", "Ultimos 3 meses"], ["anio", "Este ano"]].map(([tipo, label]) => (
                <button key={tipo} onClick={() => setRapido(tipo)} style={{ background: "#E6F1FB", color: "#185FA5", border: "none", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontSize: "12px" }}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={buscar} disabled={!doctor || loading} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "10px 24px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {buscado && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <input type="text" placeholder="Buscar paciente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ padding: "8px 14px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", width: "260px" }} />
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <select value={orden} onChange={(e) => setOrden(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px", background: "#fff" }}>
                    <option value="nombre">Ordenar por nombre</option>
                    <option value="total">Ordenar por honorarios</option>
                    <option value="fecha">Ordenar por fecha</option>
                  </select>
                  <button onClick={exportarCSV} style={{ background: "#EAF3DE", color: "#27500A", border: "none", borderRadius: "6px", padding: "8px 14px", cursor: "pointer", fontSize: "12px" }}>
                    Exportar CSV
                  </button>
                  <button onClick={exportarTXT} style={{ background: "#E6F1FB", color: "#185FA5", border: "none", borderRadius: "6px", padding: "8px 14px", cursor: "pointer", fontSize: "12px" }}>
                    Exportar TXT
                  </button>
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", overflow: "hidden", marginBottom: "20px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f4f7fb", borderBottom: "1px solid #dde3ec" }}>
                      <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Paciente</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Ultima consulta</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Consultas</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Total paciente</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Honorarios prof.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pacientes.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#6b7a8f" }}>No se encontraron pacientes</td></tr>
                    ) : (
                      pacientes.map(p => {
                        const honorarios = p.total * 0.1;
                        return (
                          <tr key={p.id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                            <td style={{ padding: "12px 16px", color: "#185FA5", fontWeight: "500", cursor: "pointer" }} onClick={() => router.push("/clientes/" + p.id)}>
                              {p.apellido}, {p.nombre}
                            </td>
                            <td style={{ padding: "12px 16px", color: "#6b7a8f" }}>{p.fichas[0].fecha_examen}</td>
                            <td style={{ padding: "12px 16px", color: "#6b7a8f" }}>{p.fichas.length}</td>
                            <td style={{ padding: "12px 16px", color: "#1e3a5f", fontWeight: "500" }}>${p.total.toLocaleString("es-AR")}</td>
                            <td style={{ padding: "12px 16px", color: "#185FA5", fontWeight: "600" }}>${honorarios.toLocaleString("es-AR")}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ background: "#1e3a5f", borderRadius: "8px", padding: "20px", color: "#fff" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "14px" }}>Resumen — {doctor}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#85b7eb", marginBottom: "4px" }}>Pacientes atendidos</div>
                    <div style={{ fontSize: "22px", fontWeight: "600" }}>{pacientes.length}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#85b7eb", marginBottom: "4px" }}>Facturacion total</div>
                    <div style={{ fontSize: "22px", fontWeight: "600" }}>${totalGeneral.toLocaleString("es-AR")}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#85b7eb", marginBottom: "4px" }}>Honorarios profesionales total</div>
                    <div style={{ fontSize: "22px", fontWeight: "600" }}>${honorariosTotal.toLocaleString("es-AR")}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}