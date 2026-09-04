import React from 'react';

interface EdTechLogoProps {
  className?: string;
  variant?: 'emblem' | 'full' | 'badge';
  size?: number | string;
  lightMode?: boolean;
}

export const EdTechEmblem: React.FC<{ className?: string; colorMode?: 'monochrome' | 'accent' | 'dark' }> = ({
  className = "w-6 h-6",
  colorMode = 'monochrome'
}) => {
  const whiteColor = colorMode === 'dark' ? '#0f172a' : '#ffffff';
  const silverColor = colorMode === 'dark' ? '#64748b' : colorMode === 'accent' ? '#60a5fa' : '#94a3b8';
  const baseColor = colorMode === 'dark' ? '#334155' : '#cbd5e1';

  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-label="ED.TECH Logo"
    >
      {/* Base / Mount */}
      <rect x="94" y="166" width="12" height="8" rx="1" fill={baseColor} />
      <rect x="76" y="174" width="48" height="5" rx="2" fill={baseColor} />

      {/* Top Camera Flash / Viewfinder Mounts */}
      {/* Left Top Bracket */}
      <path 
        d="M 52 46 H 76 V 56 H 64 V 56 H 52 Z" 
        fill={baseColor} 
      />
      <rect x="52" y="46" width="10" height="12" fill={whiteColor} />

      {/* Right Top Bracket */}
      <path 
        d="M 126 44 H 150 V 68 H 140 V 54 H 126 Z" 
        fill={silverColor} 
      />
      <rect x="140" y="44" width="10" height="24" fill={silverColor} />

      {/* Main Camera Frame */}
      {/* Left Body - Letter "E" in bold white */}
      {/* Top horizontal arm */}
      <rect x="46" y="56" width="60" height="12" fill={whiteColor} />
      {/* Left vertical spine */}
      <rect x="46" y="56" width="13" height="84" fill={whiteColor} />
      {/* Middle horizontal arm */}
      <rect x="46" y="92" width="50" height="11" fill={whiteColor} />
      {/* Bottom horizontal arm */}
      <rect x="46" y="128" width="60" height="12" fill={whiteColor} />

      {/* Right Frame (Silver) */}
      <path 
        d="M 106 56 H 152 V 140 H 106 V 128 H 140 V 68 H 106 Z" 
        fill={silverColor} 
      />

      {/* Lens Circle (Middle Ring) */}
      <circle 
        cx="103" 
        cy="98" 
        r="38" 
        fill="none" 
        stroke={silverColor} 
        strokeWidth="10" 
      />

      {/* Center "D" Monogram */}
      <rect x="94" y="70" width="11" height="56" fill={whiteColor} />
      <path 
        d="M 100 70 H 112 C 132 70, 142 82, 142 98 C 142 114, 132 126, 112 126 H 100" 
        fill="none" 
        stroke={whiteColor} 
        strokeWidth="11" 
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
};

export const EdTechLogo: React.FC<EdTechLogoProps> = ({
  className = "",
  variant = 'badge',
  size,
  lightMode = false
}) => {
  if (variant === 'emblem') {
    return <EdTechEmblem className={className || "w-6 h-6"} colorMode={lightMode ? 'dark' : 'monochrome'} />;
  }

  if (variant === 'badge') {
    return (
      <div 
        className={`bg-slate-900 border border-slate-700/80 rounded-2xl flex items-center justify-center p-2 shadow-lg shadow-black/40 ${className}`}
        style={size ? { width: size, height: size } : undefined}
      >
        <EdTechEmblem className="w-full h-full" colorMode="monochrome" />
      </div>
    );
  }

  // Full variant: Emblem + Text Lockup
  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      {/* Emblem Frame */}
      <div className="w-20 h-20 bg-black rounded-2xl p-2 border border-slate-800 flex items-center justify-center shadow-md">
        <EdTechEmblem className="w-16 h-16" colorMode="monochrome" />
      </div>

      {/* Typography */}
      <div className="mt-2.5 flex flex-col items-center">
        <span className="text-xl font-black tracking-wider text-white font-sans">
          ED.TECH
        </span>
        <div className="w-full h-[2px] bg-white my-1 rounded-full opacity-90" />
        <span className="text-xs font-extrabold tracking-[0.18em] text-slate-200 uppercase">
          AUDIO-VISUAL
        </span>
        <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase mt-0.5 whitespace-nowrap">
          VISUTTHARANGSI KANCHANABURI SCHOOL
        </span>
      </div>
    </div>
  );
};
