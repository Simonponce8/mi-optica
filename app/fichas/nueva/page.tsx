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

function NuevaFichaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteId = searchParams.get("cliente_id");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cliente, setCliente] = useState(null);
  const [form, setForm] = useState({
    fecha_examen: new Date().toISOString().split("T")[0],
    doctor: "",
    od_esfera: "",
    od_cilindro: "",
    od_eje: "",
    av_od_lejos: "",
    oi_esfera: "",
    oi_cilindro: "",
    oi_eje: "",
    av_oi_lejos: "",
    av_ao_lejos: "",
    od_esfera_cerca: "",
    od_cilindro_cerca: "",
    od_eje_cerca: "",
    av_od_cerca: "",
    oi_esfera_cerca: "",
    oi_cilindro_cerca: "",
    oi_eje_cerca: "",
    av_oi_cerca: "",
    av_ao_cerca: "",
    stock: "",
    laboratorio: "",
    marca: "",
    monto_total: "",
    sena: "",
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

  const saldo = (parseFloat(form.monto_total) || 0) - (parseFloat(form.sena) || 0);

  const handleGuardar = async () => {
    if (!clienteId) { setError("No se especifico el cliente"); return; }
    const camposGrad = ["od_esfera", "od_cilindro", "oi_esfera", "oi_cilindro", "od_esfera_cerca", "od_cilindro_cerca", "oi_esfera_cerca", "oi_cilindro_cerca"];
    for (const c of camposGrad) {
      if (form[c] && !validarGrad(form[c])) {
        setError("El valor " + form[c] + " en " + c + " no es valido. Use incrementos de 0,25");
        return;
      }
    }
    setLoading(true);
    const datos = { cliente_id: clienteId, fecha_examen: form.fecha_examen, doctor: form.doctor };
    camposGrad.forEach(c => {
      const v = parseGradacion(form[c]);
      if (v !== null) datos[c] = v;
    });
    if (form.od_eje !== "") datos.od_eje = parseInt(form.od_eje);
    if (form.oi_eje !== "") datos.oi_eje = parseInt(form.oi_eje);
    if (form.od_eje_cerca !== "") datos.od_eje_cerca = parseInt(form.od_eje_cerca);
    if (form.oi_eje_cerca !== "") datos.oi_eje_cerca = parseInt(form.oi_eje_cerca);
    datos.av_od_lejos = form.av_od_lejos;
    datos.av_oi_lejos = form.av_oi_lejos;
    datos.av_ao_lejos = form.av_ao_lejos;
    datos.av_od_cerca = form.av_od_cerca;
    datos.av_oi_cerca = form.av_oi_cerca;
    datos.av_ao_cerca = form.av_ao_cerca;
    if (form.stock) datos.stock = form.stock;
    if (form.laboratorio) datos.laboratorio = form.laboratorio;
    if (form.marca) datos.marca = form.marca;
    datos.monto_total = parseFloat(form.monto_total) || 0;
    datos.sena = parseFloat(form.sena) || 0;
    if (form.observaciones) datos.observaciones = form.observaciones;
    const { error } = await supabase.from("fichas_opticas").insert([datos]);
    if (error) { setError("Error al guardar: " + error.message); setLoading(false); }
    else { router.push("/clientes/" + clienteId); }
  };

  const inp = (name, placeholder, onChange, onBlur) => (
    <input name={name} value={form[name]} onChange={onChange || handleChange} onBlur={onBlur} placeholder={placeholder} style={{ width: "100%", padding: "6px 8px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", textAlign: "center" }} />
  );

  const lbl = (text) => (
    <div style={{ fontSize: "11px", color: "#6b7a8f", marginBottom: "3px" }}>{text}</div>
  );

  const seccion = (titulo, esf_od, cil_od, eje_od, av_od, esf_oi, cil_oi, eje_oi, av_oi, av_ao) => (
    <div style={{ borderTop: "1px solid #f0f2f5", paddingTop: "16px" }}>
      <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "12px" }}>{titulo}</div>
      <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 1fr 1fr", gap: "8px", alignItems: "end", marginBottom: "8px" }}>
            <div style={{ fontSize: "12px", color: "#6b7a8f", fontWeight: "600", paddingBottom: "8px" }}>OD</div>
            <div>{lbl("Esfera")}{inp(esf_od, "+0,00", handleGradacion, handleGradBlur)}</div>
            <div>{lbl("Cilindro")}{inp(cil_od, "+0,00", handleGradacion, handleGradBlur)}</div>
            <div>{lbl("Eje")}{inp(eje_od, "0-180", handleEje)}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 1fr 1fr", gap: "8px", alignItems: "end" }}>
            <div style={{ fontSize: "12px", color: "#6b7a8f", fontWeight: "600", paddingBottom: "8px" }}>OI</div>
            <div>{lbl("Esfera")}{inp(esf_oi, "+0,00", handleGradacion, handleGradBlur)}</div>
            <div>{lbl("Cilindro")}{inp(cil_oi, "+0,00", handleGradacion, handleGradBlur)}</div>
            <div>{lbl("Eje")}{inp(eje_oi, "0-180", handleEje)}</div>
          </div>
        </div>
        <div style={{ width: "1px", background: "#f0f2f5", margin: "0 4px" }}></div>
        <div style={{ width: "80px", display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
          <div>{lbl("AV OD")}{inp(av_od, "0/0")}</div>
          <div style={{ marginTop: "4px" }}>{lbl("AV AO")}{inp(av_ao, "0/0")}</div>
          <div style={{ marginTop: "4px" }}>{lbl("AV OI")}{inp(av_oi, "0/0")}</div>
        </div>
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
            <div key={item.path} onClick={() => router.push(item.path)} style={{ padding: "11px 20px", color: item.path === "/fichas" ? "#fff" : "#b5d4f4", background: item.path === "/fichas" ? "#185FA5" : "transparent", cursor: "pointer", fontSize: "14px" }}>
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
            Nueva ficha optica {cliente ? "— " + cliente.apellido + ", " + cliente.nombre : ""}
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
                <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Fecha del examen</div>
                <input name="fecha_examen" type="date" value={form.fecha_examen} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Doctor</div>
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

            {seccion("Vision de lejos",
              "od_esfera", "od_cilindro", "od_eje", "av_od_lejos",
              "oi_esfera", "oi_cilindro", "oi_eje", "av_oi_lejos", "av_ao_lejos"
            )}

            {seccion("Vision de cerca",
              "od_esfera_cerca", "od_cilindro_cerca", "od_eje_cerca", "av_od_cerca",
              "oi_esfera_cerca", "oi_cilindro_cerca", "oi_eje_cerca", "av_oi_cerca", "av_ao_cerca"
            )}

            <div style={{ borderTop: "1px solid #f0f2f5", paddingTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Stock</div>
                <select name="stock" value={form.stock} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", background: "#fff" }}>
                  <option value="">Seleccionar...</option>
                  <option value="Organico Blanco">Organico Blanco</option>
                  <option value="Vuble">Vuble</option>
                  <option value="Fortis">Fortis</option>
                  <option value="AR start">AR start</option>
                  <option value="AR lentex">AR lentex</option>
                  <option value="Policarbonato">Policarbonato</option>
                  <option value="Mineral">Mineral</option>
                  <option value="Fotocromatico">Fotocromatico</option>
                  <option value="Crizal">Crizal</option>
                  <option value="Transitions">Transitions</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Laboratorio</div>
                <select name="laboratorio" value={form.laboratorio} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", background: "#fff" }}>
                  <option value="">Seleccionar...</option>
                  <option value="Progresivo">Progresivo</option>
                  <option value="Ocupacional">Ocupacional</option>
                  <option value="Bifocal">Bifocal</option>
                  <option value="Monofocal">Monofocal</option>
                  <option value="Monofocal +">Monofocal +</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Marca</div>
                <select name="marca" value={form.marca} onChange={handleChange} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", background: "#fff" }}>
                  <option value="">Seleccionar...</option>
                  <option value="Rodenstock">Rodenstock</option>
                  <option value="Swing">Swing</option>
                  <option value="FBD">FBD</option>
                  <option value="Varilux">Varilux</option>
                </select>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Observaciones</div>
              <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={3} style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", resize: "vertical" }} />
            </div>

            <div style={{ borderTop: "1px solid #f0f2f5", paddingTop: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e3a5f", marginBottom: "14px" }}>Informacion contable</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", alignItems: "end" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Monto total</div>
                  <input name="monto_total" type="number" value={form.monto_total} onChange={handleChange} placeholder="0" style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Sena</div>
                  <input name="sena" type="number" value={form.sena} onChange={handleChange} placeholder="0" style={{ width: "100%", padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#6b7a8f", marginBottom: "4px" }}>Saldo</div>
                  <div style={{ padding: "8px 12px", border: "1px solid #dde3ec", borderRadius: "6px", fontSize: "14px", background: "#f4f7fb", fontWeight: "600", color: saldo > 0 ? "#854F0B" : "#27500A" }}>
                    ${saldo.toLocaleString("es-AR")}
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleGuardar} disabled={loading} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: "6px", padding: "10px 20px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}>
              {loading ? "Guardando..." : "Guardar ficha"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function NuevaFicha() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", color: "#6b7a8f" }}>Cargando...</div>}>
      <NuevaFichaContent />
    </Suspense>
  );
}