"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

const COLORES_ESTADO = {
  Pendiente: { bg: "#FAEEDA", text: "#854F0B", dot: "#F0A93A" },
  Confirmado: { bg: "#EAF3DE", text: "#27500A", dot: "#5BA83A" },
  Asistio: { bg: "#E6F1FB", text: "#185FA5", dot: "#2E8FE0" },
  Cancelado: { bg: "#FCEBEB", text: "#A32D2D", dot: "#E04545" },
  Reprogramado: { bg: "#F1E8FB", text: "#6B2DA3", dot: "#9B5BE0" },
};

const ESTADOS = ["Pendiente", "Confirmado", "Asistio", "Cancelado", "Reprogramado"];

const diasSemana = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function CalendarioTerapia() {
  const router = useRouter();
  const [vista, setVista] = useState("mes");
  const [fechaActual, setFechaActual] = useState(new Date());
  const [turnos, setTurnos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalTurno, setModalTurno] = useState(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.push("/"); return; }
      cargarDatos();
    };
    checkUser();
  }, []);

  const cargarDatos = async () => {
    const { data: t } = await supabase.from("turnos_terapia").select("*, clientes(nombre, apellido, telefono)").order("fecha", { ascending: true });
    if (t) setTurnos(t);
    const { data: cl } = await supabase.from("clientes").select("id, nombre, apellido, telefono").eq("es_paciente_terapia", true).order("apellido");
    if (cl) setClientes(cl);
    setLoading(false);
  };

  const fmt = (d) => d.toISOString().split("T")[0];
  const hoy = fmt(new Date());
  const maniana = fmt(new Date(Date.now() + 86400000));

  const turnosHoy = turnos.filter(t => t.fecha === hoy);
  const turnosManiana = turnos.filter(t => t.fecha === maniana);

  const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
  const finMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
  const primerDiaSemana = inicioMes.getDay();
  const diasEnMes = finMes.getDate();

  const celdas = [];
  for (let i = 0; i < primerDiaSemana; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);

  const turnosDelDia = (dia) => {
    if (!dia) return [];
    const f = fmt(new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia));
    return turnos.filter(t => t.fecha === f);
  };

  const cambiarMes = (delta) => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + delta, 1));
  };

  const inicioSemana = (() => {
    const d = new Date(fechaActual);
    d.setDate(d.getDate() - d.getDay());
    return d;
  })();
  const diasSemanaActual = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana);
    d.setDate(d.getDate() + i);
    return d;
  });

  const turnosDeFecha = (fecha) => turnos.filter(t => t.fecha === fmt(fecha));

  const abrirNuevoTurno = (fecha) => {
    setModalTurno({
      id: null,
      cliente_id: "",
      fecha: fecha || fmt(new Date()),
      hora: "09:00",
      duracion: 45,
      observaciones: "",
      estado: "Pendiente",
    });
  };

  const abrirEditarTurno = (turno) => {
    setModalTurno({ ...turno, cliente_id: turno.cliente_id || "" });
  };

  const generarProximosTurnosFijos = async (turnoBase) => {
    const grupoId = turnoBase.grupo_fijo_id || crypto.randomUUID();
    const fechaBase = new Date(turnoBase.fecha + "T00:00:00");
    const { data: existentes } = await supabase.from("turnos_terapia").select("fecha").eq("grupo_fijo_id", grupoId);
    const fechasExistentes = new Set((existentes || []).map(t => t.fecha));
    const nuevos = [];
    for (let i = 0; i < 12; i++) {
      const f = new Date(fechaBase);
      f.setDate(f.getDate() + i * 7);
      const fechaStr = f.toISOString().split("T")[0];
      if (!fechasExistentes.has(fechaStr) && fechaStr !== turnoBase.fecha) {
        nuevos.push({
          cliente_id: turnoBase.cliente_id,
          fecha: fechaStr,
          hora: turnoBase.hora,
          duracion: turnoBase.duracion,
          observaciones: turnoBase.observaciones,
          estado: "Pendiente",
          es_fijo: true,
          grupo_fijo_id: grupoId,
        });
      }
    }
    if (nuevos.length > 0) {
      await supabase.from("turnos_terapia").insert(nuevos);
    }
    return grupoId;
  };

  const toggleTurnoFijo = async () => {
    if (!modalTurno.cliente_id) { alert("Selecciona un paciente primero"); return; }
    if (modalTurno.es_fijo) {
      if (!confirm("Se va a desactivar el turno fijo. Los turnos ya generados no se eliminan automaticamente, pero no se crearan nuevos. Continuar?")) return;
      if (modalTurno.id) {
        await supabase.from("turnos_terapia").update({ es_fijo: false }).eq("grupo_fijo_id", modalTurno.grupo_fijo_id).gte("fecha", modalTurno.fecha);
      }
      setModalTurno({ ...modalTurno, es_fijo: false });
    } else {
      let idGuardado = modalTurno.id;
      if (!idGuardado) {
        const datos = {
          cliente_id: modalTurno.cliente_id,
          fecha: modalTurno.fecha,
          hora: modalTurno.hora,
          duracion: parseInt(modalTurno.duracion),
          observaciones: modalTurno.observaciones,
          estado: modalTurno.estado,
        };
        const { data } = await supabase.from("turnos_terapia").insert([datos]).select().single();
        idGuardado = data.id;
      }
      const grupoId = await generarProximosTurnosFijos({ ...modalTurno, id: idGuardado });
      await supabase.from("turnos_terapia").update({ es_fijo: true, grupo_fijo_id: grupoId }).eq("id", idGuardado);
      setModalTurno({ ...modalTurno, id: idGuardado, es_fijo: true, grupo_fijo_id: grupoId });
      cargarDatos();
    }
  };

  const eliminarSerieFija = async () => {
    if (!confirm("Esto eliminara TODOS los turnos futuros de esta serie fija. Continuar?")) return;
    await supabase.from("turnos_terapia").delete().eq("grupo_fijo_id", modalTurno.grupo_fijo_id).gte("fecha", fmt(new Date()));
    setModalTurno(null);
    cargarDatos();
  };
  const guardarTurno = async () => {
    if (!modalTurno.cliente_id) { alert("Selecciona un paciente"); return; }
    const datos = {
      cliente_id: modalTurno.cliente_id,
      fecha: modalTurno.fecha,
      hora: modalTurno.hora,
      duracion: parseInt(modalTurno.duracion),
      observaciones: modalTurno.observaciones,
      estado: modalTurno.estado,
    };
    if (modalTurno.id) {
      await supabase.from("turnos_terapia").update(datos).eq("id", modalTurno.id);
    } else {
      await supabase.from("turnos_terapia").insert([datos]);
    }
    setModalTurno(null);
    cargarDatos();
  };

  const eliminarTurno = async () => {
    if (!confirm("Estas seguro que queres eliminar este turno?")) return;
    await supabase.from("turnos_terapia").delete().eq("id", modalTurno.id);
    setModalTurno(null);
    cargarDatos();
  };

  const enviarRecordatorio = (turno) => {
    const cliente = turno.clientes;
    if (!cliente) return;
    const nombre = cliente.nombre + " " + cliente.apellido;
    const fechaFmt = new Date(turno.fecha + "T00:00:00").toLocaleDateString("es-AR");
    const mensaje = encodeURIComponent("Hola " + nombre + ", te recordamos que tienes sesion de terapia visual el dia " + fechaFmt + " a las " + turno.hora + ". Por favor confirmar asistencia. Muchas gracias.");
    const telefono = cliente.telefono ? cliente.telefono.replace(/\D/g, "") : "";
    if (telefono) {
      window.open("https://wa.me/" + telefono + "?text=" + mensaje, "_blank");
    } else {
      window.open("https://wa.me/?text=" + mensaje, "_blank");
    }
  };

  const totalPacientesActivos = clientes.length;
  const inicioMesActual = fmt(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const finMesActual = fmt(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const sesionesEsteMes = turnos.filter(t => t.fecha >= inicioMesActual && t.fecha <= finMesActual && t.estado === "Asistio").length;
  const cancelacionesEsteMes = turnos.filter(t => t.fecha >= inicioMesActual && t.fecha <= finMesActual && t.estado === "Cancelado").length;
  const pacientesConTurno = new Set(turnos.filter(t => t.fecha >= hoy).map(t => t.cliente_id));
  const pacientesSinTurno = clientes.filter(c => !pacientesConTurno.has(c.id)).length;

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
  ];

  const Badge = ({ estado }) => {
    const c = COLORES_ESTADO[estado] || COLORES_ESTADO.Pendiente;
    return (
      <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "600", background: c.bg, color: c.text }}>
        {estado}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7fb" }}>
      <div style={{ width: "220px", background: "#1e3a5f", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #2a4f7a" }}>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>Optica Ponce</div>
          <div style={{ fontSize: "12px", color: "#85b7eb", marginTop: "2px" }}>Sistema de gestion</div>
        </div>
        <div style={{ flex: 1, padding: "10px 0" }}>
          {menuItems.map(item => (
            <div key={item.path} onClick={() => router.push(item.path)} style={{ padding: "11px 20px", color: item.path === "/calendario-terapia" ? "#fff" : "#b5d4f4", background: item.path === "/calendario-terapia" ? "#185FA5" : "transparent", cursor: "pointer", fontSize: "14px" }}>
              {item.label}
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid #2a4f7a" }}>
          <div onClick={async () => { await supabase.auth.signOut(); router.push("/"); }} style={{ color: "#f09595", cursor: "pointer", fontSize: "14px" }}>Cerrar sesion</div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ background: "#fff", borderBottom: "1px solid #dde3ec", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f" }}>Calendario de Terapia Visual</span>
            <button onClick={() => abrirNuevoTurno(fmt(new Date()))} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
              + Nuevo turno
            </button>
          </div>

          <div style={{ padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
              <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "14px" }}>
                <div style={{ fontSize: "11px", color: "#6b7a8f", marginBottom: "4px" }}>Pacientes activos</div>
                <div style={{ fontSize: "22px", fontWeight: "600", color: "#1e3a5f" }}>{totalPacientesActivos}</div>
              </div>
              <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "14px" }}>
                <div style={{ fontSize: "11px", color: "#6b7a8f", marginBottom: "4px" }}>Sesiones este mes</div>
                <div style={{ fontSize: "22px", fontWeight: "600", color: "#27500A" }}>{sesionesEsteMes}</div>
              </div>
              <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "14px" }}>
                <div style={{ fontSize: "11px", color: "#6b7a8f", marginBottom: "4px" }}>Cancelaciones</div>
                <div style={{ fontSize: "22px", fontWeight: "600", color: "#A32D2D" }}>{cancelacionesEsteMes}</div>
              </div>
              <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "14px" }}>
                <div style={{ fontSize: "11px", color: "#6b7a8f", marginBottom: "4px" }}>Sin proximo turno</div>
                <div style={{ fontSize: "22px", fontWeight: "600", color: "#854F0B" }}>{pacientesSinTurno}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                {["mes", "semana", "dia"].map(v => (
                  <button key={v} onClick={() => setVista(v)} style={{ padding: "6px 16px", borderRadius: "6px", border: "1px solid #dde3ec", fontSize: "13px", cursor: "pointer", background: vista === v ? "#185FA5" : "#fff", color: vista === v ? "#fff" : "#1e3a5f", textTransform: "capitalize" }}>
                    {v}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button onClick={() => cambiarMes(-1)} style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "6px", padding: "6px 12px", cursor: "pointer" }}>‹</button>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e3a5f", minWidth: "140px", textAlign: "center" }}>
                  {meses[fechaActual.getMonth()]} {fechaActual.getFullYear()}
                </span>
                <button onClick={() => cambiarMes(1)} style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "6px", padding: "6px 12px", cursor: "pointer" }}>›</button>
              </div>
            </div>

            {vista === "mes" && (
              <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#f4f7fb", borderBottom: "1px solid #dde3ec" }}>
                  {diasSemana.map(d => (
                    <div key={d} style={{ padding: "10px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#6b7a8f" }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                  {celdas.map((dia, i) => {
                    const turnosDia = turnosDelDia(dia);
                    const esHoy = dia && fmt(new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia)) === hoy;
                    return (
                      <div key={i} onClick={() => dia && abrirNuevoTurno(fmt(new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia)))} style={{ minHeight: "90px", border: "1px solid #f0f2f5", padding: "6px", cursor: dia ? "pointer" : "default", background: esHoy ? "#E6F1FB" : "#fff" }}>
                        {dia && (
                          <>
                            <div style={{ fontSize: "12px", fontWeight: esHoy ? "700" : "500", color: esHoy ? "#185FA5" : "#1e3a5f", marginBottom: "4px" }}>{dia}</div>
                            {turnosDia.slice(0, 3).map(t => (
                              <div key={t.id} onClick={(e) => { e.stopPropagation(); abrirEditarTurno(t); }} style={{ fontSize: "10px", padding: "2px 4px", borderRadius: "4px", marginBottom: "2px", background: (COLORES_ESTADO[t.estado] || COLORES_ESTADO.Pendiente).bg, color: (COLORES_ESTADO[t.estado] || COLORES_ESTADO.Pendiente).text, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                                {t.hora} {t.clientes?.apellido}
                              </div>
                            ))}
                            {turnosDia.length > 3 && <div style={{ fontSize: "9px", color: "#6b7a8f" }}>+{turnosDia.length - 3} mas</div>}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {vista === "semana" && (
              <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                  {diasSemanaActual.map((d, i) => {
                    const turnosDia = turnosDeFecha(d);
                    const esHoy = fmt(d) === hoy;
                    return (
                      <div key={i} style={{ borderRight: i < 6 ? "1px solid #f0f2f5" : "none", minHeight: "300px" }}>
                        <div onClick={() => abrirNuevoTurno(fmt(d))} style={{ padding: "10px", textAlign: "center", borderBottom: "1px solid #dde3ec", background: esHoy ? "#E6F1FB" : "#f4f7fb", cursor: "pointer" }}>
                          <div style={{ fontSize: "11px", color: "#6b7a8f" }}>{diasSemana[d.getDay()]}</div>
                          <div style={{ fontSize: "14px", fontWeight: esHoy ? "700" : "500", color: esHoy ? "#185FA5" : "#1e3a5f" }}>{d.getDate()}</div>
                        </div>
                        <div style={{ padding: "6px" }}>
                          {turnosDia.map(t => (
                            <div key={t.id} onClick={() => abrirEditarTurno(t)} style={{ fontSize: "11px", padding: "6px", borderRadius: "6px", marginBottom: "4px", cursor: "pointer", background: (COLORES_ESTADO[t.estado] || COLORES_ESTADO.Pendiente).bg, color: (COLORES_ESTADO[t.estado] || COLORES_ESTADO.Pendiente).text }}>
                              <div style={{ fontWeight: "600" }}>{t.hora}</div>
                              <div>{t.clientes?.apellido}, {t.clientes?.nombre}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {vista === "dia" && (
              <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "20px" }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e3a5f", marginBottom: "16px" }}>
                  {fechaActual.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
                </div>
                {turnosDeFecha(fechaActual).length === 0 ? (
                  <div style={{ color: "#6b7a8f", fontSize: "13px" }}>No hay turnos para este dia</div>
                ) : (
                  turnosDeFecha(fechaActual).sort((a, b) => a.hora.localeCompare(b.hora)).map(t => (
                    <div key={t.id} onClick={() => abrirEditarTurno(t)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", border: "1px solid #f0f2f5", borderRadius: "8px", marginBottom: "10px", cursor: "pointer" }}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e3a5f" }}>{t.hora} — {t.clientes?.apellido}, {t.clientes?.nombre}</div>
                        <div style={{ fontSize: "12px", color: "#6b7a8f", marginTop: "2px" }}>{t.duracion} min</div>
                      </div>
                      <Badge estado={t.estado} />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ width: "280px", background: "#fff", borderLeft: "1px solid #dde3ec", padding: "20px" }}>
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "10px" }}>Pacientes de hoy</div>
            {turnosHoy.length === 0 ? (
              <div style={{ fontSize: "12px", color: "#6b7a8f" }}>Sin turnos hoy</div>
            ) : (
              turnosHoy.sort((a, b) => a.hora.localeCompare(b.hora)).map(t => (
                <div key={t.id} onClick={() => abrirEditarTurno(t)} style={{ padding: "8px", border: "1px solid #f0f2f5", borderRadius: "6px", marginBottom: "6px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#1e3a5f" }}>{t.hora}</span>
                    <Badge estado={t.estado} />
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7a8f", marginTop: "2px" }}>{t.clientes?.apellido}, {t.clientes?.nombre}</div>
                </div>
              ))
            )}
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "10px" }}>Pacientes de maniana</div>
            {turnosManiana.length === 0 ? (
              <div style={{ fontSize: "12px", color: "#6b7a8f" }}>Sin turnos maniana</div>
            ) : (
              turnosManiana.sort((a, b) => a.hora.localeCompare(b.hora)).map(t => (
                <div key={t.id} onClick={() => abrirEditarTurno(t)} style={{ padding: "8px", border: "1px solid #f0f2f5", borderRadius: "6px", marginBottom: "6px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#1e3a5f" }}>{t.hora}</span>
                    <Badge estado={t.estado} />
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7a8f", marginTop: "2px" }}>{t.clientes?.apellido}, {t.clientes?.nombre}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {modalTurno && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", width: "420px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f", marginBottom: "16px" }}>
              {modalTurno.id ? "Editar turno" : "Nuevo turno"}
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Paciente</div>
              <select value={modalTurno.cliente_id} onChange={(e) => setModalTurno({ ...modalTurno, cliente_id: e.target.value })} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", background: "#fff" }}>
                <option value="">Seleccionar...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Fecha</div>
                <input type="date" value={modalTurno.fecha} onChange={(e) => setModalTurno({ ...modalTurno, fecha: e.target.value })} style={{ width: "100%", padding: "8px 10px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Hora</div>
                <input type="time" value={modalTurno.hora} onChange={(e) => setModalTurno({ ...modalTurno, hora: e.target.value })} style={{ width: "100%", padding: "8px 10px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Duracion</div>
                <select value={modalTurno.duracion} onChange={(e) => setModalTurno({ ...modalTurno, duracion: e.target.value })} style={{ width: "100%", padding: "8px 10px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", background: "#fff" }}>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Estado</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {ESTADOS.map(est => (
                  <button key={est} type="button" onClick={() => setModalTurno({ ...modalTurno, estado: est })} style={{ padding: "6px 12px", borderRadius: "20px", border: "1px solid", fontSize: "12px", cursor: "pointer", background: modalTurno.estado === est ? (COLORES_ESTADO[est]?.dot || "#185FA5") : "#f4f7fb", color: modalTurno.estado === est ? "#fff" : "#1e3a5f", borderColor: modalTurno.estado === est ? (COLORES_ESTADO[est]?.dot || "#185FA5") : "#dde3ec" }}>
                    {est}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Observaciones</div>
              <textarea value={modalTurno.observaciones} onChange={(e) => setModalTurno({ ...modalTurno, observaciones: e.target.value })} rows={2} style={{ width: "100%", padding: "8px 10px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", resize: "vertical" }} />
            </div>

<div style={{ marginBottom: "12px" }}>
              <button type="button" onClick={toggleTurnoFijo} style={{ width: "100%", background: modalTurno.es_fijo ? "#27500A" : "#f4f7fb", color: modalTurno.es_fijo ? "#fff" : "#1e3a5f", border: "1px solid " + (modalTurno.es_fijo ? "#27500A" : "#dde3ec"), borderRadius: "6px", padding: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}>
                {modalTurno.es_fijo ? "✓ Turno fijo activado (click para desactivar)" : "Marcar como turno fijo (se repite cada semana)"}
              </button>
              {modalTurno.es_fijo && modalTurno.grupo_fijo_id && (
                <button type="button" onClick={eliminarSerieFija} style={{ width: "100%", marginTop: "8px", background: "transparent", color: "#A32D2D", border: "1px solid #FCEBEB", borderRadius: "6px", padding: "8px", cursor: "pointer", fontSize: "12px" }}>
                  Eliminar todos los turnos futuros de esta serie
                </button>
              )}
            </div>
            {modalTurno.id && (
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <button onClick={() => enviarRecordatorio(modalTurno)} style={{ flex: 1, background: "#25D366", color: "#fff", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer", fontSize: "12px" }}>
                  Enviar recordatorio
                </button>
                <button onClick={() => router.push("/clientes/" + modalTurno.cliente_id)} style={{ flex: 1, background: "#E6F1FB", color: "#185FA5", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer", fontSize: "12px" }}>
                  Ver ficha
                </button>
                <button onClick={() => router.push("/terapias/" + modalTurno.cliente_id)} style={{ flex: 1, background: "#EAF3DE", color: "#27500A", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer", fontSize: "12px" }}>
                  Historial
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={guardarTurno} style={{ flex: 1, background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}>
                Guardar
              </button>
              {modalTurno.id && (
                <button onClick={eliminarTurno} style={{ background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: "6px", padding: "10px 16px", cursor: "pointer", fontSize: "13px" }}>
                  Eliminar
                </button>
              )}
              <button onClick={() => setModalTurno(null)} style={{ background: "transparent", color: "#6b7a8f", border: "1px solid #dde3ec", borderRadius: "6px", padding: "10px 16px", cursor: "pointer", fontSize: "13px" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}