"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.push("/"); return; }
      cargarClientes();
    };
    checkUser();
  }, []);

  const cargarClientes = async () => {
    const { data } = await supabase.from("clientes").select("*").order("apellido", { ascending: true });
    if (data) setClientes(data);
    setLoading(false);
  };

  const clientesFiltrados = clientes.filter((c) =>
    (c.nombre + " " + c.apellido + " " + c.dni).toLowerCase().includes(busqueda.toLowerCase())
  );

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
            <div key={item.path} onClick={() => router.push(item.path)} style={{ padding: "11px 20px", color: item.path === "/clientes" ? "#fff" : "#b5d4f4", background: item.path === "/clientes" ? "#185FA5" : "transparent", cursor: "pointer", fontSize: "14px" }}>
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
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f" }}>Clientes</span>
          <button onClick={() => router.push("/clientes/nuevo")} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
            + Nuevo cliente
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          <input type="text" placeholder="Buscar por nombre o DNI..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ width: "100%", padding: "10px 14px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", marginBottom: "16px", boxSizing: "border-box" }} />

          <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f4f7fb", borderBottom: "1px solid #dde3ec" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Nombre</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>DNI</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Telefono</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Obra social</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7a8f", fontWeight: "500" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#6b7a8f" }}>Cargando...</td></tr>
                ) : clientesFiltrados.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#6b7a8f" }}>No hay clientes registrados</td></tr>
                ) : (
                  clientesFiltrados.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                      <td style={{ padding: "12px 16px", color: "#1e3a5f", fontWeight: "500" }}>{c.apellido}, {c.nombre}</td>
                      <td style={{ padding: "12px 16px", color: "#6b7a8f" }}>{c.dni || "-"}</td>
                      <td style={{ padding: "12px 16px", color: "#6b7a8f" }}>{c.telefono || "-"}</td>
                      <td style={{ padding: "12px 16px", color: "#6b7a8f" }}>{c.obra_social || "-"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <button onClick={() => router.push("/clientes/" + c.id)} style={{ background: "#E6F1FB", color: "#185FA5", border: "none", borderRadius: "4px", padding: "4px 10px", cursor: "pointer", fontSize: "12px" }}>
                          Ver
                        </button>
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