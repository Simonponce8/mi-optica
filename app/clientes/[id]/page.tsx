"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter, useParams } from "next/navigation";

export default function ClienteDetalle() {
  const router = useRouter();
  const params = useParams();
  const [cliente, setCliente] = useState(null);
  const [fichas, setFichas] = useState([]);
  const [lentes, setLentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eliminando, setEliminando] = useState(null);
  const [proximoTurno, setProximoTurno] = useState(null);
  const [esTerapia, setEsTerapia] = useState(false);
  const [guardandoTerapia, setGuardandoTerapia] = useState(false);

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
    if (cl) { setCliente(cl); setEsTerapia(cl.es_paciente_terapia || false); }
    const { data: fi } = await supabase.from("fichas_opticas").select("*").eq("cliente_id", params.id).order("fecha_examen", { ascending: false });
    if (fi) setFichas(fi);
    const { data: le } = await supabase.from("lentes_contacto").select("*").eq("cliente_id", params.id).order("fecha", { ascending: false });
    if (le) setLentes(le);
    const hoy = new Date().toISOString().split("T")[0];
    const { data: turno } = await supabase.from("turnos_terapia").select("*").eq("cliente_id", params.id).gte("fecha", hoy).neq("estado", "Cancelado").order("fecha", { ascending: true }).order("hora", { ascending: true }).limit(1);
    if (turno && turno.length > 0) setProximoTurno(turno[0]);
    setLoading(false);
  };

  const eliminarFicha = async (fichaId) => {
    if (!confirm("Estas seguro que queres eliminar esta ficha?")) return;
    setEliminando(fichaId);
    await supabase.from("fichas_opticas").delete().eq("id", fichaId);
    setEliminando(null);
    cargarDatos();
  };

  const eliminarLente = async (lenteId) => {
    if (!confirm("Estas seguro que queres eliminar este registro?")) return;
    setEliminando(lenteId);
    await supabase.from("lentes_contacto").delete().eq("id", lenteId);
    setEliminando(null);
    cargarDatos();
  };

  const toggleTerapia = async () => {
    setGuardandoTerapia(true);
    const nuevoValor = !esTerapia;
    await supabase.from("clientes").update({ es_paciente_terapia: nuevoValor }).eq("id", params.id);
    setEsTerapia(nuevoValor);
    setGuardandoTerapia(false);
  };

  const eliminarCliente = async () => {
    if (!confirm("Estas seguro que queres eliminar este cliente? Se eliminaran todas sus fichas y registros. Esta accion no se puede deshacer.")) return;
    await supabase.from("clientes").delete().eq("id", params.id);
    router.push("/clientes");
  };

  if (loading) return <div style={{ padding: "40px", color: "#6b7a8f" }}>Cargando...</div>;
  if (!cliente) return <div style={{ padding: "40px", color: "#6b7a8f" }}>Cliente no encontrado</div>;

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
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f" }}>{cliente.apellido}, {cliente.nombre}</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => router.push("/clientes/" + params.id + "/editar")} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
              Editar cliente
            </button>
            <button onClick={eliminarCliente} style={{ background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
              Eliminar cliente
            </button>
            <button onClick={() => router.push("/clientes")} style={{ background: "transparent", color: "#6b7a8f", border: "1px solid #dde3ec", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
              Volver
            </button>
          </div>
        </div>

        <div style={{ padding: "24px", maxWidth: "700px" }}>
          <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e3a5f", marginBottom: "16px" }}>Datos personales</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
              <div>
                <div style={{ color: "#6b7a8f", marginBottom: "2px" }}>Nombre completo</div>
                <div style={{ color: "#1e3a5f", fontWeight: "500" }}>{cliente.nombre} {cliente.apellido}</div>
              </div>
              <div>
                <div style={{ color: "#6b7a8f", marginBottom: "2px" }}>DNI</div>
                <div style={{ color: "#1e3a5f", fontWeight: "500" }}>{cliente.dni || "-"}</div>
              </div>
              <div>
                <div style={{ color: "#6b7a8f", marginBottom: "2px" }}>Telefono</div>
                <div style={{ color: "#1e3a5f", fontWeight: "500" }}>{cliente.telefono || "-"}</div>
              </div>
              <div>
                <div style={{ color: "#6b7a8f", marginBottom: "2px" }}>Email</div>
                <div style={{ color: "#1e3a5f", fontWeight: "500" }}>{cliente.email || "-"}</div>
              </div>
              <div>
                <div style={{ color: "#6b7a8f", marginBottom: "2px" }}>Fecha de nacimiento</div>
                <div style={{ color: "#1e3a5f", fontWeight: "500" }}>{cliente.fecha_nacimiento || "-"}</div>
              </div>
              <div>
                <div style={{ color: "#6b7a8f", marginBottom: "2px" }}>Obra social</div>
                <div style={{ color: "#1e3a5f", fontWeight: "500" }}>{cliente.obra_social || "-"}</div>
              </div>
            </div>
            {cliente.observaciones && (
              <div style={{ marginTop: "12px" }}>
                <div style={{ color: "#6b7a8f", marginBottom: "2px", fontSize: "13px" }}>Observaciones</div>
                <div style={{ color: "#1e3a5f", fontSize: "13px" }}>{cliente.observaciones}</div>
              </div>
            )}
            <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #f0f2f5" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#1e3a5f", cursor: "pointer" }}>
                <input type="checkbox" checked={esTerapia} onChange={toggleTerapia} disabled={guardandoTerapia} style={{ cursor: "pointer", width: "16px", height: "16px" }} />
                Agregar a Terapias
              </label>
            </div>
          </div>

          {esTerapia && (
              <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #f0f2f5" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "10px" }}>Proxima sesion de terapia</div>
                {proximoTurno ? (
                  <div style={{ background: "#E6F1FB", borderRadius: "8px", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#185FA5" }}>
                        {new Date(proximoTurno.fecha + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
                      </div>
                      <div style={{ fontSize: "12px", color: "#185FA5", marginTop: "2px" }}>{proximoTurno.hora} hs — {proximoTurno.estado}</div>
                    </div>
                    <button onClick={() => router.push("/calendario-terapia")} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", fontSize: "12px" }}>
                      Ver calendario
                    </button>
                  </div>
                ) : (
                  <div style={{ color: "#6b7a8f", fontSize: "13px", marginBottom: "10px" }}>No tiene proximo turno agendado</div>
                )}
                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <button onClick={() => router.push("/calendario-terapia")} style={{ flex: 1, background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer", fontSize: "13px" }}>
                    Agendar nueva sesion
                  </button>
                  <button onClick={() => router.push("/terapias/" + cliente.id)} style={{ flex: 1, background: "#E6F1FB", color: "#185FA5", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer", fontSize: "13px" }}>
                    Ver historial
                  </button>
                </div>
              </div>
            )}

          <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e3a5f" }}>Fichas opticas</div>
              <button onClick={() => router.push("/fichas/nueva?cliente_id=" + cliente.id)} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "7px 14px", cursor: "pointer", fontSize: "12px" }}>
                + Nueva ficha
              </button>
            </div>
            {fichas.length === 0 ? (
              <div style={{ color: "#6b7a8f", fontSize: "13px" }}>No hay fichas registradas para este cliente</div>
            ) : (
              fichas.map((f) => {
                const saldo = (f.monto_total || 0) - (f.sena || 0);
                const pagado = saldo <= 0;
                return (
                  <div key={f.id} style={{ border: "1px solid #f0f2f5", borderRadius: "6px", padding: "14px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f" }}>Examen del {f.fecha_examen}</div>
                        {f.monto_total > 0 && (
                          <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", background: pagado ? "#EAF3DE" : "#FAEEDA", color: pagado ? "#27500A" : "#854F0B" }}>
                            {pagado ? "PAGADO" : "PENDIENTE"}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => router.push("/fichas/" + f.id)} style={{ background: "#E6F1FB", color: "#185FA5", border: "none", borderRadius: "4px", padding: "5px 12px", cursor: "pointer", fontSize: "12px" }}>Editar</button>
                        <button onClick={() => eliminarFicha(f.id)} disabled={eliminando === f.id} style={{ background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: "4px", padding: "5px 12px", cursor: "pointer", fontSize: "12px" }}>
                          {eliminando === f.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
                      <div>
                        <div style={{ color: "#6b7a8f", marginBottom: "6px", fontWeight: "500" }}>Ojo derecho</div>
                        <div style={{ color: "#1e3a5f" }}>Esfera: {f.od_esfera ?? "-"} / Cilindro: {f.od_cilindro ?? "-"} / Eje: {f.od_eje ?? "-"}</div>
                      </div>
                      <div>
                        <div style={{ color: "#6b7a8f", marginBottom: "6px", fontWeight: "500" }}>Ojo izquierdo</div>
                        <div style={{ color: "#1e3a5f" }}>Esfera: {f.oi_esfera ?? "-"} / Cilindro: {f.oi_cilindro ?? "-"} / Eje: {f.oi_eje ?? "-"}</div>
                      </div>
                      {f.stock && <div><span style={{ color: "#6b7a8f" }}>Stock: </span>{f.stock}</div>}
                      {f.laboratorio && <div><span style={{ color: "#6b7a8f" }}>Laboratorio: </span>{f.laboratorio}</div>}
                      {f.marca && <div><span style={{ color: "#6b7a8f" }}>Marca: </span>{f.marca}</div>}
                      {f.doctor && <div><span style={{ color: "#6b7a8f" }}>Doctor: </span>{f.doctor}</div>}
                    </div>
                    {f.observaciones && <div style={{ marginTop: "8px", fontSize: "12px", color: "#6b7a8f" }}>Obs: {f.observaciones}</div>}
                  </div>
                );
              })
            )}
          </div>

          <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e3a5f" }}>Lentes de contacto</div>
              <button onClick={() => router.push("/lentes-contacto/nueva?cliente_id=" + cliente.id)} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "7px 14px", cursor: "pointer", fontSize: "12px" }}>
                + Nuevo registro
              </button>
            </div>
            {lentes.length === 0 ? (
              <div style={{ color: "#6b7a8f", fontSize: "13px" }}>No hay registros de lentes de contacto para este cliente</div>
            ) : (
              lentes.map((l) => (
                <div key={l.id} style={{ border: "1px solid #f0f2f5", borderRadius: "6px", padding: "14px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f" }}>Registro del {l.fecha}</div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => router.push("/lentes-contacto/" + l.id)} style={{ background: "#E6F1FB", color: "#185FA5", border: "none", borderRadius: "4px", padding: "5px 12px", cursor: "pointer", fontSize: "12px" }}>Editar</button>
                      <button onClick={() => eliminarLente(l.id)} disabled={eliminando === l.id} style={{ background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: "4px", padding: "5px 12px", cursor: "pointer", fontSize: "12px" }}>
                        {eliminando === l.id ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
                    <div>
                      <div style={{ color: "#6b7a8f", marginBottom: "6px", fontWeight: "500" }}>Ojo derecho</div>
                      <div style={{ color: "#1e3a5f" }}>Esfera: {l.od_esfera ?? "-"} / Cilindro: {l.od_cilindro ?? "-"} / Eje: {l.od_eje ?? "-"}</div>
                      {l.od_marca && <div style={{ color: "#6b7a8f", marginTop: "2px" }}>Marca: {l.od_marca}</div>}
                    </div>
                    <div>
                      <div style={{ color: "#6b7a8f", marginBottom: "6px", fontWeight: "500" }}>Ojo izquierdo</div>
                      <div style={{ color: "#1e3a5f" }}>Esfera: {l.oi_esfera ?? "-"} / Cilindro: {l.oi_cilindro ?? "-"} / Eje: {l.oi_eje ?? "-"}</div>
                      {l.oi_marca && <div style={{ color: "#6b7a8f", marginTop: "2px" }}>Marca: {l.oi_marca}</div>}
                    </div>
                    {l.doctor && <div><span style={{ color: "#6b7a8f" }}>Doctor: </span>{l.doctor}</div>}
                  </div>
                  {l.observaciones && <div style={{ marginTop: "8px", fontSize: "12px", color: "#6b7a8f" }}>Obs: {l.observaciones}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}