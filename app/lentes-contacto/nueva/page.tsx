"use client";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

const formatGrad = (val) => {
  if (val === null || val === undefined || val === "") return "";
  const n = parseFloat(val);
  if (isNaN(n)) return "";
  const signo = n >= 0 ? "+" : "";
  return signo + n.toFixed(2).replace(".", ",");
};

const validarGrad = (val) => {
  if (val === "" || val === "+" || val === "-" || val === "+0" || val === "-0") return true;
  const limpio = val.replace(",", ".");
  const n = parseFloat(limpio);
  if (isNaN(n)) return false;
  return Math.round(n * 100) % 25 === 0;
};

function NuevaLenteContactoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteId = searchParams.get("cliente_id");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cliente, setCliente] = useState(null);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    doctor: "",
    aereo_od_esfera: "",
    aereo_od_cilindro: "",
    aereo_od_eje: "",
    aereo_od_av: "",
    aereo_oi_esfera: "",
    aereo_oi_cilindro: "",
    aereo_oi_eje: "",
    aereo_oi_av: "",
    aereo_ao_av: "",
    aereo_add: "",
    final_od_esfera: "",
    final_od_cilindro: "",
    final_od_eje: "",
    final_od_av: "",
    final_oi_esfera: "",
    final_oi_cilindro: "",
    final_oi_eje: "",
    final_oi_av: "",
    final_ao_av: "",
    final_add: "",
    prueba_1: "",
    observaciones: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.push("/"); return; }
      if (clienteId) {
        const { data: cl } = await supabase.from("clientes").select("*").eq("id", clienteId).single();
        if (cl) setCliente(cl);
      }
    };
    checkUser();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGradacion = (e) => {
    const val = e.target.value;
    if (/^[+-]?\d{0,2}([.,]\d{0,2})?$/.test(val) || val === "" || val === "+" || val === "-") {
      setForm({ ...form, [e.target.name]: val });
    }
  };

  const handleGradBlur = (e) => {
    const val = e.target.value;
    if (val === "" || val === "+" || val === "-") return;
    if (!validarGrad(val)) {
      alert("El valor " + val + " no es valido. Use incrementos de 0,25 (ej: -1,25 / +2,50 / -0,75)");
      setForm({ ...form, [e.target.name]: "" });
      return;
    }
    const n = parseFloat(val.replace(",", "."));
    setForm({ ...form, [e.target.name]: formatGrad(n) });
  };

  const handleEje = (e) => {
    const val = e.target.value;
    if (val === "" || (/^\d+$/.test(val) && parseInt(val) >= 0 && parseInt(val) <= 180)) {
      setForm({ ...form, [e.target.name]: val });
    }
  };

  const parseGradacion = (val) => {
    if (val === "" || val === null || val === undefined || val === "+" || val === "-") return null;
    return parseFloat(String(val).replace(",", "."));
  };

  const handleGuardar = async () => {
    if (!clienteId) { setError("No se especifico el cliente"); return; }
    setLoading(true);
    const datos = { cliente_id: clienteId, fecha: form.fecha, doctor: form.doctor };
    const camposGrad = ["aereo_od_esfera", "aereo_od_cilindro", "aereo_oi_esfera", "aereo_oi_cilindro", "final_od_esfera", "final_od_cilindro", "final_oi_esfera", "final_oi_cilindro"];
    camposGrad.forEach(c => {
      const v = parseGradacion(form[c]);
      if (v !== null) datos[c] = v;
    });
    if (form.aereo_od_eje !== "") datos.aereo_od_eje = parseInt(form.aereo_od_eje);
    if (form.aereo_oi_eje !== "") datos.aereo_oi_eje = parseInt(form.aereo_oi_eje);
    if (form.final_od_eje !== "") datos.final_od_eje = parseInt(form.final_od_eje);
    if (form.final_oi_eje !== "") datos.final_oi_eje = parseInt(form.final_oi_eje);
    datos.aereo_od_av = form.aereo_od_av;
    datos.aereo_oi_av = form.aereo_oi_av;
    datos.aereo_ao_av = form.aereo_ao_av;
    datos.aereo_add = form.aereo_add;
    datos.final_od_av = form.final_od_av;
    datos.final_oi_av = form.final_oi_av;
    datos.final_ao_av = form.final_ao_av;
    datos.final_add = form.final_add;
    datos.prueba_1 = form.prueba_1;
    datos.observaciones = form.observaciones;
    const { error } = await supabase.from("lentes_contacto").insert([datos]);
    if (error) { setError("Error al guardar: " + error.message); setLoading(false); }
    else { router.push("/clientes/" + clienteId); }
  };

  const grad = (name) => (
    <input name={name} value={form[name]} onChange={handleGradacion} onBlur={handleGradBlur} placeholder="+0,00" style={{ width: "100%", padding: "6px 8px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", textAlign: "center" }} />
  );

  const inp = (name, placeholder) => (
    <input name={name} value={form[name]} onChange={handleChange} placeholder={placeholder || ""} style={{ width: "100%", padding: "6px 8px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", textAlign: "center" }} />
  );

  const eje = (name) => (
    <input name={name} value={form[name]} onChange={handleEje} placeholder="0-180" style={{ width: "100%", padding: "6px 8px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", textAlign: "center" }} />
  );

  const lbl = (text) => (
    <div style={{ fontSize: "11px", color: "#6b7a8f", marginBottom: "3px" }}>{text}</div>
  );

  const seccionFormula = (titulo, esf_od, cil_od, eje_od, av_od, esf_oi, cil_oi, eje_oi, av_oi, ao_av, add) => (
    <div style={{ borderTop: "1px solid #f0f2f5", paddingTop: "16px" }}>
      <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "12px" }}>{titulo}</div>
      <div style={{ display: "flex", gap: "8px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 1fr 1fr", gap: "8px", alignItems: "end", marginBottom: "8px" }}>
            <div style={{ fontSize: "12px", color: "#6b7a8f", fontWeight: "600", paddingBottom: "8px" }}>OD</div>
            <div>{lbl("Esfera")}{grad(esf_od)}</div>
            <div>{lbl("Cilindro")}{grad(cil_od)}</div>
            <div>{lbl("Eje")}{eje(eje_od)}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 1fr 1fr", gap: "8px", alignItems: "end" }}>
            <div style={{ fontSize: "12px", color: "#6b7a8f", fontWeight: "600", paddingBottom: "8px" }}>OI</div>
            <div>{lbl("Esfera")}{grad(esf_oi)}</div>
            <div>{lbl("Cilindro")}{grad(cil_oi)}</div>
            <div>{lbl("Eje")}{eje(eje_oi)}</div>
          </div>
        </div>
        <div style={{ width: "1px", background: "#f0f2f5", margin: "0 4px" }}></div>
        <div style={{ width: "80px", display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
          <div>{lbl("AV OD")}{inp(av_od, "0/0")}</div>
          <div style={{ marginTop: "4px" }}>{lbl("AV AO")}{inp(ao_av, "0/0")}</div>
          <div style={{ marginTop: "4px" }}>{lbl("AV OI")}{inp(av_oi, "0/0")}</div>
        </div>
      </div>
      <div style={{ marginTop: "12px", maxWidth: "120px" }}>
        <div>{lbl("ADD")}{inp(add)}</div>
      </div>
    </div>
  );

  const menuItems = [
    { label: "Inicio", path: "/dashboard" },
    { label: "Clientes", path: "/clientes" },
    { label: "Fichas opticas", path: "/fichas" },
    { label: "Lentes de contacto", path: "/lentes-contacto" },
    { label: "Ventas", path: "/ventas" },
    { label: "Cuenta corriente", path: "/cuenta-corriente" },
    { label: "Por oftalmologo", path: "/oftalmologos" },
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
        <div style={{ background: "#fff", borderBottom: "1px solid #dde3ec", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#1e3a5f" }}>
            Nueva lente de contacto {cliente ? "— " + cliente.apellido + ", " + cliente.nombre : ""}
          </span>
          <button onClick={() => clienteId ? router.push("/clientes/" + clienteId) : router.push("/clientes")} style={{ background: "transparent", color: "#6b7a8f", border: "1px solid #dde3ec", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" }}>
            Cancelar
          </button>
        </div>

        <div style={{ padding: "24px", maxWidth: "700px" }}>
          {error && <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }}>{error}</div>}

          <div style={{ background: "#fff", border: "1px solid #dde3ec", borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Fecha</label>
                <input name="fecha" type="date" value={form.fecha} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7a8f", display: "block", marginBottom: "4px" }}>Doctor</label>
                <select name="doctor" value={form.doctor} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", background: "#fff" }}>
                  <option value="">Seleccionar...</option>
                  <option value="Mauro Panichelli">Mauro Panichelli</option>
                  <option value="Anchaba Nicolas">Anchaba Nicolas</option>
                  <option value="Andres Vonpopelen">Andres Vonpopelen</option>
                  <option value="Mariana Villareal">Mariana Villareal</option>
                  <option value="Lara Juan">Lara Juan</option>
                  <option value="Romina Jaime">Romina Jaime</option>
                  <option value="Ruben Lorenzetti">Ruben Lorenzetti</option>
                  <option value="Dario Pascual">Dario Pascual</option>
                  <option value="Simon Ponce">Simon Ponce</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            {seccionFormula("Formula aerea",
              "aereo_od_esfera", "aereo_od_cilindro", "aereo_od_eje", "aereo_od_av",
              "aereo_oi_esfera", "aereo_oi_cilindro", "aereo_oi_eje", "aereo_oi_av",
              "aereo_ao_av", "aereo_add"
            )}

            {seccionFormula("Formula final lente de contacto",
              "final_od_esfera", "final_od_cilindro", "final_od_eje", "final_od_av",
              "final_oi_esfera", "final_oi_cilindro", "final_oi_eje", "final_oi_av",
              "final_ao_av", "final_add"
            )}

            <div style={{ borderTop: "1px solid #f0f2f5", paddingTop: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "8px" }}>Lente de contacto de prueba 1</div>
              <textarea name="prueba_1" value={form.prueba_1} onChange={handleChange} rows={3} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", resize: "vertical" }} />
            </div>

            <div style={{ borderTop: "1px solid #f0f2f5", paddingTop: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "8px" }}>Observaciones</div>
              <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={3} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", resize: "vertical" }} />
            </div>

            <button onClick={handleGuardar} disabled={loading} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function NuevaLenteContacto() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", color: "#6b7a8f" }}>Cargando...</div>}>
      <NuevaLenteContactoContent />
    </Suspense>
  );
}