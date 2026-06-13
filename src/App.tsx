import { useEffect, useMemo, useRef, useState } from "react";

const LS_PARTICIPANTS = "ruleta_participants";
const LS_WINNERS = "ruleta_winners";

const DEFAULT_INPUT = `Ana Cardenas
Luis Paredes
Daniela Rojas
Piero Chavez
Mariana Torres
Camila Escobar
Jorge Medina
Valeria Quispe`;

const SEGMENT_COLORS = [
  "#4C1D95",
  "#0E7490",
  "#3730A3",
  "#5B21B6",
  "#164E63",
  "#6D28D9",
];

function parseParticipants(raw: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of raw.split("\n")) {
    const name = line.trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v != null ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ── SVG icons ──────────────────────────────────────────────────────────
function IconShuffle() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function IconTrophy() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

// ── Background particles ────────────────────────────────────────────────
function Particles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        size: Math.random() * 4 + 2,
        left: Math.random() * 100,
        delay: Math.random() * 16,
        duration: Math.random() * 10 + 14,
        color:
          i % 3 === 0
            ? "rgba(180,101,255,0.55)"
            : i % 3 === 1
            ? "rgba(5,191,224,0.55)"
            : "rgba(255,97,15,0.35)",
      })),
    []
  );

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            bottom: "-10px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            background: p.color,
          }}
        />
      ))}
    </>
  );
}

// ── Winner Modal ────────────────────────────────────────────────────────
function WinnerModal({ name, onClose }: { name: string; onClose: () => void }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Ganador">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-strip" />
        <div className="modal-body">
          <div className="modal-icon">
            <IconTrophy />
          </div>
          <p className="modal-eyebrow">¡Tenemos un ganador!</p>
          <h2 className="modal-winner-name">
            <span>{name}</span>
          </h2>
          <button className="btn primary modal-close" onClick={onClose}>
            Continuar sorteo
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────────────
export default function App() {
  const [participantsInput, setParticipantsInput] = useState<string>(() =>
    safeRead<string>(LS_PARTICIPANTS, DEFAULT_INPUT)
  );

  const [appliedList, setAppliedList] = useState<string[]>(() =>
    parseParticipants(safeRead<string>(LS_PARTICIPANTS, DEFAULT_INPUT))
  );

  const [winners, setWinners] = useState<string[]>(() =>
    safeRead<string[]>(LS_WINNERS, [])
  );

  const [availableParticipants, setAvailableParticipants] = useState<string[]>(() => {
    const parsed = parseParticipants(safeRead<string>(LS_PARTICIPANTS, DEFAULT_INPUT));
    const wonSet = new Set(safeRead<string[]>(LS_WINNERS, []));
    return parsed.filter((p) => !wonSet.has(p));
  });

  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [autoRemove, setAutoRemove] = useState(true);
  const spinTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem(LS_PARTICIPANTS, JSON.stringify(participantsInput));
  }, [participantsInput]);

  useEffect(() => {
    localStorage.setItem(LS_WINNERS, JSON.stringify(winners));
  }, [winners]);

  const wheelGradient = useMemo(() => {
    if (availableParticipants.length === 0)
      return "conic-gradient(rgba(30,12,62,0.8) 0deg 360deg)";
    const seg = 360 / availableParticipants.length;
    const stops = availableParticipants
      .map((_, i) => {
        const c = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
        return `${c} ${(i * seg).toFixed(2)}deg ${((i + 1) * seg).toFixed(2)}deg`;
      })
      .join(", ");
    return `conic-gradient(${stops})`;
  }, [availableParticipants]);

  const canSpin = availableParticipants.length > 0 && !isSpinning;

  function applyParticipants() {
    if (isSpinning) return;
    const parsed = parseParticipants(participantsInput);
    setParticipantsInput(parsed.join("\n"));
    setAppliedList(parsed);
    setAvailableParticipants(parsed);
    setWinners([]);
    setSelectedWinner(null);
    setRotation(0);
  }

  function resetDraw() {
    if (isSpinning) return;
    setAvailableParticipants(appliedList);
    setWinners([]);
    setSelectedWinner(null);
    setRotation(0);
  }

  function shuffleParticipants() {
    if (isSpinning) return;
    setAvailableParticipants((prev) => shuffleArray(prev));
    setRotation(0);
  }

  function clearParticipants() {
    if (isSpinning) return;
    setParticipantsInput("");
    setAppliedList([]);
    setAvailableParticipants([]);
    setWinners([]);
    setSelectedWinner(null);
    setRotation(0);
  }

  function clearWinners() {
    if (isSpinning) return;
    setWinners([]);
    setSelectedWinner(null);
    setAvailableParticipants(appliedList);
  }

  function exportWinners() {
    if (winners.length === 0) return;
    const header = "#,Nombre";
    const rows = winners.map((w, i) => `${i + 1},${w}`);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ganadores-pibpgpm-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function spinWheel() {
    if (!canSpin) return;
    const count = availableParticipants.length;
    const winnerIdx = Math.floor(Math.random() * count);
    const winnerName = availableParticipants[winnerIdx];
    const segAngle = 360 / count;
    const centerAngle = winnerIdx * segAngle + segAngle / 2;
    const extraTurns = 6 + Math.floor(Math.random() * 4);
    const target = extraTurns * 360 + (360 - centerAngle);

    setIsSpinning(true);
    setSelectedWinner(null);
    setRotation((p) => p + target);

    if (spinTimeoutRef.current !== null) window.clearTimeout(spinTimeoutRef.current);
    spinTimeoutRef.current = window.setTimeout(() => {
      setIsSpinning(false);
      setSelectedWinner(winnerName);
      setShowWinnerModal(true);
      setWinners((p) => [...p, winnerName]);
      setAvailableParticipants((p) => p.filter((n) => n !== winnerName));
      if (autoRemove) {
        setAppliedList((p) => p.filter((n) => n !== winnerName));
        setParticipantsInput((prev) =>
          prev.split("\n").filter((l) => l.trim() !== winnerName).join("\n")
        );
      }
      spinTimeoutRef.current = null;
    }, 5200);
  }

  return (
    <div className="page-shell">
      <Particles />

      {/* ── TOP NAV ── */}
      <nav className="topnav">
        <div className="topnav-inner">
          {/* PMI Sur Perú logo */}
          <div className="nav-logo-pmi">
            <img src="/pmi-logo.svg" alt="PMI Sur Perú" />
          </div>

          {/* Event brand */}
          <div className="nav-event-brand">
            <img src="/pibpgpm-icon.svg" alt="" className="nav-event-icon" />
            <div className="nav-event-text">
              <span className="nav-event-name">PIBPGPM</span>
              <span className="nav-event-year">2026</span>
            </div>
          </div>

          <span className="nav-badge">Sorteo</span>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="main-content">
        <section className="app-grid">

          {/* ── WHEEL COLUMN ── */}
          <article className="wheel-card">
            <div className="wheel-wrapper">
              <div className="pointer" aria-hidden="true" />
              <div className="wheel-canvas-wrap">
                <div
                  className={`wheel${isSpinning ? " spinning" : ""}`}
                  style={{ background: wheelGradient, transform: `rotate(${rotation}deg)` }}
                >
                  {availableParticipants.length > 0 ? (
                    availableParticipants.map((p, i) => {
                      const count = availableParticipants.length;
                      const segAngle = 360 / count;
                      const midAngle = i * segAngle + segAngle / 2;
                      return (
                        <span
                          key={p}
                          className="segment-label"
                          style={{ transform: `rotate(${midAngle}deg)` }}
                        >
                          <span className="segment-label-text">{p}</span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="empty-wheel">Sin participantes</span>
                  )}
                </div>
              </div>
            </div>

            <div className="controls-row">
              <button className="btn primary" onClick={spinWheel} disabled={!canSpin}>
                {isSpinning ? "Girando…" : "Girar ruleta"}
              </button>
              <button className="btn secondary" onClick={resetDraw} disabled={isSpinning}>
                Reiniciar sorteo
              </button>
            </div>

            <div className={`winner-box${selectedWinner ? " has-winner" : ""}`} role="status" aria-live="polite">
              <span>Último ganador:</span>
              <strong>{selectedWinner ?? "Esperando resultado…"}</strong>
            </div>
          </article>

          {/* ── PANEL COLUMN ── */}
          <article className="panel-card">

            {/* PARTICIPANTS */}
            <div className="panel-section">
              <div className="panel-header">
                <h2>Participantes</h2>
                <div className="panel-actions">
                  <button
                    className="icon-btn"
                    onClick={shuffleParticipants}
                    disabled={isSpinning || availableParticipants.length < 2}
                    title="Mezclar orden"
                  >
                    <IconShuffle /> Mezclar
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={clearParticipants}
                    disabled={isSpinning}
                    title="Limpiar lista"
                  >
                    <IconTrash /> Limpiar
                  </button>
                </div>
              </div>
              <p className="hint">Un nombre por línea. "Aplicar" carga los nombres a la ruleta.</p>
              <textarea
                value={participantsInput}
                onChange={(e) => setParticipantsInput(e.target.value)}
                rows={10}
                disabled={isSpinning}
                placeholder="Escribe los nombres aquí, uno por línea…"
              />
              <button className="btn primary full" onClick={applyParticipants} disabled={isSpinning}>
                Aplicar lista ({parseParticipants(participantsInput).length} nombres)
              </button>
              <label className="auto-remove-row">
                <input
                  type="checkbox"
                  checked={autoRemove}
                  onChange={(e) => setAutoRemove(e.target.checked)}
                />
                <span>Eliminar ganador de la lista automáticamente</span>
              </label>
            </div>

            {/* STATS */}
            <div className="stats">
              <div>
                <span>En rueda</span>
                <strong>{availableParticipants.length}</strong>
              </div>
              <div>
                <span>Ganadores</span>
                <strong>{winners.length}</strong>
              </div>
            </div>

            {/* WINNERS */}
            <div className="panel-section">
              <div className="panel-header">
                <h3>Historial de ganadores</h3>
                <div className="panel-actions">
                  <button
                    className="icon-btn"
                    onClick={exportWinners}
                    disabled={winners.length === 0}
                    title="Exportar CSV"
                  >
                    <IconDownload /> Exportar
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={clearWinners}
                    disabled={isSpinning || winners.length === 0}
                    title="Limpiar historial"
                  >
                    <IconTrash /> Limpiar
                  </button>
                </div>
              </div>
              <ol className="winners-list">
                {winners.length === 0 ? (
                  <li className="placeholder">Aún no hay ganadores</li>
                ) : (
                  winners.map((w, i) => (
                    <li key={`${w}-${i}`}>
                      <span className="winner-num">{i + 1}</span>
                      {w}
                    </li>
                  ))
                )}
              </ol>
            </div>

          </article>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <p className="footer-copy">PIBPGPM 2026 · Sorteo Oficial</p>
            <p className="footer-sub">PMI Sur Perú · Project Management Institute</p>
          </div>
          <img src="/pmi-logo.svg" alt="PMI Sur Perú" className="footer-logo" style={{ filter: "brightness(0) invert(1)" }} />
        </div>
      </footer>

      {/* ── WINNER MODAL ── */}
      {showWinnerModal && selectedWinner && (
        <WinnerModal name={selectedWinner} onClose={() => setShowWinnerModal(false)} />
      )}
    </div>
  );
}
