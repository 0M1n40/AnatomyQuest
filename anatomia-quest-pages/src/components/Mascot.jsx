// "Doutor Ossinho" — mascote da disciplina de Anatomia (SVG puro, sem imagens externas)
const INK = '#2b2b3a';
const BONE = '#fffaf0';

function Bone({ d }) {
  return (
    <g strokeLinecap="round">
      <path d={d} strokeWidth="9" stroke={INK} />
      <path d={d} strokeWidth="5" stroke={BONE} />
    </g>
  );
}
const Joint = ({ cx, cy }) => <circle cx={cx} cy={cy} r="6" fill={BONE} stroke={INK} strokeWidth="2.5" />;

function Eyes({ mood }) {
  if (mood === 'party') {
    return (
      <g stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round">
        <path d="M36 52 Q45 40 54 52" />
        <path d="M66 52 Q75 40 84 52" />
      </g>
    );
  }
  const l = mood === 'think' ? { dx: 3, dy: -4 } : { dx: 0, dy: 0 };
  const ry = mood === 'sad' ? 10 : 11.5;
  return (
    <g>
      <ellipse cx="45" cy="50" rx="9.5" ry={ry} fill={INK} />
      <ellipse cx="75" cy="50" rx="9.5" ry={ry} fill={INK} />
      <circle cx={48 + l.dx} cy={46 + l.dy} r="3.6" fill="#fff" />
      <circle cx={78 + l.dx} cy={46 + l.dy} r="3.6" fill="#fff" />
      <circle cx={43 + l.dx} cy={54 + l.dy} r="1.6" fill="#fff" />
      <circle cx={73 + l.dx} cy={54 + l.dy} r="1.6" fill="#fff" />
      {mood === 'sad' && (
        <g stroke={INK} strokeWidth="3" strokeLinecap="round">
          <path d="M36 36 L52 32" />
          <path d="M84 36 L68 32" />
        </g>
      )}
      {mood === 'think' && <path d="M66 33 Q75 27 84 33" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />}
    </g>
  );
}

function Mouth({ mood }) {
  if (mood === 'party') return <path d="M50 77 Q60 92 70 77 Z" fill="#e85d75" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />;
  if (mood === 'sad') return <path d="M51 84 Q60 77 69 84" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />;
  if (mood === 'think') return <circle cx="63" cy="81" r="3.5" fill={INK} />;
  return <path d="M50 78 Q60 88 70 78" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />;
}

export default function Mascot({ mood = 'happy', size = 120, className = '' }) {
  const party = mood === 'party';
  return (
    <svg viewBox="0 0 120 150" width={size} height={size * 1.25} className={className} role="img" aria-label="Doutor Ossinho, mascote de Anatomia">
      {/* braços atrás do jaleco */}
      {party ? (
        <>
          <Bone d="M28 104 L12 76" /><Joint cx={11} cy={73} />
          <Bone d="M92 104 L108 76" /><Joint cx={109} cy={73} />
        </>
      ) : (
        <>
          <Bone d="M28 104 L18 128" /><Joint cx={17} cy={131} />
          {mood !== 'think' && (<><Bone d="M92 104 L102 128" /><Joint cx={103} cy={131} /></>)}
        </>
      )}

      {/* jaleco */}
      <path d="M30 96 Q60 86 90 96 L96 146 L24 146 Z" fill="#ffffff" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M50 94 L60 146 L70 94 Z" fill="#dff3f1" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <g stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M54 108 Q60 112 66 108" />
        <path d="M55.5 118 Q60 121 64.5 118" />
        <path d="M57 128 Q60 130 63 128" />
      </g>
      {/* braço no queixo (pensando) */}
      {mood === 'think' && (<><Bone d="M88 108 L74 96" /><Joint cx={72} cy={94} /></>)}
      {/* gola, bolso e caneta */}
      <path d="M44 92 L52 104 L56 92 M76 92 L68 104 L64 92" fill="#14b8a6" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <rect x="74" y="118" width="13" height="10" rx="2" fill="#fff" stroke={INK} strokeWidth="2" />
      <path d="M78 116 L78 122" stroke="#f97366" strokeWidth="3" strokeLinecap="round" />
      {/* estetoscópio */}
      <path d="M40 96 Q36 122 46 128 Q54 132 56 122" stroke="#14b8a6" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="56" cy="120" r="4.5" fill="#14b8a6" stroke={INK} strokeWidth="2" />

      {/* crânio */}
      <path d="M20 50 Q20 12 60 12 Q100 12 100 50 Q100 70 86 76 L34 76 Q20 70 20 50 Z" fill={BONE} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <rect x="40" y="70" width="40" height="22" rx="10" fill={BONE} stroke={INK} strokeWidth="3" />
      <path d="M50 86 L50 91 M56 87 L56 92 M64 87 L64 92 M70 86 L70 91" stroke={INK} strokeWidth="1.6" opacity=".55" />
      {/* espelho frontal */}
      <path d="M22 34 Q60 18 98 34" stroke="#14b8a6" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="60" cy="24" r="8" fill="#e6fffb" stroke={INK} strokeWidth="2.5" />
      <circle cx="60" cy="24" r="3" fill="#14b8a6" />
      {/* bochechas e nariz */}
      <ellipse cx="31" cy="64" rx="6" ry="4" fill="#ffb3c1" opacity=".85" />
      <ellipse cx="89" cy="64" rx="6" ry="4" fill="#ffb3c1" opacity=".85" />
      <path d="M56 62 L64 62 L60 68 Z" fill={INK} strokeLinejoin="round" />

      <Eyes mood={mood} />
      <Mouth mood={mood} />

      {mood === 'sad' && <path d="M98 40 Q103 50 98 54 Q93 50 98 40 Z" fill="#7cc4ff" stroke={INK} strokeWidth="1.5" />}
      {mood === 'think' && <text x="98" y="22" fontSize="20" fontWeight="800" fill="#14b8a6">?</text>}
      {party && (
        <g>
          <circle cx="10" cy="20" r="3" fill="#f97366" />
          <rect x="104" y="14" width="6" height="6" fill="#facc15" transform="rotate(20 107 17)" />
          <circle cx="112" cy="44" r="2.5" fill="#14b8a6" />
          <rect x="6" y="46" width="5" height="5" fill="#a78bfa" transform="rotate(-15 8 48)" />
        </g>
      )}
    </svg>
  );
}
