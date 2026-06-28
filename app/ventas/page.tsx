"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.push("/"); return; }
      cargarVentas();
    };
    checkUser();
  }, []);

  const cargarVentas = async () => {
    const { data } = await supabase
      .from("ventas")
      .select("*, clientes(nombre, apellido)")
      .order("fecha", { ascending: false });
    if (data) setVentas(data);
    setLoading(false);
  };

  const ventasFiltradas = ventas.filter((v) => {
    const nombre = (v.clientes?.nombre + " " + v.clientes?.apellido).toLowerCase();
    const desc = (v.descripcion || "").toLowerCase();
    return nombre.includes(busqueda.toLowerCase()) || desc.includes(busqueda.toLowerCase());
  });

  const totalPendiente = ventasFiltradas.filter(v => (v.precio_venta - v.sena) > 0).reduce((acc, v) => acc + (v.precio_venta - v.sena), 0);

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
            <div key={item.path} onClick={() => router.push(item.path)} style={{ padding: "11px 20px", color: item.path === "/ventas" ? "#fff" : "#b5d4f4", background: item.path === "/ventas" ? "#185FA5" : "transparent", cursor: "pointer", fontSize: "14px" }}>
              {item.label}
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid #2a4f7a" }}>
          <div onClick={async () => { await supabase.auth.signOut(); router.push("/"); }} style={{ color: "#f09595", cursor: "pointer", fontSize: "14px" }}>Cerrar sesion</div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #dde3ec", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f" }}>Ventas</span>
          <button onClick={() => router.push("/ventas/nueva")} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
            + Nueva venta
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "6px" }}>Total ventas</div>
              <div style={{ fontSize: "24px", fontWeight: "600", color: "#1e3a5f" }}>{ventasFiltradas.length}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "6px" }}>Pendiente de cobro</div>
              <div style={{ fontSize: "24px", fontWeight: "600", color: "#854F0B" }}>${totalPendiente.toLocaleString("es-AR")}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "6px" }}>Ventas pagadas</div>
              <div style={{ fontSize: "24px", fontWeight: "600", color: "#27500A" }}>{ventasFiltradas.filter(v => (v.precio_venta - v.sena) <= 0).length}</div>
            </div>
          </div>

          <input type="text" placeholder="Buscar por cliente o producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", marginBottom: "16px", boxSizing: "border-box" }} />

          <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f4f7fb", borderBottom: "1px solid #dde3ec" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Cliente</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Fecha</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Producto</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Precio</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Saldo</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Estado</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Accion</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#6b7a8f" }}>Cargando...</td></tr>
                ) : ventasFiltradas.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#6b7a8f" }}>No hay ventas registradas</td></tr>
                ) : (
                  ventasFiltradas.map((v) => {
                    const saldo = (v.precio_venta || 0) - (v.sena || 0);
                    const pagado = saldo <= 0;
                    return (
                      <tr key={v.id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                        <td style={{ padding: "12px 16px", color: "#1e3a5f", fontWeight: "500" }}>{v.clientes?.apellido}, {v.clientes?.nombre}</td>
                        <td style={{ padding: "12px 16px", color: "#6b7a8f" }}>{v.fecha}</td>
                        <td style={{ padding: "12px 16px", color: "#6b7a8f" }}>{v.descripcion}</td>
                        <td style={{ padding: "12px 16px", color: "#1e3a5f" }}>${v.precio_venta?.toLocaleString("es-AR")}</td>
                        <td style={{ padding: "12px 16px", fontWeight: "600", color: pagado ? "#27500A" : "#854F0B" }}>${saldo.toLocaleString("es-AR")}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", background: pagado ? "#EAF3DE" : "#FAEEDA", color: pagado ? "#27500A" : "#854F0B" }}>
                            {pagado ? "PAGADO" : "PENDIENTE"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <button onClick={() => router.push("/ventas/" + v.id)} style={{ background: "#E6F1FB", color: "#185FA5", border: "none", borderRadius: "4px", padding: "4px 10px", cursor: "pointer", fontSize: "12px" }}>
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}