interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: 'text-xl' },
    md: { icon: 48, text: 'text-2xl' },
    lg: { icon: 64, text: 'text-4xl' },
  };

  const { icon, text } = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon */}
      <div className="relative" style={{ width: icon, height: icon }}>
        {/* Echo rings */}
        <div className="absolute inset-0 border-2 border-emerald/25 rounded-xl animate-echo echo-delay-1" />
        <div className="absolute inset-0 border-2 border-emerald/40 rounded-xl animate-echo echo-delay-2" />
        
        {/* Main icon */}
        <div 
          className="relative w-full h-full bg-gradient-to-br from-emerald-light to-emerald rounded-xl flex items-center justify-center shadow-glow"
        >
          {/* Sound wave bars */}
          <div className="flex items-center gap-0.5 h-1/2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`bg-white rounded-full animate-wave wave-delay-${i}`}
                style={{
                  width: Math.max(2, icon / 16),
                  height: i === 3 ? '100%' : i === 2 || i === 4 ? '66%' : '33%',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Text */}
      {showText && (
        <span className={`font-display font-bold ${text} text-gradient`}>
          blablabla
        </span>
      )}
    </div>
  );
}
