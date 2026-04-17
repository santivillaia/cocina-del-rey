'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// ── DATA ─────────────────────────────────────────────────────────────

const desayunos = [
  {
    id: 3, nombre: 'Yogur con cereales', emoji: '🥣', nivel: 'facil',
    tiempo: '5 min', kcal: 280, prot: '10g', carbos: '42g', grasa: '6g', utensilio: 'Bol',
    ingredientes: [
      { emoji: '🥛', nombre: 'Yogur natural', qty: '1 ud' },
      { emoji: '🌾', nombre: 'Cereales', qty: '40g' },
      { emoji: '🍌', nombre: 'Plátano', qty: '1/2' },
      { emoji: '🍯', nombre: 'Miel', qty: '1 cda' },
    ],
    pasos: [
      'Vierte el yogur en un bol.',
      'Añade los cereales encima.',
      'Corta medio plátano en rodajas y ponlo.',
      'Un chorrito de miel por encima. Listo.',
    ],
  },
  {
    id: 4, nombre: 'Sandwich de pavo', emoji: '🥪', nivel: 'facil',
    tiempo: '5 min', kcal: 320, prot: '22g', carbos: '36g', grasa: '8g', utensilio: 'Sin utensilios',
    ingredientes: [
      { emoji: '🍞', nombre: 'Pan de molde', qty: '2 rebanadas' },
      { emoji: '🦃', nombre: 'Pavo loncheado', qty: '3 lonchas' },
      { emoji: '🧀', nombre: 'Queso lonchas', qty: '1 loncha' },
      { emoji: '🥬', nombre: 'Lechuga', qty: 'un poco' },
    ],
    pasos: [
      'Pon las lonchas de pavo sobre el pan.',
      'Añade el queso y la lechuga.',
      'Cierra el sandwich.',
      'Córtalo por la mitad si quieres. Listo.',
    ],
  },
];

const comidas = [
  {
    id: 1, nombre: 'Tortilla de patatas', emoji: '🥚', nivel: 'facil',
    tiempo: '20 min', kcal: 420, prot: '18g', carbos: '32g', grasa: '22g', utensilio: 'Sartén',
    ingredientes: [
      { emoji: '🥔', nombre: 'Patatas', qty: '3 ud' },
      { emoji: '🥚', nombre: 'Huevos', qty: '4 ud' },
      { emoji: '🧅', nombre: 'Cebolla', qty: '1/2' },
      { emoji: '🫒', nombre: 'Aceite', qty: '4 cdas' },
    ],
    pasos: [
      'Pela y corta las patatas en láminas finas, como 3mm.',
      'Sartén con aceite medio. 15 min las patatas hasta blandas.',
      'Mientras esperas: frega el cuchillo y la tabla. 2 minutos.',
      'Bate 4 huevos con sal, añade las patatas. Cuaja 3 min por lado.',
    ],
  },
];

const cenas = [
  {
    id: 2, nombre: 'Pasta con carne picada', emoji: '🍝', nivel: 'normal',
    tiempo: '15 min', kcal: 380, prot: '28g', carbos: '45g', grasa: '8g', utensilio: 'Olla + Sartén',
    ingredientes: [
      { emoji: '🍝', nombre: 'Pasta', qty: '80g' },
      { emoji: '🥩', nombre: 'Carne picada', qty: '150g' },
      { emoji: '🍅', nombre: 'Tomate Solís', qty: '200ml' },
      { emoji: '🧄', nombre: 'Ajo', qty: '1 diente' },
    ],
    pasos: [
      'Hierve agua con sal. Pasta 10 min.',
      'Sartén fuerte: carne picada 5 min removiendo.',
      'Añade el tomate. La verdura va dentro, no se nota.',
      'Mezcla con la pasta escurrida. Frega la olla ahora.',
    ],
  },
];

const todasLasRecetas = [...desayunos, ...comidas, ...cenas];

const nivelConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  facil:  { label: '⚡ Fácil',     color: '#35b96e', bg: '#061209', border: '#1a5432' },
  normal: { label: '⚔️ Normal',    color: '#e63946', bg: '#130508', border: '#5a1522' },
  atrevo: { label: '🔥 Me atrevo', color: '#8880f0', bg: '#0a0820', border: '#3c2e89' },
};

const horario = [
  { hora: '8:00',  label: 'Despertar', emoji: '☀️' },
  { hora: '8:30',  label: 'Desayuno',  emoji: '🥣' },
  { hora: '14:00', label: 'Comida',    emoji: '🍳' },
  { hora: '17:00', label: 'Gym',       emoji: '💪' },
  { hora: '20:30', label: 'Cena',      emoji: '🍝' },
  { hora: '23:30', label: 'Dormir',    emoji: '🌙' },
];

const actividades = [
  { emoji: '📺', label: 'Ver One Piece' },
  { emoji: '🎮', label: 'Brawl Stars' },
  { emoji: '🚶', label: 'Salir a caminar' },
  { emoji: '📞', label: 'Llamar a un amigo' },
];

// ── COLORS & FONTS ────────────────────────────────────────────────────

const C = {
  bg:   '#06060a',
  c1:   '#0d0d13',
  c2:   '#111118',
  c3:   '#16161e',
  bdr:  '#1e1e2a',
  txt:  '#ededf2',
  mut:  '#6a6a7a',
  dim:  '#36364a',
  acc:  '#e63946',
  accl: '#ff4d5a',
  accd: '#9a1520',
  grn:  '#1a6a40',
  grnl: '#35b96e',
  xp:   '#5c4fe8',
  xpl:  '#8880f0',
};

const SYNE  = "'Syne',sans-serif";
const INTER = "'Inter',sans-serif";

// ── HELPERS ───────────────────────────────────────────────────────────

function fechaHoy(): string {
  const dias  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const d = new Date();
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────

function Ring({ pct, color, label, sub, status, statusColor }: {
  pct: number; color: string; label: string; sub: string; status: string; statusColor: string;
}) {
  const r = 24, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke={C.c3} strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        <text x="32" y="37" textAnchor="middle" fontSize="11" fontFamily={SYNE} fill={color} fontWeight="700">{label}</text>
      </svg>
      <span style={{ fontSize: 9, color: C.mut, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, fontFamily: INTER }}>{sub}</span>
      <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', color: statusColor, fontFamily: INTER }}>{status}</span>
    </div>
  );
}

function ShopItem({ emoji, nombre, qty, precio }: { emoji: string; nombre: string; qty: string; precio: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <div onClick={() => setChecked(v => !v)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: `1px solid ${C.bdr}`, cursor: 'pointer' }}>
      <div style={{ width: 24, height: 24, borderRadius: 7, border: `1.5px solid ${checked ? C.acc : C.bdr}`, background: checked ? C.acc : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', flexShrink: 0, transition: 'all 0.2s' }}>
        {checked && '✓'}
      </div>
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: checked ? C.dim : C.txt, textDecoration: checked ? 'line-through' : 'none', fontFamily: INTER }}>{nombre}</span>
      <span style={{ fontSize: 12, color: C.mut, marginRight: 8, fontFamily: INTER }}>{qty}</span>
      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: SYNE, color: C.acc }}>{precio}</span>
    </div>
  );
}

function CleanTask({ emoji, label, last }: { emoji: string; label: string; last: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <div onClick={() => setDone(v => !v)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: last ? 'none' : `1px solid ${C.bdr}`, cursor: 'pointer' }}>
      <div style={{ width: 24, height: 24, borderRadius: 7, border: `1.5px solid ${done ? C.grnl : C.bdr}`, background: done ? C.grnl : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#06060a', flexShrink: 0, transition: 'all 0.2s' }}>
        {done && '✓'}
      </div>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: done ? C.dim : C.txt, textDecoration: done ? 'line-through' : 'none', fontFamily: INTER, lineHeight: 1.4 }}>{label}</span>
    </div>
  );
}

function Banner({ img, titulo, texto }: { img: string; titulo: string; texto: string }) {
  return (
    <div style={{ position: 'relative', background: C.c1, border: `1px solid ${C.bdr}`, borderRadius: 20, marginBottom: 16, overflow: 'hidden', height: 100, display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'absolute', right: 0, bottom: 0, width: 92, height: 100 }}>
        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom right' }} />
      </div>
      <div style={{ padding: '0 18px', zIndex: 1, maxWidth: '65%' }}>
        <div style={{ fontFamily: SYNE, fontSize: 14, fontWeight: 800, color: C.acc, letterSpacing: -0.2 }}>{titulo}</div>
        <div style={{ fontSize: 12, color: C.mut, marginTop: 5, lineHeight: 1.6, fontFamily: INTER }} dangerouslySetInnerHTML={{ __html: texto }} />
      </div>
    </div>
  );
}

type Receta = typeof desayunos[0];

function MealSection({ label, icon, recetas, hechas, expandida, setExpandida, completar }: {
  label: string; icon: string; recetas: Receta[];
  hechas: number[]; expandida: number | null;
  setExpandida: (id: number | null) => void;
  completar: (id: number) => void;
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingLeft: 2 }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontFamily: SYNE, fontSize: 11, fontWeight: 800, color: C.mut, textTransform: 'uppercase', letterSpacing: 2.5 }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: C.bdr }} />
      </div>
      {recetas.map(r => {
        const hecha = hechas.includes(r.id);
        const open  = expandida === r.id;
        const nv    = nivelConfig[r.nivel];
        return (
          <div key={r.id} style={{ background: C.c1, border: `1px solid ${C.bdr}`, borderRadius: 20, marginBottom: 10, overflow: 'hidden' }}>
            <div onClick={() => setExpandida(open ? null : r.id)}
              style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
              <span style={{ fontSize: 38 }}>{r.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SYNE, fontSize: 15, fontWeight: 800, color: C.txt, letterSpacing: -0.3 }}>{r.nombre}</div>
                <div style={{ fontSize: 11, color: C.mut, marginTop: 4, fontFamily: INTER }}>{r.utensilio} · {r.tiempo} · {r.kcal} kcal</div>
                <span style={{ display: 'inline-block', fontSize: 10, padding: '3px 10px', borderRadius: 6, marginTop: 7, fontWeight: 700, background: nv.bg, color: nv.color, border: `1px solid ${nv.border}`, fontFamily: INTER }}>{nv.label}</span>
              </div>
              <div style={{ width: 30, height: 30, borderRadius: 9, border: `1.5px solid ${hecha ? C.grnl : C.bdr}`, background: hecha ? C.grnl : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#06060a', transition: 'all 0.3s', flexShrink: 0 }}>
                {hecha && '✓'}
              </div>
            </div>
            {open && (
              <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${C.bdr}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginTop: 16, marginBottom: 16 }}>
                  {r.ingredientes.map((ing, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.c2, borderRadius: 12, padding: '9px 11px', border: `1px solid ${C.bdr}` }}>
                      <span style={{ fontSize: 18 }}>{ing.emoji}</span>
                      <span style={{ fontFamily: SYNE, fontSize: 11, color: C.acc, fontWeight: 700 }}>{ing.qty}</span>
                      <span style={{ fontSize: 11, color: C.mut, fontFamily: INTER }}>{ing.nombre}</span>
                    </div>
                  ))}
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  {r.pasos.map((paso, i) => (
                    <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 24, height: 24, borderRadius: 7, background: C.acc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SYNE, fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                      <span style={{ fontSize: 13, color: C.mut, lineHeight: 1.7, fontFamily: INTER }}>{paso}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 16 }}>
                  {[['kcal', r.kcal], ['prot', r.prot], ['carbos', r.carbos], ['grasa', r.grasa]].map(([k, v]) => (
                    <div key={k as string} style={{ background: C.c2, borderRadius: 11, padding: '10px 4px', textAlign: 'center', border: `1px solid ${C.bdr}` }}>
                      <div style={{ fontFamily: SYNE, fontSize: 13, color: C.txt, fontWeight: 800 }}>{v}</div>
                      <div style={{ fontSize: 9, color: C.dim, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginTop: 3, fontFamily: INTER }}>{k}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => completar(r.id)}
                  style={{ width: '100%', padding: 15, borderRadius: 13, border: 'none', background: hecha ? C.grn : C.acc, color: '#fff', fontFamily: SYNE, fontWeight: 800, fontSize: 12, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 2 }}>
                  {hecha ? '✓ MISIÓN COMPLETADA +40XP' : 'MARCAR COMPLETADO +40XP'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────

export default function Home() {
  const [tab,              setTab]              = useState('hoy');
  const [hechas,           setHechas]           = useState<number[]>([]);
  const [expandida,        setExpandida]        = useState<number | null>(null);
  const [xp,               setXp]               = useState(680);
  const [confetti,         setConfetti]         = useState(false);
  const [levelUp,          setLevelUp]          = useState(false);
  const [monsters,         setMonsters]         = useState(0);
  const [colas,            setColas]            = useState(0);
  const [gymHecho,         setGymHecho]         = useState(false);
  const [rachaMonsterDias, setRachaMonsterDias] = useState(0);
  const [dbLoading,        setDbLoading]        = useState(true);
  const loadedRef = useRef(false);

  const TODAY = new Date().toISOString().split('T')[0];

  const rachaRefrescoDias = 12;
  const refrescoTomado    = monsters > 0 || colas > 0;
  const monsterTomado     = monsters > 0;

  const completar = (id: number) => {
    if (hechas.includes(id)) return;
    setHechas(prev => [...prev, id]);
    const nuevo = Math.min(1000, xp + 40);
    setXp(nuevo);
    setConfetti(true);
    setTimeout(() => setConfetti(false), 1500);
    if (nuevo >= 1000) setTimeout(() => setLevelUp(true), 700);
  };

  const completadas  = hechas.filter(id => todasLasRecetas.some(r => r.id === id)).length;
  const pctCocina    = Math.round(completadas / todasLasRecetas.length * 100);

  const BMR        = 2000;
  const kcalComida = todasLasRecetas.filter(r => hechas.includes(r.id)).reduce((s, r) => s + r.kcal, 0);
  const kcalBeb    = monsters * 160 + colas * 139;
  const kcalTot    = kcalComida + kcalBeb;
  const balance    = kcalTot - BMR;
  const pctKcal    = Math.min(150, Math.round(kcalTot / BMR * 100));
  const pasosEquil = Math.max(0, Math.round(balance * 22));
  const gymEquil   = Math.max(0, Math.round(balance / 8));

  // ── LOAD from Supabase on mount ──────────────────────────────────
  useEffect(() => {
    async function load() {
      const [{ data: perfil }, { data: misiones }, { data: bebidas }] = await Promise.all([
        supabase.from('perfil').select('xp,racha_sin_monster').eq('nombre','cabre').single(),
        supabase.from('misiones_dia').select('*').eq('fecha', TODAY).single(),
        supabase.from('bebidas_dia').select('monsters,cocacolas').eq('fecha', TODAY).single(),
      ]);

      if (perfil) {
        setXp(perfil.xp);
        setRachaMonsterDias(perfil.racha_sin_monster);
      }
      if (misiones) {
        const ids: number[] = [];
        if (misiones.desayuno_hecho) ids.push(3, 4);
        if (misiones.comida_hecha)   ids.push(1);
        if (misiones.cena_hecha)     ids.push(2);
        setHechas(ids);
        setGymHecho(misiones.gym_hecho ?? false);
      }
      if (bebidas) {
        setMonsters(bebidas.monsters ?? 0);
        setColas(bebidas.cocacolas ?? 0);
      }

      loadedRef.current = true;
      setDbLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── SAVE XP + racha to perfil ────────────────────────────────────
  useEffect(() => {
    if (!loadedRef.current) return;
    supabase.from('perfil').update({
      xp,
      racha_sin_monster: monsterTomado ? 0 : rachaMonsterDias,
      fecha_ultima_actualizacion: TODAY,
    }).eq('nombre','cabre').then(() => {});
  }, [xp, monsterTomado]);

  // ── SAVE misiones_dia ────────────────────────────────────────────
  useEffect(() => {
    if (!loadedRef.current) return;
    supabase.from('misiones_dia').upsert({
      fecha:           TODAY,
      desayuno_hecho:  hechas.some(id => [3,4].includes(id)),
      comida_hecha:    hechas.includes(1),
      cena_hecha:      hechas.includes(2),
      gym_hecho:       gymHecho,
      limpieza_hecha:  false,
    }, { onConflict: 'fecha' }).then(() => {});
  }, [hechas, gymHecho]);

  // ── SAVE bebidas_dia ─────────────────────────────────────────────
  useEffect(() => {
    if (!loadedRef.current) return;
    supabase.from('bebidas_dia').upsert({
      fecha:     TODAY,
      monsters,
      cocacolas: colas,
      copas:     0,
    }, { onConflict: 'fecha' }).then(() => {});
  }, [monsters, colas]);

  const navTabs = [
    { id: 'hoy',    label: 'Hoy',    icon: '🍳' },
    { id: 'kcal',   label: 'Kcal',   icon: '⚡' },
    { id: 'compra', label: 'Compra', icon: '🛒' },
    { id: 'gastos', label: 'Gastos', icon: '💰' },
  ];

  const sec = { background: C.c1, border: `1px solid ${C.bdr}`, borderRadius: 20, marginBottom: 12, padding: '18px' };

  if (dbLoading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: SYNE, fontSize: 28, fontWeight: 800, color: C.acc, letterSpacing: -1 }}>Cabre</div>
        <div style={{ fontSize: 12, color: C.mut, marginTop: 8, fontFamily: INTER }}>cargando datos…</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 420, background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: INTER, color: C.txt, position: 'relative' }}>

        {/* LEVEL UP */}
        {levelUp && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(6,6,10,0.98)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ width: 1, height: 80, background: `linear-gradient(to bottom, transparent, ${C.acc})`, marginBottom: 4 }} />
            <img src="/luffy.png" alt="Luffy" style={{ width: 130, height: 130, objectFit: 'contain' }} />
            <div style={{ fontFamily: SYNE, fontSize: 38, fontWeight: 800, color: C.acc, letterSpacing: -1.5 }}>NIVEL 3</div>
            <div style={{ fontFamily: SYNE, fontSize: 14, color: C.txt, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.7 }}>El Héroe en Prácticas</div>
            <div style={{ fontSize: 12, color: C.xpl, fontWeight: 700, fontFamily: INTER }}>+200 XP desbloqueados</div>
            <div style={{ fontSize: 12, color: C.mut, textAlign: 'center', maxWidth: 240, lineHeight: 1.8, fontFamily: INTER }}>"Deku también empezó desde cero, tío."</div>
            <button onClick={() => { setLevelUp(false); setXp(200); }}
              style={{ marginTop: 12, padding: '14px 48px', background: C.acc, color: '#fff', border: 'none', borderRadius: 14, fontFamily: SYNE, fontWeight: 800, fontSize: 13, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 3 }}>
              ACEPTAR
            </button>
          </div>
        )}

        {/* CONFETTI */}
        {confetti && (
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden' }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${5 + Math.random() * 90}%`,
                top: `${5 + Math.random() * 40}%`,
                width: i % 3 === 0 ? 10 : 7,
                height: i % 3 === 0 ? 10 : 7,
                borderRadius: i % 4 === 0 ? '50%' : 2,
                background: [C.acc, C.accl, C.grnl, C.xpl, C.txt, C.accd][i % 6],
                animation: `cffall ${0.8 + Math.random() * 0.8}s ease-out forwards`,
                animationDelay: `${Math.random() * 0.4}s`,
              }} />
            ))}
          </div>
        )}

        <style>{`
          @keyframes cffall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(300px) rotate(720deg);opacity:0}}
          *::-webkit-scrollbar{display:none}
        `}</style>

        {/* ── TOPBAR ── */}
        <div style={{ background: C.c1, borderBottom: `1px solid ${C.bdr}`, padding: '22px 18px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 58, height: 58, borderRadius: 18, background: C.c3, border: `2px solid ${C.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🧔</div>
                <div style={{ position: 'absolute', bottom: -5, right: -5, background: C.acc, borderRadius: 8, padding: '2px 7px', fontFamily: SYNE, fontSize: 9, fontWeight: 800, color: '#fff', border: `2px solid ${C.bg}` }}>Nv.2</div>
              </div>
              <div>
                <div style={{ fontFamily: SYNE, fontSize: 28, fontWeight: 800, color: C.txt, lineHeight: 1, letterSpacing: -1 }}>Cabre</div>
                <div style={{ fontSize: 12, color: C.mut, fontWeight: 500, marginTop: 5, fontFamily: INTER }}>El Aprendiz de Luffy</div>
                <div style={{ fontSize: 10, color: C.dim, fontWeight: 500, marginTop: 2, fontFamily: INTER }}>{fechaHoy()}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: C.c3, border: `1px solid ${monsterTomado ? C.accd : C.grn}`, borderRadius: 16, padding: '12px 18px', gap: 3 }}>
              <span style={{ fontSize: 22 }}>🥤</span>
              <div style={{ fontFamily: SYNE, fontSize: 30, fontWeight: 800, color: monsterTomado ? C.acc : C.grnl, lineHeight: 1 }}>{monsterTomado ? '0' : rachaMonsterDias}</div>
              <div style={{ fontSize: 9, color: C.mut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: INTER }}>sin Monster</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.xpl, textTransform: 'uppercase', letterSpacing: 2, fontFamily: INTER }}>XP</span>
            <div style={{ flex: 1, background: C.c3, borderRadius: 20, height: 7, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: `linear-gradient(to right, ${C.xp}, ${C.xpl})`, borderRadius: 20, width: `${Math.round(xp / 10)}%`, transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.xpl, fontFamily: INTER }}>{xp} / 1000</span>
          </div>
        </div>

        {/* ── RINGS ── */}
        <div style={{ background: C.c1, borderBottom: `1px solid ${C.bdr}`, padding: '16px 18px 18px', flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: C.mut, textTransform: 'uppercase', letterSpacing: 3, fontWeight: 700, marginBottom: 14, fontFamily: INTER }}>Misiones de hoy</div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <Ring
              pct={pctCocina}
              color={C.acc}
              label={`${completadas}/${todasLasRecetas.length}`}
              sub="Cocina"
              status={completadas === todasLasRecetas.length ? 'HECHO' : 'EN CURSO'}
              statusColor={completadas === todasLasRecetas.length ? C.grnl : C.acc}
            />
            <Ring pct={gymHecho ? 100 : 0} color={C.xp} label={gymHecho ? '1/1' : '0/1'} sub="Gym" status={gymHecho ? 'HECHO' : 'PENDIENTE'} statusColor={gymHecho ? C.grnl : C.mut} />
            <Ring pct={100} color={C.grnl} label="1/1" sub="Casa" status="HECHO" statusColor={C.grnl} />
          </div>
        </div>

        {/* ── SCROLL ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 110px' }}>

          {/* HOY */}
          {tab === 'hoy' && (
            <>
              <Banner img="/luffy.png" titulo="¡Misión de hoy, Cabre!" texto="7 días seguidos.<br/>Luffy no faltó ni uno. Tú tampoco." />

              <MealSection label="Desayuno" icon="🌅" recetas={desayunos} hechas={hechas} expandida={expandida} setExpandida={setExpandida} completar={completar} />
              <MealSection label="Comida"   icon="☀️" recetas={comidas}   hechas={hechas} expandida={expandida} setExpandida={setExpandida} completar={completar} />
              <MealSection label="Cena"     icon="🌙" recetas={cenas}     hechas={hechas} expandida={expandida} setExpandida={setExpandida} completar={completar} />

              <Banner img="/zoro.png" titulo="Limpieza de hoy" texto="Zoro no se rinde.<br/>Tú tampoco." />

              {/* CHECKLIST LIMPIEZA */}
              <div style={{ background: C.c1, border: `1px solid ${C.bdr}`, borderRadius: 20, marginBottom: 12, padding: '18px' }}>
                <div style={{ fontSize: 9, color: C.mut, textTransform: 'uppercase', letterSpacing: 3, fontWeight: 700, marginBottom: 12, fontFamily: INTER }}>Tareas de hoy</div>
                {[
                  { emoji: '🍽️', label: 'Fregar platos después de cada comida' },
                  { emoji: '🧹', label: 'Pasar aspiradora 15 min' },
                  { emoji: '🗑️', label: 'Sacar basura' },
                  { emoji: '📦', label: 'Recoger y ordenar' },
                ].map((t, i, arr) => (
                  <CleanTask key={i} emoji={t.emoji} label={t.label} last={i === arr.length - 1} />
                ))}
              </div>

              {/* GYM BUTTON */}
              <button onClick={() => {
                if (!gymHecho) {
                  setGymHecho(true);
                  const nuevo = Math.min(1000, xp + 60);
                  setXp(nuevo);
                  setConfetti(true);
                  setTimeout(() => setConfetti(false), 1500);
                  if (nuevo >= 1000) setTimeout(() => setLevelUp(true), 700);
                }
              }} style={{ width: '100%', padding: '20px', borderRadius: 18, border: `2px solid ${gymHecho ? C.grn : C.acc}`, background: gymHecho ? C.grn : C.acc, color: '#fff', fontFamily: SYNE, fontWeight: 800, fontSize: 16, cursor: gymHecho ? 'default' : 'pointer', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s' }}>
                <span style={{ fontSize: 22 }}>{gymHecho ? '✓' : '💪'}</span>
                {gymHecho ? 'GYM COMPLETADO +60XP' : 'HE IDO AL GYM HOY'}
              </button>

              {/* HORARIO */}
              <div style={{ ...sec, padding: '20px 18px' }}>
                <div style={{ fontSize: 9, color: C.mut, textTransform: 'uppercase', letterSpacing: 3, fontWeight: 700, marginBottom: 18, fontFamily: INTER }}>Horario del día</div>
                {horario.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'stretch', gap: 14, minHeight: 36 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16, flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? C.acc : C.bdr, border: `2px solid ${i === 0 ? C.acc : C.dim}`, flexShrink: 0, marginTop: 4 }} />
                      {i < horario.length - 1 && <div style={{ flex: 1, width: 1, background: C.bdr, marginTop: 2 }} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, paddingBottom: i < horario.length - 1 ? 12 : 0 }}>
                      <span style={{ fontSize: 18, width: 26 }}>{h.emoji}</span>
                      <span style={{ fontFamily: INTER, fontSize: 13, fontWeight: 600, color: C.txt, flex: 1 }}>{h.label}</span>
                      <span style={{ fontFamily: SYNE, fontSize: 13, fontWeight: 800, color: C.mut }}>{h.hora}</span>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 18, padding: '12px 14px', background: C.c2, borderRadius: 12, border: `1px solid ${C.bdr}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16 }}>💤</span>
                  <span style={{ fontSize: 11, color: C.mut, lineHeight: 1.7, fontFamily: INTER }}>8 horas de sueño = mejor humor, más energía, menos ansiedad. Prioridad máxima.</span>
                </div>
              </div>

              {/* ACTIVIDADES */}
              <div style={{ ...sec, padding: '20px 18px' }}>
                <div style={{ fontSize: 9, color: C.mut, textTransform: 'uppercase', letterSpacing: 3, fontWeight: 700, marginBottom: 14, fontFamily: INTER }}>Para el rato libre</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {actividades.map((a, i) => (
                    <div key={i} style={{ background: C.c2, border: `1px solid ${C.bdr}`, borderRadius: 14, padding: '15px 13px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{a.emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.txt, fontFamily: INTER, lineHeight: 1.4 }}>{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* KCAL */}
          {tab === 'kcal' && (
            <>
              <Banner img="/spike.png" titulo="Panel del día" texto="Spike no toma Monster.<br/>¿Y tú hoy?" />

              {/* Panel calórico */}
              <div style={sec}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.acc, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16, fontFamily: INTER }}>Balance calórico de hoy</div>

                {/* Desglose */}
                {[
                  { icon: '🍽️', label: 'Comida marcada', value: kcalComida, color: C.txt },
                  { icon: '🥤', label: 'Bebidas',          value: kcalBeb,   color: kcalBeb > 0 ? C.acc : C.mut },
                ].map(({ icon, label, value, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${C.bdr}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15 }}>{icon}</span>
                      <span style={{ fontSize: 12, color: C.mut, fontFamily: INTER }}>{label}</span>
                    </div>
                    <span style={{ fontFamily: SYNE, fontSize: 15, fontWeight: 800, color }}>{value} kcal</span>
                  </div>
                ))}

                {/* Total consumido */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.bdr}` }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.txt, fontFamily: INTER }}>Total consumido</span>
                  <span style={{ fontFamily: SYNE, fontSize: 22, fontWeight: 800, color: C.txt, letterSpacing: -0.5 }}>{kcalTot} kcal</span>
                </div>

                {/* BMR */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${C.bdr}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15 }}>💤</span>
                    <span style={{ fontSize: 12, color: C.mut, fontFamily: INTER }}>Cuerpo en reposo (BMR)</span>
                  </div>
                  <span style={{ fontFamily: SYNE, fontSize: 15, fontWeight: 800, color: C.grnl }}>−{BMR} kcal</span>
                </div>

                {/* Balance */}
                <div style={{ marginTop: 14, padding: '14px 16px', background: balance <= 0 ? '#050f0a' : '#0f0508', border: `1px solid ${balance <= 0 ? C.grn : C.accd}`, borderRadius: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontFamily: SYNE, fontSize: 32, fontWeight: 800, color: balance <= 0 ? C.grnl : C.acc, letterSpacing: -1, lineHeight: 1 }}>
                      {balance <= 0 ? `−${Math.abs(balance)}` : `+${balance}`}
                    </span>
                    <span style={{ fontSize: 13, color: C.mut, fontFamily: INTER }}>kcal balance</span>
                  </div>
                  {balance <= 0 ? (
                    <div style={{ fontSize: 12, color: C.grnl, fontFamily: INTER, lineHeight: 1.6 }}>
                      Déficit de {Math.abs(balance)} kcal. Vas por buen camino, Cabre. 🛡️
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: C.accl, fontFamily: INTER, lineHeight: 1.8 }}>
                      Para cerrar el día en cero necesitas:<br/>
                      <span style={{ fontWeight: 700, color: C.txt }}>{pasosEquil.toLocaleString()} pasos</span>
                      {' '}o{' '}
                      <span style={{ fontWeight: 700, color: C.txt }}>{gymEquil} min de gym.</span>
                    </div>
                  )}
                </div>

                {/* Barra progreso */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ background: C.c3, borderRadius: 20, height: 8, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', borderRadius: 20, width: `${Math.min(100, pctKcal)}%`, background: pctKcal > 100 ? C.acc : pctKcal > 80 ? '#e6a234' : C.grnl, transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ fontSize: 11, color: C.mut, textAlign: 'right', fontFamily: INTER }}>{kcalTot} / {BMR} kcal · {Math.min(pctKcal, 100)}%</div>
                </div>
              </div>

              {/* Racha refrescos */}
              <div style={{ ...sec, display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ width: 68, height: 68, borderRadius: 18, background: refrescoTomado ? '#150508' : '#050f0a', border: `2px solid ${refrescoTomado ? C.accd : C.grn}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 2 }}>
                  <span style={{ fontSize: 22 }}>{refrescoTomado ? '⚠️' : '🛡️'}</span>
                  <span style={{ fontFamily: SYNE, fontSize: 18, fontWeight: 800, color: refrescoTomado ? C.acc : C.grnl, lineHeight: 1 }}>
                    {refrescoTomado ? '0' : rachaRefrescoDias}
                  </span>
                </div>
                <div>
                  <div style={{ fontFamily: SYNE, fontSize: 15, fontWeight: 800, color: refrescoTomado ? C.acc : C.grnl, letterSpacing: -0.3 }}>
                    {refrescoTomado ? 'Racha rota hoy' : `${rachaRefrescoDias} días sin refresco`}
                  </div>
                  <div style={{ fontSize: 12, color: C.mut, marginTop: 5, fontFamily: INTER, lineHeight: 1.5 }}>
                    {refrescoTomado
                      ? 'Mañana puedes empezar de nuevo. Sin dramas.'
                      : 'Sin Monster ni Coca-Cola. Eres imparable.'}
                  </div>
                </div>
              </div>

              {/* Refrescos */}
              <div style={sec}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.acc, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16, fontFamily: INTER }}>Refrescos del día</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'Monster',   kcal: 160, pasos: 2100, gym: 20, count: monsters, fn: () => setMonsters(m => m + 1) },
                    { label: 'Coca-Cola', kcal: 139, pasos: 1800, gym: 17, count: colas,    fn: () => setColas(c => c + 1)    },
                  ].map(({ label, kcal, pasos, gym, count, fn }) => (
                    <button key={label} onClick={fn}
                      style={{ background: C.c2, border: `1px solid ${count > 0 ? C.accd : C.bdr}`, borderRadius: 16, padding: '16px 10px', textAlign: 'center', cursor: 'pointer' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.txt, fontFamily: SYNE }}>{label}</div>
                      <div style={{ fontSize: 11, color: C.mut, marginTop: 5, fontFamily: INTER }}>{kcal} kcal / lata</div>
                      <div style={{ fontSize: 10, color: C.acc, marginTop: 4, fontFamily: INTER, lineHeight: 1.6 }}>Para quemarlo:<br/>{pasos.toLocaleString()} pasos o {gym} min gym</div>
                      <div style={{ fontFamily: SYNE, fontSize: 34, fontWeight: 800, color: count > 0 ? C.acc : C.txt, marginTop: 10, lineHeight: 1 }}>{count}</div>
                    </button>
                  ))}
                </div>
                <button onClick={() => { setMonsters(0); setColas(0); }}
                  style={{ width: '100%', padding: 11, borderRadius: 11, border: `1px solid ${C.bdr}`, background: 'transparent', color: C.mut, fontFamily: INTER, fontWeight: 600, fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 2 }}>
                  Resetear refrescos
                </button>
              </div>

              {/* Total bebidas acumulado */}
              {kcalBeb > 0 && (
                <div style={{ background: '#0f0508', border: `1px solid ${C.accd}`, borderRadius: 18, padding: '16px 18px', marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.acc, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, fontFamily: INTER }}>Total bebidas hoy</div>
                  <div style={{ fontFamily: SYNE, fontSize: 30, fontWeight: 800, color: C.acc, letterSpacing: -1 }}>{kcalBeb} kcal</div>
                  <div style={{ fontSize: 12, color: C.mut, marginTop: 8, fontFamily: INTER, lineHeight: 1.7 }}>
                    Para quemarlo todo: {Math.round(kcalBeb * 13.5).toLocaleString()} pasos<br/>o {Math.round(kcalBeb / 8)} min de gym.
                  </div>
                </div>
              )}
            </>
          )}

          {/* COMPRA */}
          {tab === 'compra' && (
            <>
              <Banner img="/espada.png" titulo="Lista de la semana" texto="38,20€ de 45€<br/>Te quedan 6,80€. Vas bien." />
              <div style={sec}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.acc, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 14, fontFamily: INTER }}>Proteínas</div>
                {[
                  { emoji: '🥩', nombre: 'Carne picada',  qty: '500g',   precio: '3,80€' },
                  { emoji: '🥚', nombre: 'Huevos',         qty: 'docena', precio: '2,10€' },
                  { emoji: '🍗', nombre: 'Pechuga pollo',  qty: '400g',   precio: '3,20€' },
                  { emoji: '🥓', nombre: 'Chorizo fresco', qty: '200g',   precio: '1,90€' },
                ].map((item, i) => <ShopItem key={i} {...item} />)}
              </div>
              <div style={sec}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.acc, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 14, fontFamily: INTER }}>Base y despensa</div>
                {[
                  { emoji: '🍝', nombre: 'Pasta',              qty: '500g',  precio: '0,85€' },
                  { emoji: '🍚', nombre: 'Arroz',               qty: '1kg',   precio: '1,60€' },
                  { emoji: '🍅', nombre: 'Tomate frito Solís',  qty: '400ml', precio: '1,20€' },
                  { emoji: '🫘', nombre: 'Garbanzos bote',      qty: '400g',  precio: '0,90€' },
                  { emoji: '🫒', nombre: 'Aceite oliva',        qty: '1L',    precio: '4,20€' },
                ].map((item, i) => <ShopItem key={i} {...item} />)}
              </div>
            </>
          )}

          {/* GASTOS */}
          {tab === 'gastos' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                {[
                  { v: '87€',  label: 'Gastado',    color: C.grnl },
                  { v: '63€',  label: 'Queda',       color: C.txt  },
                  { v: '150€', label: 'Presupuesto', color: C.txt  },
                  { v: '-18%', label: 'vs mes ant.', color: C.acc  },
                ].map(({ v, label, color }) => (
                  <div key={label} style={{ background: C.c1, border: `1px solid ${C.bdr}`, borderRadius: 18, padding: '20px 14px', textAlign: 'center' }}>
                    <div style={{ fontFamily: SYNE, fontSize: 30, fontWeight: 800, color, lineHeight: 1, letterSpacing: -1 }}>{v}</div>
                    <div style={{ fontSize: 10, color: C.mut, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 8, fontWeight: 600, fontFamily: INTER }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={sec}>
                <div style={{ background: C.c3, borderRadius: 20, height: 8, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: '58%', background: C.grnl, borderRadius: 20 }} />
                </div>
                <div style={{ fontSize: 11, color: C.mut, textAlign: 'right', fontFamily: INTER }}>58% · 15 días restantes</div>
              </div>
              {[
                { icon: '🛒', nombre: 'Mercadona',        fecha: 'Hoy · 11:30', amt: '38,20€' },
                { icon: '🛒', nombre: 'Supermercado Día', fecha: 'Lun 8 abr',   amt: '18,30€' },
                { icon: '🥩', nombre: 'Carnicería',       fecha: 'Jue 4 abr',   amt: '12,00€' },
                { icon: '🌿', nombre: 'Frutería',         fecha: 'Mar 2 abr',   amt: '8,40€'  },
              ].map((g, i) => (
                <div key={i} style={{ background: C.c1, border: `1px solid ${C.bdr}`, borderRadius: 18, display: 'flex', alignItems: 'center', gap: 14, padding: '16px 16px', marginBottom: 10, overflow: 'hidden' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: C.c2, border: `1px solid ${C.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{g.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.txt, fontFamily: INTER }}>{g.nombre}</div>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 3, fontFamily: INTER }}>{g.fecha}</div>
                  </div>
                  <span style={{ fontFamily: SYNE, fontSize: 16, fontWeight: 800, color: C.txt }}>{g.amt}</span>
                </div>
              ))}
            </>
          )}

        </div>

        {/* BOTTOM NAV */}
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: 'rgba(13,13,19,0.96)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: `1px solid ${C.bdr}`, display: 'flex', padding: '10px 0 20px', zIndex: 30 }}>
          {navTabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 2px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <span style={{ fontSize: 22, opacity: tab === t.id ? 1 : 0.35, transition: 'opacity 0.2s' }}>{t.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: tab === t.id ? C.acc : C.mut, fontFamily: INTER, transition: 'color 0.2s' }}>{t.label}</span>
              <div style={{ width: 18, height: 2, borderRadius: 2, background: tab === t.id ? C.acc : 'transparent', marginTop: 2, transition: 'background 0.2s' }} />
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
