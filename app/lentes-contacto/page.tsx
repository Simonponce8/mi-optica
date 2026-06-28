"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LentesContacto() {
  const [lentes, setLentes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [eliminando, setEliminando] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.push("/"); return; }
      cargarLentes();
    };
    checkUser();
  }, []);

  const cargarLentes = async () => {
    const { data } = await supabase
      .from("lentes_contacto")
      .select("*, clientes(nombre, apellido)")
      .order("fecha", { ascending: false });
    if (data) setLentes(data);
    setLoading(false);
  };

  const eliminarLente = async (id) => {
    if (!confirm("Estas seguro que queres eliminar este registro? Esta accion no se puede deshacer.")) return;
    setEliminando(id);
    await supabase.from("lentes_contacto").delete().eq("id", id);
    setEliminando(null);
    cargarLentes();
  };

  const lentesFiltrados = lentes.filter((l) => {
    const nombre = (l.clientes?.nombre + " " + l.clientes?.apellido).toLowerCase();
    return nombre.includes(busqueda.toLowerCase());
  });

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
            <div key={item.path} onClick={() => router.push(item.path)} style={{ padding: "11px 20px", color: item.path === "/lentes-contacto" ? "#fff" : "#b5d4f4", background: item.path === "/lentes-contacto" ? "#185FA5" : "transparent", cursor: "pointer", fontSize: "14px" }}>
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
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f" }}>Lentes de contacto</span>
        </div>

        <div style={{ padding: "24px" }}>
          <input type="text" placeholder="Buscar por nombre de cliente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", marginBottom: "16px", boxSizing: "border-box" }} />

          <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f4f7fb", borderBottom: "1px solid #dde3ec" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Cliente</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Fecha</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Doctor</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>OD Esfera</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>OI Esfera</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Accion</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#6b7a8f" }}>Cargando...</td></tr>
                ) : lentesFiltrados.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#6b7a8f" }}>No hay registros de lentes de contacto</td></tr>
                ) : (
                  lentesFiltrados.map((l) => (
                    <tr key={l.id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                      <td style={{ padding: "12px 16px", color: "#1e3a5f", fontWeight: "500", cursor: "pointer" }} onClick={() => router.push("/clientes/" + l.cliente_id)}>
                        {l.clientes?.apellido}, {l.clientes?.nombre}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#6b7a8f" }}>{l.fecha}</td>
                      <td style={{ padding: "12px 16px", color: "#6b7a8f" }}>{l.doctor || "-"}</td>
                      <td style={{ padding: "12px 16px", color: "#6b7a8f" }}>{l.od_esfera ?? "-"}</td>
                      <td style={{ padding: "12px 16px", color: "#6b7a8f" }}>{l.oi_esfera ?? "-"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => router.push("/lentes-contacto/" + l.id)} style={{ background: "#E6F1FB", color: "#185FA5", border: "none", borderRadius: "4px", padding: "4px 10px", cursor: "pointer", fontSize: "12px" }}>
                            Ver
                          </button>
                          <button onClick={() => eliminarLente(l.id)} disabled={eliminando === l.id} style={{ background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: "4px", padding: "4px 10px", cursor: "pointer", fontSize: "12px" }}>
                            {eliminando === l.id ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}