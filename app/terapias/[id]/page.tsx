"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter, useParams } from "next/navigation";

export default function HistorialTerapia() {
  const router = useRouter();
  const params = useParams();
  const [cliente, setCliente] = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.push("/"); return; }
      cargarDatos();
    };
    checkUser();
  }, []);

  const cargarDatos = async () => {
    const { data: cl } = await supabase.from("clientes").select("*").eq("id", params.id).single();
    if (cl) setCliente(cl);
    const { data: ses } = await supabase.from("sesiones_terapia").select("*").eq("cliente_id", params.id).order("numero_sesion", { ascending: true });
    if (ses) setSesiones(ses);
    setLoading(false);
  };

  const agregarSesion = async () => {
    setAgregando(true);
    const siguienteNumero = sesiones.length > 0 ? Math.max(...sesiones.map(s => s.numero_sesion)) + 1 : 1;
    const { error } = await supabase.from("sesiones_terapia").insert([{
      cliente_id: params.id,
      numero_sesion: siguienteNumero,
      fecha: new Date().toISOString().split("T")[0],
      objetivo_sesion: "",
      ejercicios_realizados: "",
      tarea_casa: "",
      objetivo_alcanzado: false,
      cumplio_tarea: false,
    }]);
    setAgregando(false);
    if (!error) cargarDatos();
  };

  const abrirEdicion = (sesion) => {
    setEditando(sesion.id);
    setFormEdit({
      fecha: sesion.fecha,
      objetivo_sesion: sesion.objetivo_sesion || "",
      ejercicios_realizados: sesion.ejercicios_realizados || "",
      tarea_casa: sesion.tarea_casa || "",
      objetivo_alcanzado: sesion.objetivo_alcanzado || false,
      cumplio_tarea: sesion.cumplio_tarea || false,
    });
  };

  const guardarEdicion = async () => {
    setGuardando(true);
    const { error } = await supabase.from("sesiones_terapia").update(formEdit).eq("id", editando);
    setGuardando(false);
    if (!error) {
      setEditando(null);
      cargarDatos();
    }
  };

  const eliminarSesion = async (id) => {
    if (!confirm("Estas seguro que queres eliminar esta sesion?")) return;
    await supabase.from("sesiones_terapia").delete().eq("id", id);
    cargarDatos();
  };

  const imprimir = () => {
    window.print();
  };

  const sesionesFiltradas = sesiones.filter(s => {
    if (!busqueda) return true;
    const texto = (s.objetivo_sesion + " " + s.ejercicios_realizados + " " + s.tarea_casa + " " + s.numero_sesion).toLowerCase();
    return texto.includes(busqueda.toLowerCase());
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
  ];

  if (loading) return <div style={{ padding: "40px", color: "#6b7a8f" }}>Cargando...</div>;
  if (!cliente) return <div style={{ padding: "40px", color: "#6b7a8f" }}>Paciente no encontrado</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7fb" }}>
      <div className="no-print" style={{ width: "220px", background: "#1e3a5f", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #2a4f7a" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>Optica Ponce</div>
          <div style={{ fontSize: "12px", color: "#85b7eb", marginTop: "2px" }}>Sistema de gestion</div>
        </div>
        <div style={{ flex: 1, padding: "10px 0" }}>
          {menuItems.map(item => (
            <div key={item.path} onClick={() => router.push(item.path)} style={{ padding: "11px 20px", color: item.path === "/terapias" ? "#fff" : "#b5d4f4", background: item.path === "/terapias" ? "#185FA5" : "transparent", cursor: "pointer", fontSize: "14px" }}>
              {item.label}
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid #2a4f7a" }}>
          <div onClick={async () => { await supabase.auth.signOut(); router.push("/"); }} style={{ color: "#f09595", cursor: "pointer", fontSize: "14px" }}>Cerrar sesion</div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="no-print" style={{ background: "#fff", borderBottom: "1px solid #dde3ec", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f" }}>
            Historial de terapia — {cliente.apellido}, {cliente.nombre}
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={imprimir} style={{ background: "#E6F1FB", color: "#185FA5", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
              Imprimir / PDF
            </button>
            <button onClick={() => router.push("/terapias")} style={{ background: "transparent", color: "#6b7a8f", border: "1px solid #dde3ec", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
              Volver
            </button>
          </div>
        </div>

        <div style={{ padding: "24px", maxWidth: "800px" }}>
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <input type="text" placeholder="Buscar en sesiones..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ padding: "8px 14px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", width: "260px" }} />
            <button onClick={agregarSesion} disabled={agregando} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
              {agregando ? "Agregando..." : "+ Agregar nueva sesion"}
            </button>
          </div>

          {sesionesFiltradas.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "24px", textAlign: "center", color: "#6b7a8f", fontSize: "13px" }}>
              No hay sesiones registradas todavia
            </div>
          ) : (
            sesionesFiltradas.map((s) => (
              <div key={s.id} style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "20px", marginBottom: "16px" }}>
                {editando === s.id ? (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <div style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f" }}>Sesion N° {s.numero_sesion}</div>
                      <input type="date" value={formEdit.fecha} onChange={(e) => setFormEdit({ ...formEdit, fecha: e.target.value })} style={{ padding: "6px 10px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px" }} />
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Objetivo de la sesion</div>
                      <textarea value={formEdit.objetivo_sesion} onChange={(e) => setFormEdit({ ...formEdit, objetivo_sesion: e.target.value })} rows={2} style={{ width: "100%", padding: "8px 10px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", resize: "vertical" }} />
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Ejercicios realizados</div>
                      <textarea value={formEdit.ejercicios_realizados} onChange={(e) => setFormEdit({ ...formEdit, ejercicios_realizados: e.target.value })} rows={3} style={{ width: "100%", padding: "8px 10px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", resize: "vertical" }} />
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Tarea para casa</div>
                      <textarea value={formEdit.tarea_casa} onChange={(e) => setFormEdit({ ...formEdit, tarea_casa: e.target.value })} rows={2} style={{ width: "100%", padding: "8px 10px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", resize: "vertical" }} />
                    </div>
                    <div style={{ display: "flex", gap: "16px", marginBottom: "14px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#1e3a5f", cursor: "pointer" }}>
                        <input type="checkbox" checked={formEdit.objetivo_alcanzado} onChange={(e) => setFormEdit({ ...formEdit, objetivo_alcanzado: e.target.checked })} />
                        Objetivo alcanzado
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#1e3a5f", cursor: "pointer" }}>
                        <input type="checkbox" checked={formEdit.cumplio_tarea} onChange={(e) => setFormEdit({ ...formEdit, cumplio_tarea: e.target.checked })} />
                        Cumplio la tarea domiciliaria
                      </label>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={guardarEdicion} disabled={guardando} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
                        {guardando ? "Guardando..." : "Guardar"}
                      </button>
                      <button onClick={() => setEditando(null)} style={{ background: "transparent", color: "#6b7a8f", border: "1px solid #dde3ec", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #f0f2f5", paddingBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f" }}>Sesion N° {s.numero_sesion}</div>
                        <div style={{ fontSize: "12px", color: "#6b7a8f" }}>{s.fecha}</div>
                        {s.objetivo_alcanzado && <span style={{ background: "#EAF3DE", color: "#27500A", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>Objetivo alcanzado</span>}
                        {s.cumplio_tarea && <span style={{ background: "#E6F1FB", color: "#185FA5", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>Cumplio tarea</span>}
                      </div>
                      <div className="no-print" style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => abrirEdicion(s)} style={{ background: "#E6F1FB", color: "#185FA5", border: "none", borderRadius: "4px", padding: "5px 12px", cursor: "pointer", fontSize: "12px" }}>
                          Editar
                        </button>
                        <button onClick={() => eliminarSesion(s.id)} style={{ background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: "4px", padding: "5px 12px", cursor: "pointer", fontSize: "12px" }}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                    {s.objetivo_sesion && (
                      <div style={{ marginBottom: "10px" }}>
                        <div style={{ fontSize: "12px", color: "#6b7a8f", fontWeight: "600", marginBottom: "3px" }}>Objetivo de la sesion</div>
                        <div style={{ fontSize: "13px", color: "#1e3a5f", whiteSpace: "pre-wrap" }}>{s.objetivo_sesion}</div>
                      </div>
                    )}
                    {s.ejercicios_realizados && (
                      <div style={{ marginBottom: "10px" }}>
                        <div style={{ fontSize: "12px", color: "#6b7a8f", fontWeight: "600", marginBottom: "3px" }}>Ejercicios realizados</div>
                        <div style={{ fontSize: "13px", color: "#1e3a5f", whiteSpace: "pre-wrap" }}>{s.ejercicios_realizados}</div>
                      </div>
                    )}
                    {s.tarea_casa && (
                      <div>
                        <div style={{ fontSize: "12px", color: "#6b7a8f", fontWeight: "600", marginBottom: "3px" }}>Tarea para casa</div>
                        <div style={{ fontSize: "13px", color: "#1e3a5f", whiteSpace: "pre-wrap" }}>{s.tarea_casa}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}