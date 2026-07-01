import { useState, useRef } from "react";

const ACTIVITY = {
  title: "Sons dos Animais",
  questions: [
    { slotId: 1,  text: "Qual é o som que a vaca faz?" },
    { slotId: 2,  text: "Qual é o som que o gato faz?" },
    { slotId: 3,  text: "Qual é o som que o cachorro faz?" },
    { slotId: 4,  text: "Qual é o som que o pato faz?" },
    { slotId: 5,  text: "Qual é o som que a galinha faz?" },
    { slotId: 6,  text: "Qual é o som que o leão faz?" },
    { slotId: 7,  text: "Qual é o som que o elefante faz?" },
    { slotId: 8,  text: "Qual é o som que a cobra faz?" },
    { slotId: 9,  text: "Qual é o som que o sapo faz?" },
    { slotId: 10, text: "Qual é o som que o cavalo faz?" },
  ],
  pieces: [
    { pecasId: 1,  label: "Muhh" },
    { pecasId: 2,  label: "Miau" },
    { pecasId: 3,  label: "Au au au" },
    { pecasId: 4,  label: "Quack quack" },
    { pecasId: 5,  label: "Cocoricó" },
    { pecasId: 6,  label: "Roar!" },
    { pecasId: 7,  label: "Baroó!" },
    { pecasId: 8,  label: "Ssss" },
    { pecasId: 9,  label: "Cricri cricri" },
    { pecasId: 10, label: "Hiin-Hin" },
  ],
  revealImageUrl:
    "/../public/img/gatinhos.png",
};

const GRID_COLS = 5;
const GRID_ROWS = 2;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Fragmento da imagem baseado no pieceId (qual pedaço pertence à peça)
function ImageFragment({ pieceId, imageUrl }) {
  const col = (pieceId - 1) % GRID_COLS;
  const row = Math.floor((pieceId - 1) / GRID_COLS);
  const xPct = GRID_COLS === 1 ? 0 : (col / (GRID_COLS - 1)) * 100;
  const yPct = GRID_ROWS === 1 ? 0 : (row / (GRID_ROWS - 1)) * 100;
  return (
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: `${GRID_COLS * 100}% ${GRID_ROWS * 100}%`,
      backgroundPosition: `${xPct}% ${yPct}%`,
      backgroundRepeat: "no-repeat",
      borderRadius: 10,
    }} />
  );
}

export default function KiviraGame() {
  const total = ACTIVITY.questions.length;

  const [slots, setSlots] = useState(
    Object.fromEntries(ACTIVITY.questions.map((q) => [q.slotId, null]))
  );
  const [freePieces, setFreePieces] = useState(() => shuffle(ACTIVITY.pieces));

  // "playing" | "flipping" | "flipped"
  const [phase, setPhase] = useState("playing");
  const [results, setResults] = useState(null);

  const [dragging, setDragging] = useState(null);
  const dragSource = useRef(null);

  const allSlotsFilled = Object.values(slots).every((v) => v !== null);
  const isFlipped = phase === "flipped" || phase === "flipping";

  // ── Drag ──────────────────────────────────────────────────────────────────────
  const onDragStartFree = (piece) => {
    setDragging(piece);
    dragSource.current = { type: "free" };
  };

  const onDragStartSlot = (piece, slotId) => {
    setDragging(piece);
    dragSource.current = { type: "slot", slotId };
  };

  const onDropSlot = (targetSlotId) => {
    if (!dragging || phase !== "playing") return;
    const existingInTarget = slots[targetSlotId];
    const src = dragSource.current;

    setSlots((prev) => {
      const next = { ...prev };
      next[targetSlotId] = dragging;
      if (src.type === "slot") next[src.slotId] = existingInTarget ?? null;
      return next;
    });

    if (src.type === "free") {
      setFreePieces((prev) => {
        let updated = prev.filter((p) => p.id !== dragging.id);
        if (existingInTarget) updated = [...updated, existingInTarget];
        return updated;
      });
    }

    setDragging(null);
    dragSource.current = null;
  };

  const onDropFree = () => {
    if (!dragging || dragSource.current?.type !== "slot" || phase !== "playing") return;
    const srcSlotId = dragSource.current.slotId;
    setSlots((prev) => ({ ...prev, [srcSlotId]: null }));
    setFreePieces((prev) => [...prev, dragging]);
    setDragging(null);
    dragSource.current = null;
  };

  // ── Virar ─────────────────────────────────────────────────────────────────────
  const handleFlip = () => {
    const res = {};
    let correct = 0;
    ACTIVITY.questions.forEach(({ slotId }) => {
      const piece = slots[slotId];
      const ok = piece !== null && piece.id === slotId;
      res[slotId] = ok;
      if (ok) correct++;
    });
    setResults(res);
    setPhase("flipping");
    // Após animação (600ms) marca como flipped
    setTimeout(() => setPhase("flipped"), 650);
  };

  // ── Virar de volta para corrigir ──────────────────────────────────────────────
  const handleUnflip = () => {
    // Libera peças erradas de volta para o free
    const wrongSlotIds = Object.entries(results)
      .filter(([, ok]) => !ok)
      .map(([id]) => parseInt(id));

    setFreePieces((prev) => {
      const returning = wrongSlotIds.map((sid) => slots[sid]).filter(Boolean);
      return [...prev, ...returning];
    });
    setSlots((prev) => {
      const next = { ...prev };
      wrongSlotIds.forEach((sid) => (next[sid] = null));
      return next;
    });

    setPhase("playing");
    setResults(null);
  };

  const correctCount = results ? Object.values(results).filter(Boolean).length : 0;

  return (
    <>
      {/* Keyframes para animação de flip */}
      <style>{`
        @keyframes boardFlip {
          0%   { transform: perspective(1200px) rotateY(0deg); }
          50%  { transform: perspective(1200px) rotateY(90deg); }
          100% { transform: perspective(1200px) rotateY(0deg); }
        }
        .board-flipping {
          animation: boardFlip 0.65s ease-in-out forwards;
        }
        .slot-piece:hover {
          opacity: 0.85;
        }
      `}</style>

      <div style={S.root}>
        <TopBar
          title={ACTIVITY.title}
          score={phase === "flipped" ? correctCount : null}
          total={total}
        />

        <div style={S.body}>
          <QuestionList questions={ACTIVITY.questions} slots={slots} results={results} />

          <main style={S.main}>
            {/* Tabuleiro com animação de flip */}
            <div className={phase === "flipping" ? "board-flipping" : ""}>
              <Board
                questions={ACTIVITY.questions}
                slots={slots}
                results={results}
                phase={phase}
                imageUrl={ACTIVITY.revealImageUrl}
                onDropSlot={onDropSlot}
                onDragStartSlot={onDragStartSlot}
              />
            </div>

            {/* Peças soltas — visíveis só enquanto jogando ou após unflip */}
            {phase === "playing" && (
              <FreePiecesArea
                pieces={freePieces}
                onDragStartFree={onDragStartFree}
                onDropFree={onDropFree}
              />
            )}

            {/* Após virar: mostra peças erradas que precisam ser recolocadas */}
            {phase === "flipped" && freePieces.length === 0 && (
              <WrongPiecesArea
                slots={slots}
                results={results}
                questions={ACTIVITY.questions}
              />
            )}

            <ActionBar
              phase={phase}
              allSlotsFilled={allSlotsFilled}
              correctCount={correctCount}
              total={total}
              onFlip={handleFlip}
              onUnflip={handleUnflip}
            />
          </main>
        </div>
      </div>
    </>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ title, score, total }) {
  const hasScore = score !== null;
  return (
    <header style={S.topBar}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={S.brandDot}>K</div>
        <span style={S.brandText}>KIVIRA</span>
      </div>
      <span style={S.topBarTitle}>{title}</span>
      <div style={{
        ...S.scoreBadge,
        background: hasScore ? "#e85d75" : "transparent",
        border: hasScore ? "none" : "1px solid rgba(255,255,255,0.2)",
      }}>
        {hasScore ? `${score} / ${total}` : `0 / ${total}`}
      </div>
    </header>
  );
}

// ─── LISTA DE PERGUNTAS ───────────────────────────────────────────────────────
function QuestionList({ questions, slots, results }) {
  return (
    <aside style={S.sidebar}>
      <p style={S.sectionLabel}>Perguntas</p>
      {questions.map(({ slotId, text }) => {
        const filled = slots[slotId] !== null;
        const res = results?.[slotId];
        let dotColor = "rgba(255,255,255,0.15)";
        if (res === true)  dotColor = "#4ade80";
        else if (res === false) dotColor = "#e85d75";
        else if (filled) dotColor = "#f59e0b";
        const border = res === true ? "#4ade80" : res === false ? "#e85d75" : "transparent";

        return (
          <div key={slotId} style={{ ...S.questionItem, borderLeft: `3px solid ${border}` }}>
            <div style={{ ...S.questionDot, background: dotColor }} />
            <span style={S.questionText}>
              <strong style={{ color: "rgba(255,255,255,0.35)", marginRight: 4 }}>{slotId}.</strong>
              {text}
            </span>
          </div>
        );
      })}
    </aside>
  );
}

// ─── TABULEIRO ────────────────────────────────────────────────────────────────
function Board({ questions, slots, results, phase, imageUrl, onDropSlot, onDragStartSlot }) {
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const isFlipped = phase === "flipped" || phase === "flipping";
  const isPlaying = phase === "playing";

  return (
    <div>
      <p style={S.sectionLabel}>Tabuleiro</p>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: 10 }}>
        {questions.map(({ slotId }) => {
          const piece = slots[slotId];
          const correct = results?.[slotId]; // true | false | undefined
          const isOver = dragOverSlot === slotId;

          // Cores dinâmicas do slot
          let borderColor = "rgba(255,255,255,0.12)";
          let bg = "rgba(255,255,255,0.04)";

          if (isFlipped) {
            if (correct === true)  { borderColor = "#4ade80"; bg = "rgba(74,222,128,0.06)"; }
            if (correct === false) { borderColor = "#e85d75"; bg = "rgba(232,93,117,0.06)"; }
          } else {
            if (isOver) { borderColor = "#e85d75"; bg = "rgba(232,93,117,0.1)"; }
            else if (piece) { borderColor = "rgba(232,93,117,0.4)"; bg = "rgba(232,93,117,0.06)"; }
          }

          return (
            <div
              key={slotId}
              onDragOver={(e) => { e.preventDefault(); if (isPlaying) setDragOverSlot(slotId); }}
              onDragLeave={() => setDragOverSlot(null)}
              onDrop={(e) => { e.preventDefault(); setDragOverSlot(null); onDropSlot(slotId); }}
              style={{ ...S.slot, border: `1.5px dashed ${borderColor}`, background: bg }}
            >
              {/* ── TABULEIRO VIRADO ── */}
              {isFlipped && correct === true && piece && (
                // Slot correto: mostra fragmento da imagem da peça correta
                <ImageFragment pieceId={piece.id} imageUrl={imageUrl} />
              )}

              {isFlipped && correct === false && (
                // Slot errado: vazio, borda vermelha, número do slot
                <>
                  <span style={{ ...S.slotNumber, color: "rgba(232,93,117,0.4)" }}>{slotId}</span>
                  <span style={{ fontSize: 18, position: "absolute", top: 4, right: 8 }}>✗</span>
                </>
              )}

              {/* ── JOGANDO ── */}
              {isPlaying && !piece && (
                <span style={S.slotNumber}>{slotId}</span>
              )}

              {isPlaying && piece && (
                <PieceFront
                  piece={piece}
                  draggable
                  onDragStart={() => onDragStartSlot(piece, slotId)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PEÇA FRENTE (texto + número) ────────────────────────────────────────────
function PieceFront({ piece, draggable, onDragStart }) {
  return (
    <div
      draggable={draggable}
      onDragStart={(e) => { e.stopPropagation(); onDragStart?.(); }}
      className="slot-piece"
      style={S.pieceFront}
    >
      <span style={S.pieceFrontNumber}>{piece.id}</span>
      <span style={S.pieceFrontLabel}>{piece.label}</span>
    </div>
  );
}

// ─── ÁREA DE PEÇAS SOLTAS ─────────────────────────────────────────────────────
function FreePiecesArea({ pieces, onDragStartFree, onDropFree }) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onDropFree(); }}
    >
      <p style={S.sectionLabel}>Peças soltas</p>
      <div style={S.piecesArea}>
        {pieces.length === 0
          ? <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>Todas as peças foram colocadas no tabuleiro</span>
          : pieces.map((p) => (
              <PieceFront key={p.id} piece={p} draggable onDragStart={() => onDragStartFree(p)} />
            ))
        }
      </div>
    </div>
  );
}

// ─── RESUMO APÓS VIRAR (peças que erraram) ────────────────────────────────────
function WrongPiecesArea({ slots, results, questions }) {
  const wrongItems = questions.filter(({ slotId }) => results?.[slotId] === false);
  if (wrongItems.length === 0) return null;

  return (
    <div>
      <p style={{ ...S.sectionLabel, color: "#e85d75" }}>Respostas erradas</p>
      <div style={{ ...S.piecesArea, borderColor: "rgba(232,93,117,0.2)" }}>
        {wrongItems.map(({ slotId, text }) => (
          <div key={slotId} style={{
            background: "rgba(232,93,117,0.1)",
            border: "1px solid rgba(232,93,117,0.3)",
            borderRadius: 10,
            padding: "6px 12px",
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
          }}>
            <strong style={{ color: "#e85d75" }}>{slotId}.</strong> {text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BARRA DE AÇÃO ────────────────────────────────────────────────────────────
function ActionBar({ phase, allSlotsFilled, correctCount, total, onFlip, onUnflip }) {
  if (phase === "flipped") {
    const allCorrect = correctCount === total;
    return (
      <div style={S.actionBar}>
        {allCorrect ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#4ade80", fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>
              🎉 Parabéns! Você acertou tudo!
            </p>
          </div>
        ) : (
          <>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>
              {correctCount}/{total} corretas — corrija os erros e tente novamente!
            </p>
            <button onClick={onUnflip} style={S.btnPrimary}>
              ↩ Corrigir respostas
            </button>
          </>
        )}
      </div>
    );
  }

  if (phase === "flipping") {
    return (
      <div style={S.actionBar}>
        <button disabled style={S.btnDisabled}>Virando...</button>
      </div>
    );
  }

  return (
    <div style={S.actionBar}>
      <button
        disabled={!allSlotsFilled}
        onClick={onFlip}
        style={allSlotsFilled ? S.btnPrimary : S.btnDisabled}
      >
        {!allSlotsFilled && <span style={{ marginRight: 6 }}>🔒</span>}
        {allSlotsFilled ? "Virar o Tabuleiro" : "Coloque todas as peças para revelar a imagem"}
      </button>
    </div>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const S = {
  root: {
    minHeight: "100vh", background: "#12121f",
    display: "flex", flexDirection: "column",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  topBar: {
    background: "#0d0d1a",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    padding: "0 24px", height: 56,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    flexShrink: 0,
  },
  brandDot: {
    width: 30, height: 30, borderRadius: "50%", background: "#e85d75",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 13, color: "#fff",
  },
  brandText: { color: "#fff", fontWeight: 600, fontSize: 13, letterSpacing: 1 },
  topBarTitle: { color: "#fff", fontWeight: 500, fontSize: 15 },
  scoreBadge: { borderRadius: 20, padding: "4px 16px", color: "#fff", fontSize: 14, fontWeight: 600 },
  body: { display: "flex", flex: 1 },
  sidebar: {
    width: 230, background: "#0d0d1a",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    padding: "20px 0", overflowY: "auto", flexShrink: 0,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.3)", fontSize: 11,
    textTransform: "uppercase", letterSpacing: 1.2,
    padding: "0 16px 10px", margin: 0,
  },
  questionItem: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 16px" },
  questionDot: { width: 7, height: 7, borderRadius: "50%", marginTop: 5, flexShrink: 0 },
  questionText: { color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: 1.55 },
  main: { flex: 1, padding: "24px 32px", display: "flex", flexDirection: "column", gap: 20 },
  slot: {
    height: 90, borderRadius: 12,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: 4, position: "relative", overflow: "hidden",
    transition: "background 0.15s, border-color 0.15s",
    cursor: "pointer",
  },
  slotNumber: { color: "rgba(255,255,255,0.18)", fontSize: 24, fontWeight: 700 },
  pieceFront: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 2, padding: "6px 10px", width: "88%",
    background: "rgba(232,93,117,0.15)",
    border: "1.5px solid rgba(232,93,117,0.45)",
    borderRadius: 10, cursor: "grab", userSelect: "none",
  },
  pieceFrontNumber: { color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 600 },
  pieceFrontLabel: { color: "#fff", fontSize: 12, fontWeight: 500, textAlign: "center" },
  piecesArea: {
    minHeight: 80, background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: "14px 16px",
    display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
  },
  actionBar: {
    display: "flex", justifyContent: "center", alignItems: "center",
    gap: 16, paddingTop: 4,
  },
  btnPrimary: {
    background: "#e85d75", border: "none", borderRadius: 24,
    padding: "12px 32px", color: "#fff", fontSize: 14, fontWeight: 600,
    cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
  },
  btnDisabled: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 24, padding: "12px 32px",
    color: "rgba(255,255,255,0.25)", fontSize: 14, fontWeight: 500,
    cursor: "not-allowed", display: "flex", alignItems: "center", gap: 8,
  },
};
