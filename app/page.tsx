'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

// ─── RECIPE DATABASE ──────────────────────────────────────────────────

// kcal calculadas con porciones reales de usuario medio español.
// Aceite: 1 cda = 120 kcal. Factor realismo +25% sobre estimación mínima en platos caseros.
const RECETAS = [
  { id: 3, tipo: 'desayuno' as const, nombre: 'Yogur con cereales', emoji: '🥣', nivel: 'facil',
    tiempo: '5 min', kcal: 340, prot: '12g', carbos: '54g', grasa: '7g', utensilio: 'Bol',
    // yogur 75 + cereales 160 + plátano 55 + miel 45 = 335 → 340
    ingredientes: [
      { emoji: '🥛', nombre: 'Yogur natural', qty: '1 ud', cat: 'Lácteos' },
      { emoji: '🌾', nombre: 'Cereales', qty: '40g', cat: 'Cereales' },
      { emoji: '🍌', nombre: 'Plátano', qty: '1/2 ud', cat: 'Frutas' },
      { emoji: '🍯', nombre: 'Miel', qty: '1 cda', cat: 'Varios' },
    ],
    pasos: ['Vierte el yogur en un bol.','Añade los cereales encima.','Corta medio plátano en rodajas.','Un chorrito de miel por encima. Listo.'],
  },
  { id: 4, tipo: 'desayuno' as const, nombre: 'Sandwich de pavo', emoji: '🥪', nivel: 'facil',
    tiempo: '5 min', kcal: 390, prot: '24g', carbos: '40g', grasa: '12g', utensilio: 'Sin utensilios',
    // pan 160 + pavo 65 + queso 80 + mantequilla/mayo habitual 70 = 375 → 390
    ingredientes: [
      { emoji: '🍞', nombre: 'Pan de molde', qty: '2 rebanadas', cat: 'Cereales' },
      { emoji: '🦃', nombre: 'Pavo loncheado', qty: '3 lonchas', cat: 'Proteínas' },
      { emoji: '🧀', nombre: 'Queso lonchas', qty: '1 loncha', cat: 'Lácteos' },
      { emoji: '🥬', nombre: 'Lechuga', qty: 'un poco', cat: 'Verduras' },
    ],
    pasos: ['Pon las lonchas de pavo sobre el pan.','Añade el queso y la lechuga.','Cierra el sandwich.','Córtalo por la mitad. Listo.'],
  },
  { id: 5, tipo: 'desayuno' as const, nombre: 'Tostadas con aceite', emoji: '🍞', nivel: 'facil',
    tiempo: '5 min', kcal: 370, prot: '8g', carbos: '42g', grasa: '18g', utensilio: 'Tostadora',
    // pan 160 + tomate 18 + aceite real ~2 cdas = 240 kcal → 370 (porciones reales)
    ingredientes: [
      { emoji: '🍞', nombre: 'Pan para tostar', qty: '2 rebanadas', cat: 'Cereales' },
      { emoji: '🍅', nombre: 'Tomate', qty: '1/2 ud', cat: 'Verduras' },
      { emoji: '🫒', nombre: 'Aceite de oliva', qty: '1-2 cdas', cat: 'Varios' },
    ],
    pasos: ['Tuesta el pan.','Ralla el tomate por encima.','Añade aceite y sal. Listo.'],
  },
  { id: 1, tipo: 'comida' as const, nombre: 'Tortilla de patatas', emoji: '🥚', nivel: 'facil',
    tiempo: '20 min', kcal: 580, prot: '22g', carbos: '44g', grasa: '32g', utensilio: 'Sartén',
    // patatas 350 + 4 huevos 280 + cebolla 30 + aceite absorbido ~180 = 840 total → 1 ración generosa = 580
    ingredientes: [
      { emoji: '🥔', nombre: 'Patatas', qty: '3 ud', cat: 'Verduras' },
      { emoji: '🥚', nombre: 'Huevos', qty: '4 ud', cat: 'Proteínas' },
      { emoji: '🧅', nombre: 'Cebolla', qty: '1/2 ud', cat: 'Verduras' },
      { emoji: '🫒', nombre: 'Aceite de oliva', qty: '4 cdas', cat: 'Varios' },
    ],
    pasos: ['Pela y corta las patatas en láminas finas, 3mm.','Sartén con aceite. 15 min las patatas hasta blandas.','Bate 4 huevos con sal, añade las patatas.','Cuaja 3 min por lado.'],
  },
  { id: 7, tipo: 'comida' as const, nombre: 'Arroz con pollo', emoji: '🍗', nivel: 'normal',
    tiempo: '25 min', kcal: 560, prot: '34g', carbos: '54g', grasa: '18g', utensilio: 'Sartén + Olla',
    // arroz 80g = 280 + pollo 150g = 165 + aceite 2 cdas = 240 → 685, porción ajustada = 560
    ingredientes: [
      { emoji: '🍚', nombre: 'Arroz', qty: '80g', cat: 'Cereales' },
      { emoji: '🍗', nombre: 'Pechuga de pollo', qty: '150g', cat: 'Proteínas' },
      { emoji: '🧄', nombre: 'Ajo', qty: '1 diente', cat: 'Verduras' },
      { emoji: '🫒', nombre: 'Aceite de oliva', qty: '2 cdas', cat: 'Varios' },
    ],
    pasos: ['Hierve el arroz 18 min con sal.','Corta el pollo y salpimienta.','Sartén: pollo 6 min por lado.','Añade ajo laminado 1 min. Sirve con arroz.'],
  },
  { id: 8, tipo: 'comida' as const, nombre: 'Garbanzos salteados', emoji: '🫘', nivel: 'facil',
    tiempo: '10 min', kcal: 480, prot: '18g', carbos: '50g', grasa: '20g', utensilio: 'Sartén',
    // garbanzos 250g = 325 + zanahoria 35 + aceite 2 cdas = 240 → ración = 480
    ingredientes: [
      { emoji: '🫘', nombre: 'Garbanzos (bote)', qty: '400g', cat: 'Proteínas' },
      { emoji: '🥕', nombre: 'Zanahoria', qty: '1 ud', cat: 'Verduras' },
      { emoji: '🫒', nombre: 'Aceite de oliva', qty: '2 cdas', cat: 'Varios' },
    ],
    pasos: ['Escurre y enjuaga los garbanzos.','Saltea zanahoria rallada 3 min.','Añade garbanzos, sal y comino 5 min.','Servir caliente.'],
  },
  { id: 2, tipo: 'cena' as const, nombre: 'Pasta con carne', emoji: '🍝', nivel: 'normal',
    tiempo: '15 min', kcal: 640, prot: '34g', carbos: '62g', grasa: '26g', utensilio: 'Olla + Sartén',
    // pasta 80g = 280 + carne 150g = 250 + tomate frito 200ml = 140 + aceite 1 cda = 120 → 790, ajuste real = 640
    ingredientes: [
      { emoji: '🍝', nombre: 'Pasta', qty: '80g', cat: 'Cereales' },
      { emoji: '🥩', nombre: 'Carne picada', qty: '150g', cat: 'Proteínas' },
      { emoji: '🍅', nombre: 'Tomate frito Solís', qty: '200ml', cat: 'Varios' },
      { emoji: '🧄', nombre: 'Ajo', qty: '1 diente', cat: 'Verduras' },
    ],
    pasos: ['Hierve agua con sal. Pasta 10 min.','Sartén: carne picada 5 min.','Añade el tomate.','Mezcla con la pasta escurrida.'],
  },
  { id: 9, tipo: 'cena' as const, nombre: 'Pechuga a la plancha', emoji: '🍗', nivel: 'facil',
    tiempo: '12 min', kcal: 360, prot: '42g', carbos: '4g', grasa: '18g', utensilio: 'Sartén',
    // pechuga 200g = 220 + aceite 1 cda = 120 + limón 10 = 350 → 360
    ingredientes: [
      { emoji: '🍗', nombre: 'Pechuga de pollo', qty: '200g', cat: 'Proteínas' },
      { emoji: '🫒', nombre: 'Aceite de oliva', qty: '1 cda', cat: 'Varios' },
      { emoji: '🍋', nombre: 'Limón', qty: '1/2 ud', cat: 'Frutas' },
    ],
    pasos: ['Salpimenta la pechuga.','Sartén caliente con aceite.','6 min por lado.','Exprime limón por encima. Listo.'],
  },
  { id: 10, tipo: 'cena' as const, nombre: 'Crema de verduras', emoji: '🥕', nivel: 'normal',
    tiempo: '20 min', kcal: 400, prot: '6g', carbos: '36g', grasa: '22g', utensilio: 'Olla + Batidora',
    // verduras 240 + patata 120 + aceite 2 cdas = 240 → total 600, ración ajustada = 400
    ingredientes: [
      { emoji: '🥕', nombre: 'Zanahorias', qty: '3 ud', cat: 'Verduras' },
      { emoji: '🧅', nombre: 'Cebolla', qty: '1/2 ud', cat: 'Verduras' },
      { emoji: '🥔', nombre: 'Patata', qty: '1 ud', cat: 'Verduras' },
      { emoji: '🫒', nombre: 'Aceite de oliva', qty: '2 cdas', cat: 'Varios' },
    ],
    pasos: ['Pela y trocea las verduras.','Cúbrelas de agua en la olla.','Hierve 15 min hasta que estén blandas.','Bate, añade aceite y sal.'],
  },
];

const DESAYUNOS = RECETAS.filter(r => r.tipo === 'desayuno');
const COMIDAS   = RECETAS.filter(r => r.tipo === 'comida');
const CENAS     = RECETAS.filter(r => r.tipo === 'cena');

// ─── TYPES ────────────────────────────────────────────────────────────

type TipoComida = 'desayuno' | 'comida' | 'cena';
type DayPlan    = { desayuno?: number; comida?: number; cena?: number };
type PlanSemana = Record<string, DayPlan>;
type Gasto      = { id: number; fecha: string; importe: number; descripcion: string };
type RecetaIA   = Omit<typeof RECETAS[0], 'id' | 'tipo'>;
type ResumenSem = {
  diasCocinados: number; gymSesiones: number;
  totalMonsters: number; totalColas: number; totalGastos: number;
  misionesMap: Record<string, { d: boolean; c: boolean; n: boolean; g: boolean }>;
};

// ─── COLORS & FONTS ───────────────────────────────────────────────────

const C = {
  bg:'#06060a', c1:'#0d0d13', c2:'#111118', c3:'#16161e',
  bdr:'#1e1e2a', txt:'#ededf2', mut:'#6a6a7a', dim:'#36364a',
  acc:'#e63946', accl:'#ff4d5a', accd:'#9a1520',
  grn:'#1a6a40', grnl:'#35b96e', xp:'#5c4fe8', xpl:'#8880f0',
  gold:'#f5c842',
};
const SYNE  = "'Syne',sans-serif";
const INTER = "'Inter',sans-serif";

// ─── LEVEL SYSTEM ─────────────────────────────────────────────────────

const NIVELES = [
  { nivel: 1, nombre: 'Recluta',  minXp: 0,    maxXp: 150,  color: C.mut,  emoji: '🪨' },
  { nivel: 2, nombre: 'Aprendiz', minXp: 150,  maxXp: 400,  color: C.grnl, emoji: '⚔️' },
  { nivel: 3, nombre: 'Guerrero', minXp: 400,  maxXp: 800,  color: C.xpl,  emoji: '🛡️' },
  { nivel: 4, nombre: 'Héroe',    minXp: 800,  maxXp: 1400, color: C.acc,  emoji: '🔥' },
  { nivel: 5, nombre: 'Leyenda',  minXp: 1400, maxXp: 2200, color: C.gold, emoji: '👑' },
];

function getLevelInfo(xp: number) {
  let lvl = NIVELES[0];
  for (const n of NIVELES) { if (xp >= n.minXp) lvl = n; }
  const range = lvl.maxXp - lvl.minXp;
  const prog  = Math.min(100, Math.round(((xp - lvl.minXp) / range) * 100));
  const xpEnNivel = xp - lvl.minXp;
  const xpParaSubir = lvl.maxXp - xp;
  const isMax = lvl.nivel === NIVELES.length;
  return { ...lvl, prog, xpEnNivel, xpParaSubir: Math.max(0, xpParaSubir), isMax };
}

// ─── HELPERS ─────────────────────────────────────────────────────────

const nivelConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  facil:  { label: '⚡ Fácil',     color: '#35b96e', bg: '#061209', border: '#1a5432' },
  normal: { label: '⚔️ Normal',    color: '#e63946', bg: '#130508', border: '#5a1522' },
  atrevo: { label: '🔥 Me atrevo', color: '#8880f0', bg: '#0a0820', border: '#3c2e89' },
};

function fechaHoy(): string {
  const dias  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const d = new Date();
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
}

function getMonday(date: Date): Date {
  const d   = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

// Formatea una Date a 'YYYY-MM-DD' usando la hora local (evita el bug UTC±N)
function toLocalDate(d: Date): string {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function getSemanaFechas(monday: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return toLocalDate(d);
  });
}

function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

function formatFechaCorta(iso: string): string {
  const dias  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const d = new Date(iso + 'T12:00:00');
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
}

function playSound(type: 'xp' | 'levelup') {
  if (typeof window === 'undefined') return;
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx  = new Ctx();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    if (type === 'xp') {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1047, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(); osc.stop(ctx.currentTime + 0.35);
    } else {
      [0, 0.12, 0.24, 0.36, 0.52].forEach((t, i) => {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.frequency.setValueAtTime([523,659,784,1047,1319][i], ctx.currentTime + t);
        g.gain.setValueAtTime(0.08, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.28);
        osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.28);
      });
    }
  } catch {}
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────

function Ring({ pct, color, label, sub, status, statusColor }: {
  pct: number; color: string; label: string; sub: string; status: string; statusColor: string;
}) {
  const r = 24, circ = 2 * Math.PI * r;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke={C.c3} strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={circ - (pct/100)*circ}
          strokeLinecap="round" transform="rotate(-90 32 32)"
          style={{ transition:'stroke-dashoffset 0.6s ease' }} />
        <text x="32" y="37" textAnchor="middle" fontSize="11" fontFamily={SYNE} fill={color} fontWeight="700">{label}</text>
      </svg>
      <span style={{ fontSize:9, color:C.mut, fontWeight:700, textTransform:'uppercase', letterSpacing:1, fontFamily:INTER }}>{sub}</span>
      <span style={{ fontSize:8, fontWeight:800, textTransform:'uppercase', color:statusColor, fontFamily:INTER }}>{status}</span>
    </div>
  );
}

function CleanTask({ emoji, label, last }: { emoji: string; label: string; last: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <div onClick={() => setDone(v => !v)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom: last ? 'none' : `1px solid ${C.bdr}`, cursor:'pointer' }}>
      <div style={{ width:24, height:24, borderRadius:7, border:`1.5px solid ${done ? C.grnl : C.bdr}`, background: done ? C.grnl : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#06060a', flexShrink:0, transition:'all 0.2s' }}>
        {done && '✓'}
      </div>
      <span style={{ fontSize:18 }}>{emoji}</span>
      <span style={{ flex:1, fontSize:13, fontWeight:600, color: done ? C.dim : C.txt, textDecoration: done ? 'line-through' : 'none', fontFamily:INTER }}>{label}</span>
    </div>
  );
}

function Banner({ img, titulo, texto }: { img: string; titulo: string; texto: string }) {
  return (
    <div style={{ position:'relative', background:C.c1, border:`1px solid ${C.bdr}`, borderRadius:20, marginBottom:16, overflow:'hidden', height:100, display:'flex', alignItems:'center' }}>
      <div style={{ position:'absolute', right:0, bottom:0, width:92, height:100 }}>
        <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'bottom right' }} />
      </div>
      <div style={{ padding:'0 18px', zIndex:1, maxWidth:'65%' }}>
        <div style={{ fontFamily:SYNE, fontSize:14, fontWeight:800, color:C.acc, letterSpacing:-0.2 }}>{titulo}</div>
        <div style={{ fontSize:12, color:C.mut, marginTop:5, lineHeight:1.6, fontFamily:INTER }} dangerouslySetInnerHTML={{ __html: texto }} />
      </div>
    </div>
  );
}

type Receta = typeof RECETAS[0];

function RecetaCard({ r, hecha, expandida, setExpandida, completar, compact }: {
  r: Receta; hecha: boolean; expandida: number | null;
  setExpandida: (id: number | null) => void;
  completar?: (id: number) => void;
  compact?: boolean;
}) {
  const open = expandida === r.id;
  const nv   = nivelConfig[r.nivel];
  return (
    <div style={{ background:C.c1, border:`1px solid ${C.bdr}`, borderRadius:20, marginBottom:10, overflow:'hidden' }}>
      <div onClick={() => setExpandida(open ? null : r.id)}
        style={{ padding: compact ? '12px 14px' : '16px 18px', display:'flex', alignItems:'center', gap:14, cursor:'pointer' }}>
        <span style={{ fontSize: compact ? 28 : 38 }}>{r.emoji}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:SYNE, fontSize: compact ? 13 : 15, fontWeight:800, color:C.txt, letterSpacing:-0.3 }}>{r.nombre}</div>
          <div style={{ fontSize:11, color:C.mut, marginTop:4, fontFamily:INTER }}>{r.utensilio} · {r.tiempo} · {r.kcal} kcal</div>
          <span style={{ display:'inline-block', fontSize:10, padding:'3px 10px', borderRadius:6, marginTop:6, fontWeight:700, background:nv.bg, color:nv.color, border:`1px solid ${nv.border}`, fontFamily:INTER }}>{nv.label}</span>
        </div>
        {completar && (
          <div style={{ width:30, height:30, borderRadius:9, border:`1.5px solid ${hecha ? C.grnl : C.bdr}`, background: hecha ? C.grnl : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#06060a', transition:'all 0.3s', flexShrink:0 }}>
            {hecha && '✓'}
          </div>
        )}
      </div>
      {open && (
        <div style={{ padding:'0 18px 18px', borderTop:`1px solid ${C.bdr}` }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7, marginTop:16, marginBottom:16 }}>
            {r.ingredientes.map((ing, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, background:C.c2, borderRadius:12, padding:'9px 11px', border:`1px solid ${C.bdr}` }}>
                <span style={{ fontSize:18 }}>{ing.emoji}</span>
                <span style={{ fontFamily:SYNE, fontSize:11, color:C.acc, fontWeight:700 }}>{ing.qty}</span>
                <span style={{ fontSize:11, color:C.mut, fontFamily:INTER }}>{ing.nombre}</span>
              </div>
            ))}
          </div>
          <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
            {r.pasos.map((paso, i) => (
              <li key={i} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:24, height:24, borderRadius:7, background:C.acc, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:SYNE, fontSize:11, fontWeight:800, color:'#fff', flexShrink:0, marginTop:1 }}>{i+1}</div>
                <span style={{ fontSize:13, color:C.mut, lineHeight:1.7, fontFamily:INTER }}>{paso}</span>
              </li>
            ))}
          </ul>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom: completar ? 16 : 0 }}>
            {[['kcal', r.kcal], ['prot', r.prot], ['carbos', r.carbos], ['grasa', r.grasa]].map(([k, v]) => (
              <div key={k as string} style={{ background:C.c2, borderRadius:11, padding:'10px 4px', textAlign:'center', border:`1px solid ${C.bdr}` }}>
                <div style={{ fontFamily:SYNE, fontSize:13, color:C.txt, fontWeight:800 }}>{v}</div>
                <div style={{ fontSize:9, color:C.dim, textTransform:'uppercase', letterSpacing:1, fontWeight:600, marginTop:3, fontFamily:INTER }}>{k}</div>
              </div>
            ))}
          </div>
          {completar && (
            <button onClick={() => completar(r.id)} style={{ width:'100%', padding:15, borderRadius:13, border:'none', background: hecha ? C.grn : C.acc, color:'#fff', fontFamily:SYNE, fontWeight:800, fontSize:12, cursor:'pointer', textTransform:'uppercase', letterSpacing:2 }}>
              {hecha ? '✓ MISIÓN COMPLETADA +40XP' : 'MARCAR COMPLETADO +40XP'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────


export default function Home() {
  const [tab,        setTab]        = useState('hoy');
  const [planView,   setPlanView]   = useState<'semana'|'recetas'>('semana');
  const [expandida,  setExpandida]  = useState<number | null>(null);
  const [confetti,   setConfetti]   = useState(false);
  const [levelUp,    setLevelUp]    = useState<number | null>(null); // new level number
  const [xpBump,     setXpBump]     = useState(false);
  const [dbLoading,    setDbLoading]    = useState(true);
  const [dbError,      setDbError]      = useState('');
  const [noMonsterImg, setNoMonsterImg] = useState(false);
  const [noCabreImg,   setNoCabreImg]   = useState(false);

  // Perfil / XP
  const [xp,               setXp]               = useState(0);
  const [rachaMonsterDias, setRachaMonsterDias] = useState(0);

  // Misiones diarias
  const [hechas,   setHechas]   = useState<number[]>([]);
  const [gymHecho,      setGymHecho]      = useState(false);
  const [limpiezaHecha,   setLimpiezaHecha]   = useState(false);
  const [tareasLimpieza,  setTareasLimpieza]  = useState([false, false, false, false]);

  // Bebidas (4 variantes)
  const [monsters,     setMonsters]     = useState(0); // Monster original 230 kcal
  const [monstersZero, setMonstersZero] = useState(0); // Monster Zero 15 kcal
  const [colas,        setColas]        = useState(0); // Coca-Cola original 139 kcal
  const [colasZero,    setColasZero]    = useState(0); // Coca-Cola Zero 0 kcal

  // Planificador semanal
  const [planSemana,    setPlanSemana]    = useState<PlanSemana>({});
  const [semanaActual,  setSemanaActual]  = useState(() => getMonday(new Date()));
  const [pickerOpen,    setPickerOpen]    = useState<{ fecha: string; tipo: TipoComida } | null>(null);
  const [resumenSemana, setResumenSemana] = useState<ResumenSem | null>(null);
  const [cargandoRes,   setCargandoRes]   = useState(false);

  // Consejos nutricionales por comida
  const [consejos,         setConsejos]         = useState<Partial<Record<TipoComida, string>>>({});
  const [cargandoConsejo,  setCargandoConsejo]  = useState<Partial<Record<TipoComida, boolean>>>({});

  // Actividades IA
  const [actividades,        setActividades]        = useState<{emoji:string;label:string}[]>([]);
  const [cargandoActs,       setCargandoActs]       = useState(false);
  const [apetece,            setApetece]            = useState('');

  // Push notifications
  const [pushSub,            setPushSub]            = useState<PushSubscription | null>(null);
  const [pushSupported,      setPushSupported]      = useState(false);

  // Notas/tareas del día
  const [notas,              setNotas]              = useState<{id:number;texto:string;hecha:boolean}[]>([]);
  const [notaInput,          setNotaInput]          = useState('');


  // IA Recetas
  const [iaTipo,          setIaTipo]          = useState<'desayuno' | 'plato'>('plato');
  const [iaInput,         setIaInput]         = useState('');
  const [iaGenerando,     setIaGenerando]     = useState(false);
  const [iaReceta,        setIaReceta]        = useState<RecetaIA | null>(null);
  const [iaError,         setIaError]         = useState('');
  const [recetasExtra,    setRecetasExtra]    = useState<(RecetaIA & { id: number; tipo: TipoComida | 'plato' })[]>([]);

  // BMR editable
  const [bmr,          setBmr]          = useState(2000);
  const [editandoBmr,  setEditandoBmr]  = useState(false);
  const [bmrInput,     setBmrInput]     = useState('2000');

  // Gastos
  const [presupuesto,         setPresupuesto]         = useState(150);
  const [editandoPresupuesto, setEditandoPresupuesto] = useState(false);
  const [presupuestoInput,    setPresupuestoInput]    = useState('150');
  const [gastosLista,         setGastosLista]         = useState<Gasto[]>([]);
  const [gastoImporte,        setGastoImporte]        = useState('');
  const [gastoDesc,           setGastoDesc]           = useState('');
  const [guardandoGasto,      setGuardandoGasto]      = useState(false);
  const [editandoGasto,       setEditandoGasto]       = useState<number | null>(null);
  const [editGastoImporte,    setEditGastoImporte]    = useState('');
  const [editGastoDesc,       setEditGastoDesc]       = useState('');

  const TODAY     = useRef(toLocalDate(new Date())).current;
  const loadedRef = useRef(false);
  const prevXpRef = useRef(0);

  // ── LOAD ────────────────────────────────────────────────────────
  useEffect(() => {
    async function cargar() {
      try {
        const semLunes = toLocalDate(getMonday(new Date()));
        const [
          { data: perfil },
          { data: misiones },
          { data: bebidas },
          { data: gastos },
          { data: planRow },
          { data: settings },
        ] = await Promise.all([
          supabase.from('perfil').select('xp,racha_sin_monster').eq('nombre','cabre').maybeSingle(),
          supabase.from('misiones_dia').select('*').eq('fecha', TODAY).maybeSingle(),
          supabase.from('bebidas_dia').select('monsters,cocacolas').eq('fecha', TODAY).maybeSingle(),
          supabase.from('gastos').select('*').order('fecha',{ascending:false}).order('id',{ascending:false}).limit(50),
          supabase.from('plan_semanal').select('plan').eq('semana', semLunes).maybeSingle(),
          supabase.from('settings').select('clave,valor'),
        ]);

        if (perfil) { setXp(perfil.xp ?? 0); prevXpRef.current = perfil.xp ?? 0; setRachaMonsterDias(perfil.racha_sin_monster ?? 0); }
        if (misiones) {
          const ids: number[] = [];
          if (misiones.desayuno_hecho) ids.push(3,4,5);
          if (misiones.comida_hecha)   ids.push(1,7,8);
          if (misiones.cena_hecha)     ids.push(2,9,10);
          setHechas(ids.filter(id => RECETAS.some(r => r.id === id)));
          setGymHecho(misiones.gym_hecho ?? false);
          setLimpiezaHecha(misiones.limpieza_hecha ?? false);
        }
        if (bebidas) {
          setMonsters(bebidas.monsters ?? 0);
          setMonstersZero((bebidas as any).monsters_zero ?? 0);
          setColas(bebidas.cocacolas ?? 0);
          setColasZero((bebidas as any).cocacolas_zero ?? 0);
        }
        if (gastos)  setGastosLista(gastos);
        if (planRow?.plan) setPlanSemana(planRow.plan as PlanSemana);
        if (settings) {
          const p = settings.find(s => s.clave === 'presupuesto');
          if (p) { setPresupuesto(Number(p.valor)); setPresupuestoInput(p.valor); }
          const b = settings.find(s => s.clave === 'bmr');
          if (b) { setBmr(Number(b.valor)); setBmrInput(b.valor); }
        }
      } catch (e) {
        setDbError('Error al conectar con la base de datos.');
        console.error(e);
      } finally {
        loadedRef.current = true;
        setDbLoading(false);
      }
    }
    cargar();
  }, []); // eslint-disable-line

  // ── SAVE PERFIL ──────────────────────────────────────────────────
  useEffect(() => {
    if (!loadedRef.current) return;
    supabase.from('perfil').update({ xp, racha_sin_monster: monsters > 0 ? 0 : rachaMonsterDias, fecha_ultima_actualizacion: TODAY }).eq('nombre','cabre').then(({error}) => { if(error) console.error(error); });
  }, [xp]); // eslint-disable-line

  // ── SAVE MISIONES ────────────────────────────────────────────────
  useEffect(() => {
    if (!loadedRef.current) return;
    supabase.from('misiones_dia').upsert({ fecha: TODAY, desayuno_hecho: hechas.some(id=>[3,4,5].includes(id)), comida_hecha: hechas.some(id=>[1,7,8].includes(id)), cena_hecha: hechas.some(id=>[2,9,10].includes(id)), gym_hecho: gymHecho, limpieza_hecha: limpiezaHecha }, { onConflict:'fecha' }).then(({error}) => { if(error) console.error(error); });
  }, [hechas, gymHecho, limpiezaHecha]); // eslint-disable-line

  // ── SAVE BEBIDAS ─────────────────────────────────────────────────
  useEffect(() => {
    if (!loadedRef.current) return;
    supabase.from('bebidas_dia').upsert({ fecha: TODAY, monsters, monsters_zero: monstersZero, cocacolas: colas, cocacolas_zero: colasZero, copas: 0 }, { onConflict:'fecha' }).then(({error}) => { if(error) console.error(error); });
  }, [monsters, monstersZero, colas, colasZero]); // eslint-disable-line

  // ── SAVE PLAN ────────────────────────────────────────────────────
  useEffect(() => {
    if (!loadedRef.current) return;
    const semLunes = toLocalDate(getMonday(semanaActual));
    const fechas   = getSemanaFechas(getMonday(semanaActual));
    const weekPlan: PlanSemana = {};
    fechas.forEach(f => { if (planSemana[f]) weekPlan[f] = planSemana[f]; });
    supabase.from('plan_semanal').upsert({ semana: semLunes, plan: planSemana }, { onConflict:'semana' }).then(({error}) => { if(error) console.error(error); });
  }, [planSemana]); // eslint-disable-line

  // ── LOAD RESUMEN WHEN PLAN TAB OPENS ────────────────────────────
  useEffect(() => {
    if (tab !== 'plan') return;
    cargarResumen(semanaActual);
  }, [tab, semanaActual]); // eslint-disable-line

  async function cargarResumen(monday: Date) {
    setCargandoRes(true);
    const fechas = getSemanaFechas(monday);
    const [inicio, fin] = [fechas[0], fechas[6]];
    const [{ data: mis }, { data: beb }, { data: gas }] = await Promise.all([
      supabase.from('misiones_dia').select('*').gte('fecha',inicio).lte('fecha',fin),
      supabase.from('bebidas_dia').select('*').gte('fecha',inicio).lte('fecha',fin),
      supabase.from('gastos').select('importe').gte('fecha',inicio).lte('fecha',fin),
    ]);
    const misionesMap: ResumenSem['misionesMap'] = {};
    (mis ?? []).forEach(m => { misionesMap[m.fecha] = { d: m.desayuno_hecho, c: m.comida_hecha, n: m.cena_hecha, g: m.gym_hecho }; });
    setResumenSemana({
      diasCocinados: (mis ?? []).filter(m => m.desayuno_hecho || m.comida_hecha || m.cena_hecha).length,
      gymSesiones:   (mis ?? []).filter(m => m.gym_hecho).length,
      totalMonsters: (beb ?? []).reduce((s,b) => s + b.monsters, 0),
      totalColas:    (beb ?? []).reduce((s,b) => s + b.cocacolas, 0),
      totalGastos:   (gas ?? []).reduce((s,g) => s + Number(g.importe), 0),
      misionesMap,
    });
    setCargandoRes(false);
  }

  // ── SERVICE WORKER & PUSH ────────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    setPushSupported(true);
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(async reg => {
      const sub = await reg.pushManager.getSubscription();
      setPushSub(sub);
    });
  }, []);

  const suscribirPush = useCallback(async () => {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    });
    setPushSub(sub);
    await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
  }, []);

  const desuscribirPush = useCallback(async () => {
    if (!pushSub) return;
    await pushSub.unsubscribe();
    await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: pushSub.endpoint }) });
    setPushSub(null);
  }, [pushSub]);

  // ── COMPLETAR RECETA ─────────────────────────────────────────────
  const completar = useCallback((id: number) => {
    const r = RECETAS.find(x => x.id === id);
    if (!r) return;
    // Check if this meal slot is already done
    const slotIds = r.tipo === 'desayuno' ? [3,4,5] : r.tipo === 'comida' ? [1,7,8] : [2,9,10];
    if (hechas.some(h => slotIds.includes(h))) return;
    const prevLvl = getLevelInfo(xp).nivel;
    setHechas(prev => [...prev, id]);
    const nuevo = xp + 40;
    setXp(nuevo);
    setXpBump(true); setTimeout(() => setXpBump(false), 600);
    playSound('xp');
    setConfetti(true); setTimeout(() => setConfetti(false), 1500);
    const newLvl = getLevelInfo(nuevo).nivel;
    if (newLvl > prevLvl) { setTimeout(() => { setLevelUp(newLvl); playSound('levelup'); }, 500); }
  }, [hechas, xp]);

  // ── GUARDAR GASTO ────────────────────────────────────────────────
  const guardarGasto = useCallback(async () => {
    const importe = parseFloat(gastoImporte.replace(',','.'));
    if (isNaN(importe) || importe <= 0 || !gastoDesc.trim()) return;
    setGuardandoGasto(true);
    const { data, error } = await supabase.from('gastos').insert({ fecha: TODAY, importe, descripcion: gastoDesc.trim() }).select().single();
    if (!error && data) { setGastosLista(prev => [data, ...prev]); setGastoImporte(''); setGastoDesc(''); }
    setGuardandoGasto(false);
  }, [gastoImporte, gastoDesc, TODAY]);

  // ── EDITAR GASTO ─────────────────────────────────────────────────
  const abrirEdicionGasto = useCallback((g: Gasto) => {
    setEditandoGasto(g.id);
    setEditGastoImporte(String(g.importe));
    setEditGastoDesc(g.descripcion);
  }, []);

  const guardarEdicionGasto = useCallback(async (id: number) => {
    const importe = parseFloat(editGastoImporte.replace(',','.'));
    if (isNaN(importe) || importe <= 0 || !editGastoDesc.trim()) return;
    const { error } = await supabase.from('gastos').update({ importe, descripcion: editGastoDesc.trim() }).eq('id', id);
    if (!error) {
      setGastosLista(prev => prev.map(g => g.id === id ? { ...g, importe, descripcion: editGastoDesc.trim() } : g));
      setEditandoGasto(null);
    }
  }, [editGastoImporte, editGastoDesc]);

  // ── ELIMINAR GASTO ───────────────────────────────────────────────
  const eliminarGasto = useCallback(async (id: number) => {
    const { error } = await supabase.from('gastos').delete().eq('id', id);
    if (!error) setGastosLista(prev => prev.filter(g => g.id !== id));
  }, []);

  // ── GUARDAR PRESUPUESTO ──────────────────────────────────────────
  const guardarPresupuesto = useCallback(async () => {
    const val = parseFloat(presupuestoInput.replace(',','.'));
    if (isNaN(val) || val <= 0) return;
    setPresupuesto(val);
    setEditandoPresupuesto(false);
    await supabase.from('settings').upsert({ clave: 'presupuesto', valor: String(val) }, { onConflict: 'clave' });
  }, [presupuestoInput]);

  // ── GUARDAR BMR ──────────────────────────────────────────────────
  const guardarBmr = useCallback(async () => {
    const val = parseInt(bmrInput.replace(/\D/g,''), 10);
    if (isNaN(val) || val < 800 || val > 5000) return;
    setBmr(val);
    setEditandoBmr(false);
    await supabase.from('settings').upsert({ clave: 'bmr', valor: String(val) }, { onConflict: 'clave' });
  }, [bmrInput]);

  // ── ACTIVIDADES IA ───────────────────────────────────────────────
  const generarActividades = useCallback(async () => {
    setCargandoActs(true);
    try {
      const res = await fetch('/api/actividades-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hora: new Date().getHours(), apetece: apetece.trim() }),
      });
      const { actividades: acts } = await res.json();
      setActividades(acts);
    } catch { /* mantiene las anteriores */ }
    finally { setCargandoActs(false); }
  }, [apetece]);

  // ── NOTAS DEL DÍA ────────────────────────────────────────────────
  const añadirNota = useCallback(() => {
    const texto = notaInput.trim();
    if (!texto) return;
    setNotas(prev => [...prev, { id: Date.now(), texto, hecha: false }]);
    setNotaInput('');
  }, [notaInput]);


  // ── CONSEJO NUTRICIONAL ──────────────────────────────────────────
  const pedirConsejo = useCallback(async (tipo: TipoComida, receta: { nombre:string; kcal:number; prot:string; carbos:string; grasa:string }) => {
    setCargandoConsejo(prev => ({ ...prev, [tipo]: true }));
    try {
      const comidasHechas = ([
        { tipo:'desayuno', ids:[3,4,5] },
        { tipo:'comida',   ids:[1,7,8] },
        { tipo:'cena',     ids:[2,9,10] },
      ] as { tipo: TipoComida; ids: number[] }[])
        .filter(s => s.tipo !== tipo && hechas.some(h => s.ids.includes(h)))
        .map(s => {
          const id = hechas.find(h => s.ids.includes(h))!;
          const r  = RECETAS.find(x => x.id === id)!;
          return { tipo: s.tipo, nombre: r.nombre, kcal: r.kcal, prot: r.prot, carbos: r.carbos, grasa: r.grasa };
        });
      const res = await fetch('/api/consejo-nutricional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comidaActual: receta, comidasDelDia: comidasHechas }),
      });
      const { consejo } = await res.json();
      setConsejos(prev => ({ ...prev, [tipo]: consejo }));
    } catch {
      setConsejos(prev => ({ ...prev, [tipo]: 'No se pudo cargar el consejo.' }));
    } finally {
      setCargandoConsejo(prev => ({ ...prev, [tipo]: false }));
    }
  }, [hechas]);

  // ── GENERAR RECETA CON IA ────────────────────────────────────────
  const generarRecetaIA = useCallback(async () => {
    setIaGenerando(true);
    setIaReceta(null);
    setIaError('');
    try {
      const res = await fetch('/api/recetas-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: iaTipo === 'desayuno' ? 'desayuno' : 'comida', restricciones: iaInput }),
      });
      if (!res.ok) throw new Error('Error del servidor');
      const { receta } = await res.json();
      setIaReceta(receta);
    } catch {
      setIaError('No se pudo generar la receta. Comprueba la API key en .env.local');
    } finally {
      setIaGenerando(false);
    }
  }, [iaTipo, iaInput]);

  const guardarRecetaIA = useCallback(() => {
    if (!iaReceta) return;
    const id = 1000 + recetasExtra.length;
    const tipoFinal: TipoComida | 'plato' = iaTipo === 'desayuno' ? 'desayuno' : 'plato';
    setRecetasExtra(prev => [...prev, { ...iaReceta, id, tipo: tipoFinal }]);
    setIaReceta(null);
    setIaInput('');
    playSound('xp');
  }, [iaReceta, iaTipo, recetasExtra.length]);

  // ── ASIGNAR RECETA AL PLAN ───────────────────────────────────────
  const asignarReceta = useCallback((fecha: string, tipo: TipoComida, recetaId: number | null) => {
    setPlanSemana(prev => ({
      ...prev,
      [fecha]: { ...prev[fecha], [tipo]: recetaId ?? undefined },
    }));
    setPickerOpen(null);
  }, []);

  // ── CÁLCULOS ─────────────────────────────────────────────────────
  const lvlInfo      = getLevelInfo(xp);
  const monsterTomado   = monsters > 0 || monstersZero > 0;
  const refrescoTomado  = monsters > 0 || monstersZero > 0 || colas > 0 || colasZero > 0;
  const desayunoHecho   = hechas.some(id => [3,4,5].includes(id));
  const comidaHecha     = hechas.some(id => [1,7,8].includes(id));
  const cenaHecha       = hechas.some(id => [2,9,10].includes(id));
  const completadas     = (desayunoHecho?1:0) + (comidaHecha?1:0) + (cenaHecha?1:0);
  const pctCocina       = Math.round(completadas / 3 * 100);
  const kcalComida      = RECETAS.filter(r => hechas.includes(r.id)).reduce((s,r) => s + r.kcal, 0);
  const kcalBeb         = monsters * 230 + monstersZero * 15 + colas * 139;
  const kcalGymQuemado  = gymHecho ? 350 : 0;
  const kcalTot         = kcalComida + kcalBeb;
  const balance         = kcalTot - bmr - kcalGymQuemado;
  const pctKcal         = Math.min(150, Math.round(kcalTot / bmr * 100));
  const totalGastado    = gastosLista.reduce((s,g) => s + Number(g.importe), 0);
  const queda           = presupuesto - totalGastado;
  const pctGastado      = Math.min(100, Math.round(totalGastado / presupuesto * 100));

  // ── AUTO SHOPPING LIST ───────────────────────────────────────────
  const listaCompra = useMemo(() => {
    const fechas = getSemanaFechas(getMonday(semanaActual));
    const ids    = new Set<number>();
    fechas.forEach(f => {
      const dia = planSemana[f];
      if (!dia) return;
      if (dia.desayuno) ids.add(dia.desayuno);
      if (dia.comida)   ids.add(dia.comida);
      if (dia.cena)     ids.add(dia.cena);
    });
    const map = new Map<string, { emoji:string; nombre:string; qty:string; cat:string }>();
    ids.forEach(id => {
      const r = RECETAS.find(r => r.id === id);
      if (!r) return;
      r.ingredientes.forEach(ing => { if (!map.has(ing.nombre)) map.set(ing.nombre, ing); });
    });
    return [...map.values()].sort((a,b) => a.cat.localeCompare(b.cat));
  }, [planSemana, semanaActual]);

  const semanaFechas = getSemanaFechas(semanaActual);
  const navTabs = [
    { id:'hoy',    label:'Hoy',    icon:'🍳' },
    { id:'plan',   label:'Plan',   icon:'📅' },
    { id:'kcal',   label:'Kcal',   icon:'⚡' },
    { id:'compra', label:'Compra', icon:'🛒' },
    { id:'gastos', label:'Gastos', icon:'💰' },
  ];
  const sec = { background:C.c1, border:`1px solid ${C.bdr}`, borderRadius:20, marginBottom:12, padding:'18px' };

  // ── LOADING ──────────────────────────────────────────────────────
  if (dbLoading) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        {!noCabreImg && <img src="/cabre.png" alt="" style={{ width:80, height:80, borderRadius:24, objectFit:'cover', marginBottom:16 }} onError={() => setNoCabreImg(true)} />}
        <div style={{ fontFamily:SYNE, fontSize:32, fontWeight:800, color:C.acc, letterSpacing:-1 }}>Cabre</div>
        <div style={{ width:48, height:4, background:C.c3, borderRadius:4, margin:'12px auto 0', overflow:'hidden' }}>
          <div style={{ height:'100%', background:C.acc, borderRadius:4, animation:'load 1s ease-in-out infinite alternate', width:'60%' }} />
        </div>
        <style>{`@keyframes load{0%{transform:translateX(0)}100%{transform:translateX(66%)}}`}</style>
      </div>
    </div>
  );

  // ── APP ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', justifyContent:'center' }}>
      <div style={{ width:'100%', maxWidth:420, background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', fontFamily:INTER, color:C.txt, position:'relative' }}>

        {/* LEVEL UP MODAL */}
        {levelUp !== null && (
          <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(6,6,10,0.98)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
            <div style={{ width:1, height:80, background:`linear-gradient(to bottom, transparent, ${lvlInfo.color})`, marginBottom:4 }} />
            <img src="/luffy.png" alt="" style={{ width:130, height:130, objectFit:'contain' }} />
            <div style={{ fontFamily:SYNE, fontSize:13, color:lvlInfo.color, fontWeight:700, letterSpacing:6, textTransform:'uppercase' }}>NIVEL {levelUp}</div>
            <div style={{ fontFamily:SYNE, fontSize:38, fontWeight:800, color:lvlInfo.color, letterSpacing:-1.5, lineHeight:1 }}>{NIVELES.find(n => n.nivel === levelUp)?.nombre}</div>
            <div style={{ fontFamily:SYNE, fontSize:14, color:C.txt, fontWeight:700, letterSpacing:3, textTransform:'uppercase', opacity:0.6 }}>{NIVELES.find(n => n.nivel === levelUp)?.emoji} Nuevo rango desbloqueado</div>
            <button onClick={() => setLevelUp(null)} style={{ marginTop:16, padding:'14px 48px', background:lvlInfo.color, color:'#fff', border:'none', borderRadius:14, fontFamily:SYNE, fontWeight:800, fontSize:13, cursor:'pointer', textTransform:'uppercase', letterSpacing:3 }}>
              ACEPTAR
            </button>
          </div>
        )}

        {/* CONFETTI */}
        {confetti && (
          <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:50, overflow:'hidden' }}>
            {Array.from({length:30}).map((_,i) => (
              <div key={i} style={{ position:'absolute', left:`${5+Math.random()*90}%`, top:`${5+Math.random()*40}%`, width:i%3===0?10:7, height:i%3===0?10:7, borderRadius:i%4===0?'50%':2, background:[C.acc,C.accl,C.grnl,C.xpl,C.txt,C.gold][i%6], animation:`cffall ${0.8+Math.random()*0.8}s ease-out forwards`, animationDelay:`${Math.random()*0.4}s` }} />
            ))}
          </div>
        )}

        {/* RECIPE PICKER MODAL */}
        {pickerOpen && (
          <div style={{ position:'fixed', inset:0, zIndex:80, display:'flex', flexDirection:'column', justifyContent:'flex-end' }} onClick={() => setPickerOpen(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background:C.c1, borderRadius:'20px 20px 0 0', border:`1px solid ${C.bdr}`, maxHeight:'70vh', overflowY:'auto', padding:'20px 16px 40px' }}>
              <div style={{ width:36, height:4, background:C.dim, borderRadius:4, margin:'0 auto 18px' }} />
              <div style={{ fontSize:10, color:C.acc, textTransform:'uppercase', letterSpacing:3, fontWeight:700, marginBottom:16, fontFamily:INTER }}>
                Elige receta — {pickerOpen.tipo}
              </div>
              <button onClick={() => asignarReceta(pickerOpen.fecha, pickerOpen.tipo, null)}
                style={{ width:'100%', padding:'14px', marginBottom:10, borderRadius:12, border:`1px solid ${C.bdr}`, background:'transparent', color:C.mut, fontFamily:INTER, fontSize:12, cursor:'pointer', textAlign:'left' }}>
                ✕ Sin receta
              </button>
              {[...RECETAS, ...recetasExtra].filter(r =>
                r.tipo === pickerOpen.tipo ||
                (r.tipo === 'plato' && (pickerOpen.tipo === 'comida' || pickerOpen.tipo === 'cena'))
              ).map(r => (
                <button key={r.id} onClick={() => asignarReceta(pickerOpen.fecha, pickerOpen.tipo, r.id)}
                  style={{ width:'100%', padding:'14px 16px', marginBottom:8, borderRadius:12, border:`1px solid ${planSemana[pickerOpen.fecha]?.[pickerOpen.tipo] === r.id ? C.acc : C.bdr}`, background: planSemana[pickerOpen.fecha]?.[pickerOpen.tipo] === r.id ? C.accd : C.c2, color:C.txt, fontFamily:INTER, fontSize:13, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:24 }}>{r.emoji}</span>
                  <div>
                    <div style={{ fontWeight:700, fontFamily:SYNE, fontSize:13 }}>{r.nombre}</div>
                    <div style={{ fontSize:11, color:C.mut, marginTop:2 }}>{r.tiempo} · {r.kcal} kcal · {r.utensilio}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
          @keyframes cffall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(300px) rotate(720deg);opacity:0}}
          @keyframes xpglow{0%{box-shadow:0 0 0 rgba(92,79,232,0)}50%{box-shadow:0 0 18px rgba(136,128,240,0.7)}100%{box-shadow:0 0 0 rgba(92,79,232,0)}}
          @keyframes xpbar{0%{opacity:0.6}100%{opacity:1}}
          *::-webkit-scrollbar{display:none}
          input{outline:none;-webkit-tap-highlight-color:transparent}
        `}</style>

        {dbError && (
          <div style={{ background:'#1a0a0b', borderBottom:`1px solid ${C.accd}`, padding:'10px 18px', display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:13 }}>⚠️</span>
            <span style={{ fontSize:11, color:C.acc, fontFamily:INTER, flex:1 }}>{dbError}</span>
            <button onClick={() => setDbError('')} style={{ border:'none', background:'transparent', color:C.mut, cursor:'pointer', fontSize:18 }}>×</button>
          </div>
        )}

        {/* ── TOPBAR ── */}
        <div style={{ background:C.c1, borderBottom:`1px solid ${C.bdr}`, padding:'20px 18px 16px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{ width:58, height:58, borderRadius:18, background:C.c3, border:`2px solid ${C.bdr}`, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>
                  {noCabreImg
                    ? <span style={{ fontSize:28 }}>👤</span>
                    : <img src="/cabre.png" alt="Cabre" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={() => setNoCabreImg(true)} />
                  }
                </div>
                <div style={{ position:'absolute', bottom:-6, right:-6, background:lvlInfo.color, borderRadius:8, padding:'2px 7px', fontFamily:SYNE, fontSize:9, fontWeight:800, color:'#000', border:`2px solid ${C.bg}` }}>Nv.{lvlInfo.nivel}</div>
              </div>
              <div>
                <div style={{ fontFamily:SYNE, fontSize:26, fontWeight:800, color:C.txt, lineHeight:1, letterSpacing:-1 }}>Cabre</div>
                <div style={{ fontSize:11, color:lvlInfo.color, fontWeight:700, marginTop:4, fontFamily:INTER }}>{lvlInfo.emoji} {lvlInfo.nombre}</div>
                <div style={{ fontSize:10, color:C.dim, marginTop:2, fontFamily:INTER }}>{fechaHoy()}</div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', background:C.c3, border:`1px solid ${monsterTomado ? C.accd : C.grn}`, borderRadius:16, padding:'10px 16px', gap:2 }}>
              {noMonsterImg
                ? <span style={{ fontSize:22 }}>🥤</span>
                : <img src="/monster.png" alt="M" style={{ width:26, height:26, objectFit:'contain' }} onError={() => setNoMonsterImg(true)} />
              }
              <div style={{ fontFamily:SYNE, fontSize:28, fontWeight:800, color: monsterTomado ? C.acc : C.grnl, lineHeight:1 }}>{monsterTomado ? '0' : rachaMonsterDias}</div>
              <div style={{ fontSize:8, color:C.mut, fontWeight:600, textTransform:'uppercase', letterSpacing:1, fontFamily:INTER }}>sin Monster</div>
            </div>
          </div>

          {/* XP BAR */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:10, fontWeight:800, color:lvlInfo.color, textTransform:'uppercase', letterSpacing:2, fontFamily:INTER }}>XP</span>
            <div style={{ flex:1, background:C.c3, borderRadius:20, height:8, overflow:'hidden', position:'relative' }}>
              <div style={{ height:'100%', background:`linear-gradient(90deg, ${lvlInfo.color}99, ${lvlInfo.color})`, borderRadius:20, width:`${lvlInfo.prog}%`, transition:'width 0.8s cubic-bezier(0.34,1.56,0.64,1)', animation: xpBump ? 'xpbar 0.3s ease-in-out' : 'none' }} />
              {xpBump && <div style={{ position:'absolute', inset:0, background:`linear-gradient(90deg, transparent, ${lvlInfo.color}40, transparent)`, animation:'xpglow 0.6s ease-out' }} />}
            </div>
            <span style={{ fontSize:10, fontWeight:700, color:lvlInfo.color, fontFamily:INTER, minWidth:80, textAlign:'right' }}>{lvlInfo.xpEnNivel} / {lvlInfo.maxXp - lvlInfo.minXp} XP</span>
          </div>
          {!lvlInfo.isMax && (
            <div style={{ fontSize:9, color:C.dim, textAlign:'right', marginTop:4, fontFamily:INTER }}>{lvlInfo.xpParaSubir} XP para {NIVELES.find(n => n.nivel === lvlInfo.nivel+1)?.nombre}</div>
          )}
        </div>

        {/* ── RINGS ── */}
        <div style={{ background:C.c1, borderBottom:`1px solid ${C.bdr}`, padding:'14px 18px 16px', flexShrink:0 }}>
          <div style={{ fontSize:9, color:C.mut, textTransform:'uppercase', letterSpacing:3, fontWeight:700, marginBottom:12, fontFamily:INTER }}>Misiones de hoy</div>
          <div style={{ display:'flex', justifyContent:'space-around' }}>
            <Ring pct={pctCocina} color={C.acc} label={`${completadas}/3`} sub="Cocina" status={pctCocina===100 ? 'HECHO':'EN CURSO'} statusColor={pctCocina===100 ? C.grnl : C.acc} />
            <Ring pct={gymHecho ? 100 : 0} color={C.xp} label={gymHecho ? '1/1':'0/1'} sub="Gym" status={gymHecho ? 'HECHO':'PENDIENTE'} statusColor={gymHecho ? C.grnl : C.mut} />
            <Ring pct={limpiezaHecha ? 100 : 0} color={C.grnl} label={limpiezaHecha ? '1/1' : '0/1'} sub="Casa" status={limpiezaHecha ? 'HECHO' : 'PENDIENTE'} statusColor={limpiezaHecha ? C.grnl : C.mut} />
          </div>
        </div>

        {/* ── SCROLL CONTENT ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 14px 110px' }}>

          {/* ═══ HOY ════════════════════════════════════════════════ */}
          {tab === 'hoy' && (() => {
            const todayPlan = planSemana[TODAY] ?? {};
            const hasPlan   = !!(todayPlan.desayuno || todayPlan.comida || todayPlan.cena);
            const esDomingo = new Date().getDay() === 0;
            const nextMonday = addWeeks(getMonday(new Date()), 1);
            const nextWeekFechas = getSemanaFechas(nextMonday);
            const proxSemanaPlaneada = nextWeekFechas.some(f => planSemana[f]?.desayuno || planSemana[f]?.comida || planSemana[f]?.cena);

            const seccionesComida = [
              { label:'Desayuno', tipo:'desayuno' as TipoComida, icon:'🌅', kcalRef:300, id: todayPlan.desayuno ?? 3  },
              { label:'Comida',   tipo:'comida'   as TipoComida, icon:'☀️', kcalRef:450, id: todayPlan.comida   ?? 1  },
              { label:'Cena',     tipo:'cena'     as TipoComida, icon:'🌙', kcalRef:320, id: todayPlan.cena     ?? 2  },
            ];
            return (
              <>
                <Banner img="/luffy.png" titulo="¡Misión de hoy, Cabre!" texto="Cada día que cocinas,<br/>subes de nivel. Sin excusas." />

                {/* Aviso domingo: planifica la próxima semana */}
                {esDomingo && !proxSemanaPlaneada && (
                  <button onClick={() => { setTab('plan'); setPlanView('semana'); setSemanaActual(nextMonday); }}
                    style={{ width:'100%', background:'#0d0a20', border:`1px solid ${C.xp}`, borderRadius:16, padding:'14px 16px', marginBottom:12, display:'flex', alignItems:'center', gap:12, cursor:'pointer', textAlign:'left' }}>
                    <span style={{ fontSize:22, flexShrink:0 }}>📅</span>
                    <div>
                      <div style={{ fontFamily:SYNE, fontSize:13, fontWeight:800, color:C.xpl }}>¡Es domingo! Planifica la semana</div>
                      <div style={{ fontSize:11, color:C.dim, marginTop:3, fontFamily:INTER }}>La próxima semana no tiene recetas asignadas. Toca para planificar.</div>
                    </div>
                    <span style={{ marginLeft:'auto', color:C.xpl, fontSize:18, flexShrink:0 }}>›</span>
                  </button>
                )}

                {!hasPlan && (
                  <div style={{ background:C.c3, border:`1px solid ${C.bdr}`, borderRadius:14, padding:'10px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:16 }}>💡</span>
                    <span style={{ fontSize:11, color:C.mut, fontFamily:INTER }}>Sugerencia del día · Ve a <strong style={{color:C.acc}}>Plan → Semana</strong> para asignar tus recetas</span>
                  </div>
                )}

                {seccionesComida.map(s => {
                  const r = RECETAS.find(x => x.id === s.id);
                  if (!r) return null;
                  const mealDone   = s.tipo === 'desayuno' ? desayunoHecho : s.tipo === 'comida' ? comidaHecha : cenaHecha;
                  const consejo    = consejos[s.tipo];
                  const cargando   = cargandoConsejo[s.tipo];
                  return (
                    <div key={s.label} style={{ marginBottom:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, paddingLeft:2 }}>
                        <span style={{ fontSize:14 }}>{s.icon}</span>
                        <span style={{ fontFamily:SYNE, fontSize:11, fontWeight:800, color:C.mut, textTransform:'uppercase', letterSpacing:2.5 }}>{s.label}</span>
                        <span style={{ fontSize:9, color:C.dim, fontFamily:INTER }}>~{s.kcalRef} kcal</span>
                        <div style={{ flex:1, height:1, background:C.bdr }} />
                      </div>
                      <RecetaCard r={r} hecha={mealDone} expandida={expandida} setExpandida={setExpandida} completar={mealDone ? undefined : completar} />

                      {/* Consejo nutricional IA */}
                      {consejo ? (
                        <div style={{ background:'#090820', border:`1px solid ${C.xp}30`, borderRadius:13, padding:'12px 14px', marginTop:6, display:'flex', gap:10, alignItems:'flex-start' }}>
                          <span style={{ fontSize:16, flexShrink:0 }}>🧠</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:9, color:C.xpl, fontWeight:700, textTransform:'uppercase', letterSpacing:2, marginBottom:5, fontFamily:INTER }}>Consejo IA</div>
                            <div style={{ fontSize:12, color:C.mut, fontFamily:INTER, lineHeight:1.6 }}>{consejo}</div>
                          </div>
                          <button onClick={() => setConsejos(prev => ({ ...prev, [s.tipo]: undefined }))}
                            style={{ border:'none', background:'transparent', color:C.dim, fontSize:16, cursor:'pointer', flexShrink:0, padding:0, lineHeight:1 }}>×</button>
                        </div>
                      ) : (
                        <button onClick={() => pedirConsejo(s.tipo, r)} disabled={!!cargando}
                          style={{ width:'100%', marginTop:6, padding:'8px 14px', borderRadius:11, border:`1px solid ${C.xp}30`, background:'transparent', color: cargando ? C.dim : C.xpl, fontFamily:INTER, fontSize:10, cursor: cargando ? 'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontWeight:600 }}>
                          {cargando
                            ? <><span style={{ display:'inline-block', width:10, height:10, border:'1.5px solid #ffffff22', borderTopColor:C.xpl, borderRadius:'50%', animation:'spin 0.7s linear infinite' }} /> Generando consejo…</>
                            : <>✨ Pedir consejo nutricional</>}
                        </button>
                      )}
                    </div>
                  );
                })}

                <Banner img="/zoro.png" titulo="Limpieza de hoy" texto="Zoro no se rinde.<br/>Tú tampoco." />
                <div style={{ ...sec, padding:'18px' }}>
                  <div style={{ fontSize:9, color:C.mut, textTransform:'uppercase', letterSpacing:3, fontWeight:700, marginBottom:12, fontFamily:INTER }}>Tareas de hoy</div>
                  {[
                    { emoji:'🍽️', label:'Fregar platos después de cada comida' },
                    { emoji:'🧹', label:'Pasar aspiradora 15 min' },
                    { emoji:'🗑️', label:'Sacar basura' },
                    { emoji:'📦', label:'Recoger y ordenar' },
                  ].map((t, i, arr) => {
                    const done = tareasLimpieza[i];
                    const toggle = () => {
                      const next = tareasLimpieza.map((v, j) => j === i ? !v : v);
                      setTareasLimpieza(next);
                      setLimpiezaHecha(next.every(Boolean));
                    };
                    return (
                      <div key={i} onClick={toggle} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom: i===arr.length-1 ? 'none' : `1px solid ${C.bdr}`, cursor:'pointer' }}>
                        <div style={{ width:24, height:24, borderRadius:7, border:`1.5px solid ${done ? C.grnl : C.bdr}`, background: done ? C.grnl : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#06060a', flexShrink:0, transition:'all 0.2s' }}>
                          {done && '✓'}
                        </div>
                        <span style={{ fontSize:18 }}>{t.emoji}</span>
                        <span style={{ flex:1, fontSize:13, fontWeight:600, color: done ? C.dim : C.txt, textDecoration: done ? 'line-through' : 'none', fontFamily:INTER }}>{t.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* GYM BUTTON */}
                <div style={{ marginBottom:12 }}>
                  <button onClick={() => {
                    if (!gymHecho) {
                      const prevLvl = getLevelInfo(xp).nivel;
                      setGymHecho(true);
                      const nuevo = xp + 60;
                      setXp(nuevo);
                      setXpBump(true); setTimeout(() => setXpBump(false), 600);
                      playSound('xp');
                      setConfetti(true); setTimeout(() => setConfetti(false), 1500);
                      if (getLevelInfo(nuevo).nivel > prevLvl) setTimeout(() => { setLevelUp(getLevelInfo(nuevo).nivel); playSound('levelup'); }, 500);
                    }
                  }} style={{ width:'100%', padding:'18px', borderRadius:18, border:`2px solid ${gymHecho ? C.grn : C.acc}`, background: gymHecho ? C.grn : C.acc, color:'#fff', fontFamily:SYNE, fontWeight:800, fontSize:15, cursor: gymHecho ? 'default' : 'pointer', textTransform:'uppercase', letterSpacing:2, display:'flex', alignItems:'center', justifyContent:'center', gap:10, transition:'all 0.3s' }}>
                    <span style={{ fontSize:22 }}>{gymHecho ? '✓' : '💪'}</span>
                    {gymHecho ? 'GYM COMPLETADO +60XP' : 'HE IDO AL GYM HOY'}
                  </button>
                  {gymHecho && (
                    <button onClick={() => setGymHecho(false)} style={{ width:'100%', marginTop:6, padding:'8px', borderRadius:10, border:`1px solid ${C.bdr}`, background:'transparent', color:C.mut, fontFamily:INTER, fontSize:10, cursor:'pointer', letterSpacing:1 }}>
                      ← Deshacer / Rectificar
                    </button>
                  )}
                </div>

                {/* ── NOTAS Y TAREAS ── */}
                <div style={{ ...sec, padding:'18px' }}>
                  <div style={{ fontSize:9, color:C.mut, textTransform:'uppercase', letterSpacing:3, fontWeight:700, marginBottom:14, fontFamily:INTER }}>Notas y tareas</div>
                  <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                    <input type="text" placeholder="Apunta una tarea o nota…" value={notaInput} onChange={e => setNotaInput(e.target.value)}
                      onKeyDown={e => { if(e.key==='Enter') añadirNota(); }}
                      style={{ flex:1, padding:'10px 12px', borderRadius:10, border:`1px solid ${C.bdr}`, background:C.c2, color:C.txt, fontFamily:INTER, fontSize:13 }} />
                    <button onClick={añadirNota}
                      style={{ padding:'10px 16px', borderRadius:10, border:'none', background:C.acc, color:'#fff', fontFamily:SYNE, fontWeight:800, fontSize:12, cursor:'pointer', flexShrink:0 }}>+</button>
                  </div>
                  {notas.length === 0 && (
                    <div style={{ fontSize:12, color:C.dim, fontFamily:INTER, textAlign:'center', padding:'4px 0' }}>Sin notas hoy</div>
                  )}
                  {notas.map(n => (
                    <div key={n.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:`1px solid ${C.bdr}` }}>
                      <div onClick={() => setNotas(prev => prev.map(x => x.id===n.id ? {...x,hecha:!x.hecha} : x))}
                        style={{ width:22, height:22, borderRadius:6, border:`1.5px solid ${n.hecha ? C.grnl : C.bdr}`, background: n.hecha ? C.grnl : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#06060a', flexShrink:0, cursor:'pointer', transition:'all 0.2s' }}>
                        {n.hecha && '✓'}
                      </div>
                      <span style={{ flex:1, fontSize:13, color: n.hecha ? C.dim : C.txt, textDecoration: n.hecha ? 'line-through':'none', fontFamily:INTER }}>{n.texto}</span>
                      <button onClick={() => setNotas(prev => prev.filter(x => x.id !== n.id))}
                        style={{ border:'none', background:'transparent', color:C.dim, fontSize:14, cursor:'pointer', padding:'2px 4px' }}>×</button>
                    </div>
                  ))}
                </div>

                {/* ── ACTIVIDADES IA ── */}
                <div style={{ ...sec, padding:'18px' }}>
                  <div style={{ fontSize:9, color:C.mut, textTransform:'uppercase', letterSpacing:3, fontWeight:700, marginBottom:14, fontFamily:INTER }}>Para el rato libre</div>
                  <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                    <input
                      type="text"
                      placeholder="¿Qué te apetece hacer? (anime, pasear, jugar…)"
                      value={apetece}
                      onChange={e => setApetece(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && apetece.trim()) generarActividades(); }}
                      style={{ flex:1, padding:'11px 14px', borderRadius:12, border:`1px solid ${C.bdr}`, background:C.c2, color:C.txt, fontFamily:INTER, fontSize:13, outline:'none' }}
                    />
                    <button
                      onClick={generarActividades}
                      disabled={cargandoActs || !apetece.trim()}
                      style={{ padding:'11px 14px', borderRadius:12, border:'none', background: cargandoActs || !apetece.trim() ? C.c3 : C.xp, color: cargandoActs || !apetece.trim() ? C.dim : '#fff', fontFamily:SYNE, fontWeight:800, fontSize:12, cursor: cargandoActs || !apetece.trim() ? 'default':'pointer', flexShrink:0, display:'flex', alignItems:'center', gap:5, transition:'background 0.2s' }}>
                      {cargandoActs
                        ? <span style={{ display:'inline-block', width:12, height:12, border:'1.5px solid #ffffff22', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                        : '✨'}
                    </button>
                  </div>
                  {actividades.length === 0 ? (
                    <div style={{ fontSize:12, color:C.dim, fontFamily:INTER, textAlign:'center', padding:'8px 0' }}>Escribe qué te apetece y pulsa ✨ para ver planes</div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {actividades.map((a,i) => (
                        <div key={i} style={{ background:C.c2, border:`1px solid ${C.bdr}`, borderRadius:14, padding:'14px 12px', display:'flex', alignItems:'center', gap:10 }}>
                          <span style={{ fontSize:20 }}>{a.emoji}</span>
                          <span style={{ fontSize:12, fontWeight:600, color:C.txt, fontFamily:INTER, lineHeight:1.4 }}>{a.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          {/* ═══ PLAN ═══════════════════════════════════════════════ */}
          {tab === 'plan' && (
            <>
              {/* Sub-tabs */}
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                {([['semana','📅 Semana'],['recetas','🍽️ Recetas']] as const).map(([id,label]) => (
                  <button key={id} onClick={() => setPlanView(id)} style={{ flex:1, padding:'10px', borderRadius:12, border:`1px solid ${planView===id ? C.acc : C.bdr}`, background: planView===id ? C.accd : C.c1, color: planView===id ? C.accl : C.mut, fontFamily:SYNE, fontWeight:800, fontSize:11, cursor:'pointer', textTransform:'uppercase', letterSpacing:1.5 }}>
                    {label}
                  </button>
                ))}
              </div>

              {planView === 'recetas' && (
                <>
                  {/* ── GENERADOR IA ── */}
                  <div style={{ background:'#0a0820', border:`1px solid ${C.xp}40`, borderRadius:18, padding:'16px', marginBottom:16 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:`${C.xp}30`, border:`1px solid ${C.xp}60`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>✨</div>
                      <div>
                        <div style={{ fontFamily:SYNE, fontSize:13, fontWeight:800, color:C.xpl }}>Generar receta con IA</div>
                        <div style={{ fontSize:10, color:C.dim, fontFamily:INTER }}>Claude sugiere una receta personalizada</div>
                      </div>
                    </div>

                    {/* Tipo selector — 2 botones */}
                    <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                      {([['desayuno','🌅','Desayuno'],['plato','☀️🌙','Comidas & Cenas']] as ['desayuno'|'plato', string, string][]).map(([t, ic, label]) => (
                        <button key={t} onClick={() => setIaTipo(t)}
                          style={{ flex:1, padding:'9px 6px', borderRadius:10, border:`1px solid ${iaTipo===t ? C.xp : C.bdr}`, background: iaTipo===t ? `${C.xp}25` : C.c2, color: iaTipo===t ? C.xpl : C.mut, fontFamily:INTER, fontWeight:700, fontSize:11, cursor:'pointer', textAlign:'center' }}>
                          {ic} {label}
                        </button>
                      ))}
                    </div>

                    {/* Restricciones */}
                    <input
                      value={iaInput}
                      onChange={e => setIaInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !iaGenerando) generarRecetaIA(); }}
                      placeholder="Sin gluten, con pollo, rápida… (opcional)"
                      style={{ width:'100%', background:C.c2, border:`1px solid ${C.bdr}`, borderRadius:10, padding:'10px 14px', color:C.txt, fontFamily:INTER, fontSize:12, marginBottom:10, boxSizing:'border-box' }}
                    />

                    <button onClick={generarRecetaIA} disabled={iaGenerando}
                      style={{ width:'100%', padding:'12px', borderRadius:12, border:'none', background: iaGenerando ? C.dim : `linear-gradient(135deg,${C.xp},${C.xpl})`, color:'#fff', fontFamily:SYNE, fontWeight:800, fontSize:12, cursor: iaGenerando ? 'default' : 'pointer', textTransform:'uppercase', letterSpacing:2, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                      {iaGenerando ? (
                        <>
                          <span style={{ display:'inline-block', width:12, height:12, border:'2px solid #fff4', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                          Generando…
                        </>
                      ) : '✨ Generar receta'}
                    </button>

                    {iaError && <div style={{ fontSize:11, color:C.acc, marginTop:8, fontFamily:INTER }}>{iaError}</div>}
                  </div>

                  {/* Receta generada */}
                  {iaReceta && (
                    <div style={{ background:C.c1, border:`1px solid ${C.xp}60`, borderRadius:18, padding:'16px', marginBottom:16 }}>
                      <div style={{ fontSize:9, color:C.xpl, textTransform:'uppercase', letterSpacing:3, fontWeight:700, marginBottom:10, fontFamily:INTER }}>✨ Nueva receta generada</div>
                      <RecetaCard
                        r={{ ...iaReceta, id: -1, tipo: iaTipo === 'desayuno' ? 'desayuno' as const : 'comida' as const }}
                        hecha={false}
                        expandida={expandida}
                        setExpandida={setExpandida}
                        compact
                      />
                      <button onClick={guardarRecetaIA}
                        style={{ width:'100%', marginTop:8, padding:'12px', borderRadius:12, border:`1px solid ${C.xp}`, background:`${C.xp}20`, color:C.xpl, fontFamily:SYNE, fontWeight:800, fontSize:11, cursor:'pointer', textTransform:'uppercase', letterSpacing:2 }}>
                        + Añadir a mis recetas
                      </button>
                      <button onClick={() => setIaReceta(null)}
                        style={{ width:'100%', marginTop:6, padding:'8px', borderRadius:10, border:'none', background:'transparent', color:C.dim, fontFamily:INTER, fontSize:10, cursor:'pointer' }}>
                        Descartar
                      </button>
                    </div>
                  )}

                  {/* Recetas extra generadas */}
                  {[
                    { tipo:'desayuno', label:'Desayunos',     icon:'🌅', list: DESAYUNOS },
                    { tipo:'plato',    label:'Comidas & Cenas',icon:'☀️🌙',list: [...COMIDAS, ...CENAS] },
                  ].map(grupo => {
                    const extra = recetasExtra
                      .filter(r => r.tipo === grupo.tipo)
                      .map(r => ({ ...r, tipo: grupo.tipo === 'plato' ? 'comida' as const : r.tipo as 'desayuno' }));
                    const all = [...grupo.list, ...extra];
                    return (
                      <div key={grupo.tipo} style={{ marginBottom:6 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, paddingLeft:2 }}>
                          <span style={{ fontSize:14 }}>{grupo.icon}</span>
                          <span style={{ fontFamily:SYNE, fontSize:11, fontWeight:800, color:C.mut, textTransform:'uppercase', letterSpacing:2.5 }}>{grupo.label}</span>
                          <div style={{ flex:1, height:1, background:C.bdr }} />
                        </div>
                        {all.map(r => (
                          <RecetaCard key={r.id} r={r} hecha={false} expandida={expandida} setExpandida={setExpandida} compact />
                        ))}
                      </div>
                    );
                  })}
                </>
              )}

              {planView === 'semana' && (
                <>
                  {/* Navegador de semana */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                    <button onClick={() => setSemanaActual(d => addWeeks(d,-1))} style={{ width:38, height:38, borderRadius:11, border:`1px solid ${C.bdr}`, background:C.c1, color:C.txt, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:SYNE, fontSize:13, fontWeight:800, color:C.txt }}>
                        {new Date(semanaFechas[0]+'T12:00:00').toLocaleDateString('es',{day:'numeric',month:'short'})} – {new Date(semanaFechas[6]+'T12:00:00').toLocaleDateString('es',{day:'numeric',month:'short'})}
                      </div>
                      {semanaFechas[0] === getSemanaFechas(getMonday(new Date()))[0] && (
                        <div style={{ fontSize:9, color:C.acc, fontWeight:700, letterSpacing:2, textTransform:'uppercase', fontFamily:INTER }}>Esta semana</div>
                      )}
                    </div>
                    <button onClick={() => setSemanaActual(d => addWeeks(d,1))} style={{ width:38, height:38, borderRadius:11, border:`1px solid ${C.bdr}`, background:C.c1, color:C.txt, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
                  </div>

                  {/* Grid de la semana */}
                  {semanaFechas.map(fecha => {
                    const dia      = planSemana[fecha] ?? {};
                    const esHoy    = fecha === TODAY;
                    const dLabel   = formatFechaCorta(fecha);
                    return (
                      <div key={fecha} style={{ background: esHoy ? '#0d0d1a' : C.c1, border:`1px solid ${esHoy ? C.xp : C.bdr}`, borderRadius:18, marginBottom:10, padding:'14px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                          <span style={{ fontFamily:SYNE, fontSize:13, fontWeight:800, color: esHoy ? C.xpl : C.txt }}>{dLabel}</span>
                          {esHoy && <span style={{ fontSize:9, color:C.xpl, fontWeight:700, letterSpacing:2, textTransform:'uppercase', fontFamily:INTER }}>HOY</span>}
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                          {(['desayuno','comida','cena'] as TipoComida[]).map(tipo => {
                            const rId  = dia[tipo];
                            const rec  = rId ? RECETAS.find(r => r.id === rId) : null;
                            const icon = tipo==='desayuno' ? '🌅' : tipo==='comida' ? '☀️' : '🌙';
                            return (
                              <button key={tipo} onClick={() => setPickerOpen({ fecha, tipo })}
                                style={{ background: rec ? C.accd : C.c2, border:`1px solid ${rec ? C.accd : C.bdr}`, borderRadius:12, padding:'10px 8px', textAlign:'center', cursor:'pointer', minHeight:72, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
                                {rec ? (
                                  <>
                                    <span style={{ fontSize:22 }}>{rec.emoji}</span>
                                    <span style={{ fontSize:9, color:C.txt, fontWeight:700, fontFamily:INTER, lineHeight:1.3 }}>{rec.nombre}</span>
                                  </>
                                ) : (
                                  <>
                                    <span style={{ fontSize:18, opacity:0.4 }}>{icon}</span>
                                    <span style={{ fontSize:9, color:C.dim, fontFamily:INTER }}>+ {tipo}</span>
                                  </>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Resumen semanal */}
                  <div style={{ ...sec, marginTop:8 }}>
                    <div style={{ fontSize:10, color:C.acc, textTransform:'uppercase', letterSpacing:3, fontWeight:700, marginBottom:14, fontFamily:INTER }}>Resumen de la semana</div>
                    {cargandoRes ? (
                      <div style={{ fontSize:12, color:C.mut, fontFamily:INTER, padding:'8px 0' }}>Cargando datos…</div>
                    ) : resumenSemana ? (
                      <>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                          {[
                            { v:`${resumenSemana.diasCocinados}/7`, label:'Días cocinados', color:C.acc },
                            { v:`${resumenSemana.gymSesiones}`,     label:'Sesiones gym',   color:C.xpl },
                            { v:`${resumenSemana.totalMonsters}`,   label:'Monsters',       color:C.grnl },
                            { v:`${resumenSemana.totalGastos.toFixed(0)}€`, label:'Gastado', color:C.txt },
                          ].map(({v,label,color}) => (
                            <div key={label} style={{ background:C.c2, borderRadius:14, padding:'14px 12px', textAlign:'center', border:`1px solid ${C.bdr}` }}>
                              <div style={{ fontFamily:SYNE, fontSize:24, fontWeight:800, color, letterSpacing:-0.5 }}>{v}</div>
                              <div style={{ fontSize:9, color:C.mut, textTransform:'uppercase', letterSpacing:1, marginTop:4, fontFamily:INTER }}>{label}</div>
                            </div>
                          ))}
                        </div>
                        {/* Puntos por día */}
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          {semanaFechas.map(f => {
                            const m = resumenSemana.misionesMap[f];
                            const done = m && (m.d || m.c || m.n);
                            const gym  = m && m.g;
                            const esFuturo = f > TODAY;
                            return (
                              <div key={f} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                                <div style={{ width:8, height:8, borderRadius:'50%', background: esFuturo ? C.c3 : done ? C.grnl : C.accd }} />
                                {gym && <div style={{ width:6, height:6, borderRadius:'50%', background:C.xpl }} />}
                                <span style={{ fontSize:8, color:C.dim, fontFamily:INTER }}>{['L','M','X','J','V','S','D'][semanaFechas.indexOf(f)]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize:12, color:C.mut, fontFamily:INTER }}>Sin datos para esta semana.</div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* ═══ KCAL ═══════════════════════════════════════════════ */}
          {tab === 'kcal' && (
            <>
              <Banner img="/spike.png" titulo="Panel del día" texto="Spike no toma Monster.<br/>¿Y tú hoy?" />
              <div style={sec}>
                <div style={{ fontSize:10, fontWeight:700, color:C.acc, textTransform:'uppercase', letterSpacing:3, marginBottom:16, fontFamily:INTER }}>Balance calórico de hoy</div>
                {[
                  { icon:'🍽️', label:'Comida del día',   value:kcalComida,      color:C.txt },
                  { icon:'🥤', label:'Bebidas',           value:kcalBeb,         color: kcalBeb>0 ? C.acc : C.mut },
                  ...(gymHecho ? [{ icon:'💪', label:'Gym ~1h (quemado)', value:-kcalGymQuemado, color:C.grnl }] : []),
                ].map(({icon,label,value,color}) => (
                  <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:`1px solid ${C.bdr}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:15 }}>{icon}</span>
                      <span style={{ fontSize:12, color:C.mut, fontFamily:INTER }}>{label}</span>
                    </div>
                    <span style={{ fontFamily:SYNE, fontSize:15, fontWeight:800, color }}>{value > 0 ? `+${value}` : value} kcal</span>
                  </div>
                ))}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${C.bdr}` }}>
                  <span style={{ fontSize:13, fontWeight:700, color:C.txt, fontFamily:INTER }}>Total consumido</span>
                  <span style={{ fontFamily:SYNE, fontSize:22, fontWeight:800, color:C.txt }}>{kcalTot} kcal</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:`1px solid ${C.bdr}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:15 }}>💤</span>
                    <span style={{ fontSize:12, color:C.mut, fontFamily:INTER }}>Metabolismo basal (BMR)</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {editandoBmr ? (
                      <>
                        <input type="text" inputMode="numeric" value={bmrInput} onChange={e => setBmrInput(e.target.value)}
                          onKeyDown={e => { if(e.key==='Enter') guardarBmr(); if(e.key==='Escape') setEditandoBmr(false); }}
                          style={{ width:68, padding:'4px 8px', borderRadius:8, border:`1px solid ${C.xp}`, background:C.c2, color:C.txt, fontFamily:SYNE, fontWeight:700, fontSize:13, textAlign:'right' }} />
                        <button onClick={guardarBmr} style={{ padding:'4px 10px', borderRadius:8, border:'none', background:C.xp, color:'#fff', fontFamily:INTER, fontSize:11, fontWeight:700, cursor:'pointer' }}>OK</button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontFamily:SYNE, fontSize:15, fontWeight:800, color:C.grnl }}>−{bmr} kcal</span>
                        <button onClick={() => { setEditandoBmr(true); setBmrInput(String(bmr)); }}
                          style={{ border:'none', background:'transparent', color:C.dim, fontSize:12, cursor:'pointer', padding:0 }}>✏️</button>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ marginTop:14, padding:'14px 16px', background: balance<=0 ? '#050f0a':'#0f0508', border:`1px solid ${balance<=0 ? C.grn : C.accd}`, borderRadius:14 }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:8 }}>
                    <span style={{ fontFamily:SYNE, fontSize:32, fontWeight:800, color: balance<=0 ? C.grnl : C.acc, letterSpacing:-1, lineHeight:1 }}>
                      {balance<=0 ? `−${Math.abs(balance)}` : `+${balance}`}
                    </span>
                    <span style={{ fontSize:13, color:C.mut, fontFamily:INTER }}>kcal balance</span>
                  </div>
                  {balance<=0
                    ? <div style={{ fontSize:12, color:C.grnl, fontFamily:INTER, lineHeight:1.6 }}>Déficit de {Math.abs(balance)} kcal. Vas por buen camino. 🛡️</div>
                    : <div style={{ fontSize:12, color:C.accl, fontFamily:INTER, lineHeight:1.8 }}>Para cerrar el día en cero:<br/><span style={{ fontWeight:700, color:C.txt }}>{Math.round(balance*22).toLocaleString()} pasos</span> o <span style={{ fontWeight:700, color:C.txt }}>{Math.round(balance/10)} min de gym.</span></div>
                  }
                </div>
                <div style={{ marginTop:14 }}>
                  <div style={{ background:C.c3, borderRadius:20, height:8, overflow:'hidden', marginBottom:6 }}>
                    <div style={{ height:'100%', borderRadius:20, width:`${Math.min(100,pctKcal)}%`, background: pctKcal>100 ? C.acc : pctKcal>80 ? '#e6a234' : C.grnl, transition:'width 0.5s' }} />
                  </div>
                  <div style={{ fontSize:11, color:C.mut, textAlign:'right', fontFamily:INTER }}>{kcalTot} / {bmr} kcal · {Math.min(pctKcal,100)}%</div>
                </div>
              </div>

              {/* Racha refrescos */}
              <div style={{ ...sec, display:'flex', alignItems:'center', gap:18 }}>
                <div style={{ width:68, height:68, borderRadius:18, background: refrescoTomado ? '#150508':'#050f0a', border:`2px solid ${refrescoTomado ? C.accd : C.grn}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0, gap:2 }}>
                  <span style={{ fontSize:22 }}>{refrescoTomado ? '⚠️':'🛡️'}</span>
                  <span style={{ fontFamily:SYNE, fontSize:18, fontWeight:800, color: refrescoTomado ? C.acc : C.grnl, lineHeight:1 }}>{refrescoTomado ? '0' : rachaMonsterDias}</span>
                </div>
                <div>
                  <div style={{ fontFamily:SYNE, fontSize:15, fontWeight:800, color: refrescoTomado ? C.acc : C.grnl }}>{refrescoTomado ? 'Racha rota hoy' : `${rachaMonsterDias} días sin refresco`}</div>
                  <div style={{ fontSize:12, color:C.mut, marginTop:5, fontFamily:INTER, lineHeight:1.5 }}>{refrescoTomado ? 'Mañana puedes empezar de nuevo. Sin dramas.' : 'Sin Monster ni Coca-Cola. Eres imparable.'}</div>
                </div>
              </div>

              {/* Refrescos */}
              <div style={sec}>
                <div style={{ fontSize:10, fontWeight:700, color:C.acc, textTransform:'uppercase', letterSpacing:3, marginBottom:16, fontFamily:INTER }}>Refrescos del día</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                  {[
                    { label:'Monster',       sub:'500ml original', kcal:230, count:monsters,     fn:() => setMonsters(m => m+1),         isMonster:true  },
                    { label:'Monster Zero',  sub:'500ml zero',     kcal:15,  count:monstersZero, fn:() => setMonstersZero(m => m+1),     isMonster:true  },
                    { label:'Coca-Cola',     sub:'330ml original', kcal:139, count:colas,        fn:() => setColas(c => c+1),            isMonster:false },
                    { label:'Coca-Cola Zero',sub:'330ml zero',     kcal:0,   count:colasZero,    fn:() => setColasZero(c => c+1),        isMonster:false },
                  ].map(({ label, sub, kcal, count, fn, isMonster }) => (
                    <button key={label} onClick={fn} style={{ background:C.c2, border:`1px solid ${count>0 ? C.accd : C.bdr}`, borderRadius:16, padding:'14px 8px', textAlign:'center', cursor:'pointer' }}>
                      {isMonster && !noMonsterImg
                        ? <img src="/monster.png" alt="" style={{ width:28, height:28, objectFit:'contain', marginBottom:4 }} onError={() => setNoMonsterImg(true)} />
                        : <div style={{ fontSize:24, marginBottom:4 }}>🥤</div>
                      }
                      <div style={{ fontSize:12, fontWeight:700, color:C.txt, fontFamily:SYNE, lineHeight:1.3 }}>{label}</div>
                      <div style={{ fontSize:9, color:C.dim, marginTop:2, fontFamily:INTER }}>{sub}</div>
                      <div style={{ fontSize:10, color: kcal>0 ? C.acc : C.grnl, marginTop:4, fontFamily:INTER, fontWeight:700 }}>{kcal} kcal</div>
                      <div style={{ fontFamily:SYNE, fontSize:30, fontWeight:800, color: count>0 ? C.acc : C.txt, marginTop:6, lineHeight:1 }}>{count}</div>
                    </button>
                  ))}
                </div>
                <button onClick={() => { setMonsters(0); setMonstersZero(0); setColas(0); setColasZero(0); }} style={{ width:'100%', padding:11, borderRadius:11, border:`1px solid ${C.bdr}`, background:'transparent', color:C.mut, fontFamily:INTER, fontWeight:600, fontSize:11, cursor:'pointer', textTransform:'uppercase', letterSpacing:2 }}>
                  Resetear refrescos
                </button>
              </div>

              {kcalBeb > 0 && (
                <div style={{ background:'#0f0508', border:`1px solid ${C.accd}`, borderRadius:18, padding:'16px 18px', marginBottom:12 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.acc, textTransform:'uppercase', letterSpacing:2, marginBottom:8, fontFamily:INTER }}>Total bebidas hoy</div>
                  <div style={{ fontFamily:SYNE, fontSize:28, fontWeight:800, color:C.acc, letterSpacing:-1 }}>{kcalBeb} kcal</div>
                  <div style={{ fontSize:12, color:C.mut, marginTop:8, fontFamily:INTER, lineHeight:1.7 }}>Para quemarlo todo: {Math.round(kcalBeb*13.5).toLocaleString()} pasos o {Math.round(kcalBeb/10)} min de gym.</div>
                </div>
              )}

              {/* Notificaciones push */}
              {pushSupported && (
                <div style={{ ...sec, padding:'18px' }}>
                  <div style={{ fontSize:9, color:C.mut, textTransform:'uppercase', letterSpacing:3, fontWeight:700, marginBottom:12, fontFamily:INTER }}>Notificaciones</div>
                  {pushSub ? (
                    <div>
                      <div style={{ fontSize:12, color:C.grnl, fontFamily:INTER, marginBottom:10 }}>🔔 Activadas — recibirás recordatorios matutinos y nocturnos.</div>
                      <button onClick={desuscribirPush} style={{ width:'100%', padding:11, borderRadius:12, border:`1px solid ${C.bdr}`, background:'transparent', color:C.mut, fontFamily:INTER, fontWeight:600, fontSize:11, cursor:'pointer' }}>
                        Desactivar notificaciones
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize:12, color:C.dim, fontFamily:INTER, marginBottom:10, lineHeight:1.6 }}>Recibe un aviso a las 9:00 y a las 21:00 para recordarte registrar el día.</div>
                      <button onClick={suscribirPush} style={{ width:'100%', padding:13, borderRadius:12, border:'none', background:C.xp, color:'#fff', fontFamily:SYNE, fontWeight:800, fontSize:12, cursor:'pointer', textTransform:'uppercase', letterSpacing:2 }}>
                        🔔 Activar notificaciones
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ═══ COMPRA ══════════════════════════════════════════════ */}
          {tab === 'compra' && (
            <>
              <Banner img="/espada.png" titulo="Lista de la semana" texto="Generada automáticamente<br/>a partir de tu plan semanal." />
              {listaCompra.length === 0 ? (
                <div style={{ ...sec, textAlign:'center', padding:'32px 18px' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>📅</div>
                  <div style={{ fontSize:13, color:C.mut, fontFamily:INTER }}>Planifica tu semana en la tab <strong style={{color:C.acc}}>Plan</strong> para generar la lista automáticamente.</div>
                </div>
              ) : (() => {
                const cats = [...new Set(listaCompra.map(i => i.cat))].sort();
                return cats.map(cat => (
                  <div key={cat} style={sec}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.acc, textTransform:'uppercase', letterSpacing:3, marginBottom:14, fontFamily:INTER }}>{cat}</div>
                    {listaCompra.filter(i => i.cat === cat).map((ing, idx, arr) => (
                      <CompraItem key={ing.nombre} emoji={ing.emoji} nombre={ing.nombre} qty={ing.qty} last={idx===arr.length-1} />
                    ))}
                  </div>
                ));
              })()}
            </>
          )}

          {/* ═══ GASTOS ══════════════════════════════════════════════ */}
          {tab === 'gastos' && (
            <>
              {/* Presupuesto editable */}
              <div style={{ ...sec, padding:'20px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: editandoPresupuesto ? 12 : 0 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.acc, textTransform:'uppercase', letterSpacing:3, fontFamily:INTER }}>Presupuesto mensual</div>
                  <button onClick={() => { setEditandoPresupuesto(v => !v); setPresupuestoInput(String(presupuesto)); }} style={{ border:'none', background:'transparent', color: editandoPresupuesto ? C.acc : C.mut, fontFamily:INTER, fontSize:11, cursor:'pointer', fontWeight:600 }}>
                    {editandoPresupuesto ? 'Cancelar' : '✏️ Editar'}
                  </button>
                </div>
                {editandoPresupuesto ? (
                  <div style={{ display:'flex', gap:8, marginTop:4 }}>
                    <input type="text" inputMode="decimal" value={presupuestoInput} onChange={e => setPresupuestoInput(e.target.value)} onKeyDown={e => { if(e.key==='Enter') guardarPresupuesto(); }} style={{ flex:1, padding:'12px 14px', borderRadius:12, border:`1px solid ${C.acc}`, background:C.c2, color:C.txt, fontFamily:SYNE, fontWeight:800, fontSize:18 }} />
                    <button onClick={guardarPresupuesto} style={{ padding:'12px 20px', borderRadius:12, border:'none', background:C.acc, color:'#fff', fontFamily:SYNE, fontWeight:800, fontSize:12, cursor:'pointer' }}>Guardar</button>
                  </div>
                ) : (
                  <div style={{ fontFamily:SYNE, fontSize:36, fontWeight:800, color:C.txt, letterSpacing:-1, marginTop:4 }}>{presupuesto}€</div>
                )}
              </div>

              {/* Resumen */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                {[
                  { v:`${totalGastado.toFixed(0)}€`, label:'Gastado',    color: totalGastado>presupuesto ? C.acc : C.grnl },
                  { v:`${queda.toFixed(0)}€`,        label:'Queda',      color: queda<0 ? C.acc : C.txt },
                  { v:`${presupuesto}€`,             label:'Presupuesto', color:C.txt },
                  { v:`${pctGastado}%`,              label:'del mes',    color: pctGastado>80 ? C.acc : C.mut },
                ].map(({v,label,color}) => (
                  <div key={label} style={{ background:C.c1, border:`1px solid ${C.bdr}`, borderRadius:18, padding:'18px 14px', textAlign:'center' }}>
                    <div style={{ fontFamily:SYNE, fontSize:28, fontWeight:800, color, lineHeight:1, letterSpacing:-1 }}>{v}</div>
                    <div style={{ fontSize:10, color:C.mut, textTransform:'uppercase', letterSpacing:1.5, marginTop:6, fontWeight:600, fontFamily:INTER }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={sec}>
                <div style={{ background:C.c3, borderRadius:20, height:8, overflow:'hidden', marginBottom:8 }}>
                  <div style={{ height:'100%', width:`${pctGastado}%`, background: pctGastado>80 ? C.acc : C.grnl, borderRadius:20, transition:'width 0.5s' }} />
                </div>
                <div style={{ fontSize:11, color:C.mut, textAlign:'right', fontFamily:INTER }}>{pctGastado}% · {new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate()-new Date().getDate()} días restantes</div>
              </div>

              {/* Formulario nuevo gasto */}
              <div style={{ ...sec, padding:'20px 18px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:C.acc, textTransform:'uppercase', letterSpacing:3, marginBottom:14, fontFamily:INTER }}>Añadir gasto</div>
                <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                  <input type="text" inputMode="decimal" placeholder="€" value={gastoImporte} onChange={e => setGastoImporte(e.target.value)}
                    style={{ width:80, padding:'12px 14px', borderRadius:12, border:`1px solid ${C.bdr}`, background:C.c2, color:C.txt, fontFamily:SYNE, fontWeight:700, fontSize:15, flexShrink:0 }} />
                  <input type="text" placeholder="Descripción" value={gastoDesc} onChange={e => setGastoDesc(e.target.value)} onKeyDown={e => { if(e.key==='Enter') guardarGasto(); }}
                    style={{ flex:1, padding:'12px 14px', borderRadius:12, border:`1px solid ${C.bdr}`, background:C.c2, color:C.txt, fontFamily:INTER, fontSize:13 }} />
                </div>
                <button onClick={guardarGasto} disabled={guardandoGasto || !gastoImporte || !gastoDesc}
                  style={{ width:'100%', padding:13, borderRadius:13, border:'none', background: guardandoGasto||!gastoImporte||!gastoDesc ? C.c3 : C.acc, color: guardandoGasto||!gastoImporte||!gastoDesc ? C.mut : '#fff', fontFamily:SYNE, fontWeight:800, fontSize:12, cursor: guardandoGasto||!gastoImporte||!gastoDesc ? 'default':'pointer', textTransform:'uppercase', letterSpacing:2, transition:'all 0.2s' }}>
                  {guardandoGasto ? 'Guardando…' : '+ Guardar gasto'}
                </button>
              </div>

              {/* Lista gastos */}
              {gastosLista.length === 0 ? (
                <div style={{ ...sec, textAlign:'center', padding:'28px 18px' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>💸</div>
                  <div style={{ fontSize:13, color:C.mut, fontFamily:INTER }}>Sin gastos registrados.</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {gastosLista.map(g => (
                    <div key={g.id} style={{ background:C.c1, border:`1px solid ${editandoGasto===g.id ? C.acc : C.bdr}`, borderRadius:18, padding:'14px 16px', transition:'border-color 0.2s' }}>
                      {editandoGasto === g.id ? (
                        /* ── modo edición ── */
                        <div>
                          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                            <input type="text" inputMode="decimal" value={editGastoImporte} onChange={e => setEditGastoImporte(e.target.value)}
                              style={{ width:80, padding:'10px 12px', borderRadius:10, border:`1px solid ${C.acc}`, background:C.c2, color:C.txt, fontFamily:SYNE, fontWeight:700, fontSize:14, flexShrink:0 }} />
                            <input type="text" value={editGastoDesc} onChange={e => setEditGastoDesc(e.target.value)}
                              onKeyDown={e => { if(e.key==='Enter') guardarEdicionGasto(g.id); if(e.key==='Escape') setEditandoGasto(null); }}
                              style={{ flex:1, padding:'10px 12px', borderRadius:10, border:`1px solid ${C.acc}`, background:C.c2, color:C.txt, fontFamily:INTER, fontSize:13 }} />
                          </div>
                          <div style={{ display:'flex', gap:8 }}>
                            <button onClick={() => guardarEdicionGasto(g.id)}
                              style={{ flex:1, padding:'9px', borderRadius:10, border:'none', background:C.acc, color:'#fff', fontFamily:SYNE, fontWeight:800, fontSize:11, cursor:'pointer', textTransform:'uppercase', letterSpacing:1 }}>
                              Guardar
                            </button>
                            <button onClick={() => setEditandoGasto(null)}
                              style={{ padding:'9px 16px', borderRadius:10, border:`1px solid ${C.bdr}`, background:'transparent', color:C.mut, fontFamily:INTER, fontSize:11, cursor:'pointer' }}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── modo normal ── */
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{ width:42, height:42, borderRadius:12, background:C.c2, border:`1px solid ${C.bdr}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🛒</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:14, fontWeight:600, color:C.txt, fontFamily:INTER, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.descripcion}</div>
                            <div style={{ fontSize:11, color:C.dim, marginTop:3, fontFamily:INTER }}>{g.fecha === TODAY ? 'Hoy' : new Date(g.fecha+'T12:00:00').toLocaleDateString('es',{day:'numeric',month:'short'})}</div>
                          </div>
                          <span style={{ fontFamily:SYNE, fontSize:16, fontWeight:800, color:C.txt, flexShrink:0 }}>{Number(g.importe).toFixed(2)}€</span>
                          <div style={{ display:'flex', flexDirection:'column', gap:4, flexShrink:0 }}>
                            <button onClick={() => abrirEdicionGasto(g)}
                              style={{ width:30, height:30, borderRadius:8, border:`1px solid ${C.bdr}`, background:C.c2, color:C.mut, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              ✏️
                            </button>
                            <button onClick={() => eliminarGasto(g.id)}
                              style={{ width:30, height:30, borderRadius:8, border:`1px solid ${C.accd}`, background:'#1a0508', color:C.acc, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              🗑️
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>

        {/* ── BOTTOM NAV ── */}
        <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:420, background:'rgba(13,13,19,0.97)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', borderTop:`1px solid ${C.bdr}`, display:'flex', padding:'10px 0 20px', zIndex:30 }}>
          {navTabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'4px 2px', border:'none', background:'transparent', cursor:'pointer' }}>
              <span style={{ fontSize:20, opacity: tab===t.id ? 1 : 0.3, transition:'opacity 0.2s' }}>{t.icon}</span>
              <span style={{ fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, color: tab===t.id ? C.acc : C.mut, fontFamily:INTER, transition:'color 0.2s' }}>{t.label}</span>
              <div style={{ width:16, height:2, borderRadius:2, background: tab===t.id ? C.acc : 'transparent', marginTop:2, transition:'background 0.2s' }} />
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

// Separado para evitar re-renders desde Home
function CompraItem({ emoji, nombre, qty, last }: { emoji:string; nombre:string; qty:string; last:boolean }) {
  const [checked, setChecked] = useState(false);
  return (
    <div onClick={() => setChecked(v => !v)} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom: last ? 'none' : `1px solid ${C.bdr}`, cursor:'pointer' }}>
      <div style={{ width:22, height:22, borderRadius:6, border:`1.5px solid ${checked ? C.grnl : C.bdr}`, background: checked ? C.grnl : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#06060a', flexShrink:0, transition:'all 0.2s' }}>
        {checked && '✓'}
      </div>
      <span style={{ fontSize:18 }}>{emoji}</span>
      <span style={{ flex:1, fontSize:13, fontWeight:600, color: checked ? C.dim : C.txt, textDecoration: checked ? 'line-through' : 'none', fontFamily:INTER }}>{nombre}</span>
      <span style={{ fontSize:11, color:C.mut, fontFamily:INTER }}>{qty}</span>
    </div>
  );
}
