"use client";

interface WatermarkProps {
  children: React.ReactNode;
  showWatermark?: boolean;
  text?: string;
}

export function WatermarkImage({ 
  children, 
  showWatermark = true,
  text = "BITSPHOTOMART"
}: WatermarkProps) {
  if (!showWatermark) {
    return <>{children}</>;
  }

  return (
    <div className="relative inline-block w-full h-full">
      {children}
      {/* Watermark Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grid of watermarks */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-[200%] h-[200%] opacity-15 rotate-[-30deg]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 50px,
                rgba(255,255,255,0.8) 50px,
                rgba(255,255,255,0.8) 51px
              ), repeating-linear-gradient(
                90deg,
                transparent,
                transparent 50px,
                rgba(255,255,255,0.8) 50px,
                rgba(255,255,255,0.8) 51px
              )`,
              backgroundSize: '100px 100px',
            }}
          />
        </div>
        
        {/* Center watermark text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="transform rotate-[-30deg]">
            <span 
              className="text-4xl font-bold text-white whitespace-nowrap"
              style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                letterSpacing: '0.2em',
              }}
            >
              {text}
            </span>
          </div>
        </div>
        
        {/* Corner watermarks */}
        <div className="absolute top-4 left-4 transform rotate-[-30deg]">
          <span className="text-xs font-bold text-white opacity-50">{text}</span>
        </div>
        <div className="absolute top-4 right-4 transform rotate-[-30deg]">
          <span className="text-xs font-bold text-white opacity-50">{text}</span>
        </div>
        <div className="absolute bottom-4 left-4 transform rotate-[-30deg]">
          <span className="text-xs font-bold text-white opacity-50">{text}</span>
        </div>
        <div className="absolute bottom-4 right-4 transform rotate-[-30deg]">
          <span className="text-xs font-bold text-white opacity-50">{text}</span>
        </div>
      </div>
    </div>
  );
}
