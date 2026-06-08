"use client";

export function FloatingSoccerBalls() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Gold soccer balls */}
      <div className="absolute top-[10%] left-[5%] h-10 w-10 animate-float-slow opacity-15">
        <svg viewBox="0 0 24 24" fill="none" className="text-yellow-400">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 2 L12 6 M12 18 L12 22 M2 12 L6 12 M18 12 L22 12" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="absolute top-[60%] right-[10%] h-8 w-8 animate-float-medium opacity-15" style={{ animationDelay: '1s' }}>
        <svg viewBox="0 0 24 24" fill="none" className="text-yellow-400">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 2 L12 6 M12 18 L12 22 M2 12 L6 12 M18 12 L22 12" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      
      {/* Blue soccer balls */}
      <div className="absolute top-[25%] right-[8%] h-7 w-7 animate-float-slow opacity-12" style={{ animationDelay: '2s' }}>
        <svg viewBox="0 0 24 24" fill="none" className="text-blue-400">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 2 L12 6 M12 18 L12 22 M2 12 L6 12 M18 12 L22 12" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      
      {/* Red soccer balls */}
      <div className="absolute bottom-[25%] left-[12%] h-9 w-9 animate-float-medium opacity-12" style={{ animationDelay: '0.5s' }}>
        <svg viewBox="0 0 24 24" fill="none" className="text-red-400">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 2 L12 6 M12 18 L12 22 M2 12 L6 12 M18 12 L22 12" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      
      {/* Green soccer balls */}
      <div className="absolute top-[45%] left-[8%] h-6 w-6 animate-float-slow opacity-12" style={{ animationDelay: '3s' }}>
        <svg viewBox="0 0 24 24" fill="none" className="text-green-400">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 2 L12 6 M12 18 L12 22 M2 12 L6 12 M18 12 L22 12" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}

export function TournamentColorBeams() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Red beam - top left */}
      <div className="absolute -top-32 -left-32 h-96 w-96 animate-pulse-slow rounded-full bg-red-500/15 blur-[100px]" style={{ animationDelay: '0s' }} />
      
      {/* Blue beam - top right */}
      <div className="absolute -top-24 -right-24 h-[500px] w-[500px] animate-pulse-slow rounded-full bg-blue-500/15 blur-[120px]" style={{ animationDelay: '2s' }} />
      
      {/* Green beam - bottom left */}
      <div className="absolute -bottom-32 -left-24 h-[450px] w-[450px] animate-pulse-slow rounded-full bg-green-500/15 blur-[110px]" style={{ animationDelay: '4s' }} />
      
      {/* Gold beam - center */}
      <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 animate-pulse-slow rounded-full bg-yellow-400/12 blur-[140px]" style={{ animationDelay: '1s' }} />
    </div>
  );
}

export function StadiumGrid() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]"
    />
  );
}

export function GoldSpotlight() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div className="h-[700px] w-[700px] animate-pulse-slow rounded-full bg-yellow-400/15 blur-[140px]" />
    </div>
  );
}

export function RadarGradient() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(250,204,21,0.05) 50%, transparent 100%)',
      }}
    />
  );
}

export function TournamentParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Gold particles */}
      <div className="absolute top-[15%] left-[20%] h-1.5 w-1.5 animate-pulse-slow rounded-full bg-yellow-400/40" style={{ animationDelay: '0s' }} />
      <div className="absolute top-[35%] right-[25%] h-1 w-1 animate-pulse-slow rounded-full bg-yellow-400/30" style={{ animationDelay: '1.5s' }} />
      <div className="absolute bottom-[40%] left-[30%] h-1.5 w-1.5 animate-pulse-slow rounded-full bg-yellow-400/35" style={{ animationDelay: '3s' }} />
      
      {/* Blue particles */}
      <div className="absolute top-[25%] right-[15%] h-1 w-1 animate-pulse-slow rounded-full bg-blue-400/40" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-[55%] left-[18%] h-1.5 w-1.5 animate-pulse-slow rounded-full bg-blue-400/30" style={{ animationDelay: '2s' }} />
      
      {/* Red particles */}
      <div className="absolute top-[45%] right-[30%] h-1 w-1 animate-pulse-slow rounded-full bg-red-400/35" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-[30%] right-[20%] h-1.5 w-1.5 animate-pulse-slow rounded-full bg-red-400/40" style={{ animationDelay: '2.5s' }} />
      
      {/* Green particles */}
      <div className="absolute bottom-[45%] right-[35%] h-1 w-1 animate-pulse-slow rounded-full bg-green-400/35" style={{ animationDelay: '0.8s' }} />
      <div className="absolute top-[65%] left-[25%] h-1.5 w-1.5 animate-pulse-slow rounded-full bg-green-400/30" style={{ animationDelay: '3.5s' }} />
    </div>
  );
}

export function StadiumLights() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Top stadium lights */}
      <div className="absolute -top-20 left-1/4 h-64 w-32 rotate-12 bg-gradient-to-b from-yellow-400/10 to-transparent blur-xl" />
      <div className="absolute -top-20 right-1/4 h-64 w-32 -rotate-12 bg-gradient-to-b from-blue-400/10 to-transparent blur-xl" />
      
      {/* Side lights */}
      <div className="absolute top-1/3 -left-10 h-48 w-24 rotate-45 bg-gradient-to-r from-red-400/8 to-transparent blur-2xl" />
      <div className="absolute top-1/3 -right-10 h-48 w-24 -rotate-45 bg-gradient-to-l from-green-400/8 to-transparent blur-2xl" />
    </div>
  );
}

export function PitchMarkings() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]" aria-hidden="true">
      {/* Center circle */}
      <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
      <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      
      {/* Horizontal center line */}
      <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white" />
      
      {/* Penalty arcs */}
      <div className="absolute left-[15%] top-1/2 h-32 w-32 -translate-y-1/2 rounded-full border border-white" />
      <div className="absolute right-[15%] top-1/2 h-32 w-32 -translate-y-1/2 rounded-full border border-white" />
    </div>
  );
}
