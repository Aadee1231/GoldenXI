"use client";

export function SoccerPitchOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.06] sm:opacity-[0.06]" aria-hidden="true">
      {/* Center circle - simplified on mobile */}
      <div className="absolute left-1/2 top-1/2 h-48 w-48 sm:h-64 sm:w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      
      {/* Center line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-white" />
      
      {/* Penalty boxes - hidden on mobile for cleaner look */}
      <div className="hidden sm:block absolute left-0 top-1/2 h-80 w-40 -translate-y-1/2 border-2 border-white border-l-0" />
      <div className="hidden sm:block absolute right-0 top-1/2 h-80 w-40 -translate-y-1/2 border-2 border-white border-r-0" />
      
      {/* Goal boxes - hidden on mobile */}
      <div className="hidden sm:block absolute left-0 top-1/2 h-48 w-16 -translate-y-1/2 border-2 border-white border-l-0" />
      <div className="hidden sm:block absolute right-0 top-1/2 h-48 w-16 -translate-y-1/2 border-2 border-white border-r-0" />
      
      {/* Penalty arcs - hidden on mobile */}
      <div className="hidden sm:block absolute left-[140px] top-1/2 h-32 w-32 -translate-y-1/2 rounded-full border-2 border-white border-r-0" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }} />
      <div className="hidden sm:block absolute right-[140px] top-1/2 h-32 w-32 -translate-y-1/2 rounded-full border-2 border-white border-l-0" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }} />
      
      {/* Corner arcs - hidden on mobile */}
      <div className="hidden sm:block absolute left-0 top-0 h-20 w-20 rounded-br-full border-b-2 border-r-2 border-white" />
      <div className="hidden sm:block absolute right-0 top-0 h-20 w-20 rounded-bl-full border-b-2 border-l-2 border-white" />
      <div className="hidden sm:block absolute bottom-0 left-0 h-20 w-20 rounded-tr-full border-r-2 border-t-2 border-white" />
      <div className="hidden sm:block absolute bottom-0 right-0 h-20 w-20 rounded-tl-full border-l-2 border-t-2 border-white" />
    </div>
  );
}

export function PitchGrassPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Grass stripe pattern */}
      <div className="absolute inset-0 opacity-[0.015]">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={`absolute top-0 bottom-0 w-[5%] ${i % 2 === 0 ? 'bg-green-500' : 'bg-green-600'}`}
            style={{ left: `${i * 5}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SoccerBallPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]" aria-hidden="true">
      {/* Decorative soccer ball hexagon patterns */}
      <svg className="absolute left-[10%] top-[15%] h-16 w-16 text-white" viewBox="0 0 100 100">
        <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" fill="none" stroke="currentColor" strokeWidth="2" />
        <polygon points="50,10 70,25 60,45 40,45 30,25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      
      <svg className="absolute right-[15%] top-[25%] h-12 w-12 text-white" viewBox="0 0 100 100">
        <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" fill="none" stroke="currentColor" strokeWidth="2" />
        <polygon points="50,10 70,25 60,45 40,45 30,25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      
      <svg className="absolute left-[20%] bottom-[20%] h-14 w-14 text-white" viewBox="0 0 100 100">
        <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" fill="none" stroke="currentColor" strokeWidth="2" />
        <polygon points="50,10 70,25 60,45 40,45 30,25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      
      <svg className="absolute right-[12%] bottom-[30%] h-10 w-10 text-white" viewBox="0 0 100 100">
        <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" fill="none" stroke="currentColor" strokeWidth="2" />
        <polygon points="50,10 70,25 60,45 40,45 30,25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export function StadiumFloodlightGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Floodlight beams from corners */}
      <div className="absolute -top-40 -left-20 h-[600px] w-80 rotate-12 bg-gradient-to-b from-yellow-400/10 via-yellow-400/3 to-transparent blur-3xl animate-pulse-slow" />
      <div className="absolute -top-40 -right-20 h-[600px] w-80 -rotate-12 bg-gradient-to-b from-blue-400/10 via-blue-400/3 to-transparent blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      
      {/* Side lights */}
      <div className="absolute top-1/4 -left-32 h-96 w-80 rotate-45 bg-gradient-to-r from-red-400/8 to-transparent blur-3xl" />
      <div className="absolute top-1/4 -right-32 h-96 w-80 -rotate-45 bg-gradient-to-l from-green-400/8 to-transparent blur-3xl" />
    </div>
  );
}

export function PitchGreenGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Green pitch glow from bottom */}
      <div className="absolute -bottom-32 left-0 right-0 h-[500px] bg-gradient-to-t from-green-500/12 via-green-500/4 to-transparent blur-3xl" />
      
      {/* Center pitch glow */}
      <div className="absolute bottom-0 left-1/2 h-96 w-[800px] -translate-x-1/2 bg-gradient-to-t from-green-400/8 to-transparent blur-3xl" />
    </div>
  );
}
