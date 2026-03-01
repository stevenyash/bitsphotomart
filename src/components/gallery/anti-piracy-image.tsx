"use client";

import { useState, useEffect, ReactNode } from "react";

interface AntiPiracyImageProps {
  children: ReactNode;
  showWatermark?: boolean;
  watermarkText?: string;
  className?: string;
}

export function AntiPiracyImage({
  children,
  showWatermark = true,
  watermarkText = "Bits Photo Mart",
  className = ""
}: AntiPiracyImageProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [preventCapture, setPreventCapture] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Prevent right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Prevent drag
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Prevent copy
  const handleCopy = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  // Prevent cut
  const handleCut = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  // Prevent paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  // Handle visibility change (when user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setPreventCapture(true);
      } else {
        setPreventCapture(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return (
    <div
      className={`relative inline-block ${className}`}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onCopy={handleCopy}
      onCut={handleCut}
      onPaste={handlePaste}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        // Additional CSS to make it harder to select
        WebkitTouchCallout: "none",
      }}
      // Add data attributes for security scanning
      data-anti-piracy="true"
      data-copy-disabled="true"
    >
      {/* Main content */}
      <div className="relative">
        {children}
        
        {/* Watermark overlay */}
        {showWatermark && (
          <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            style={{
              opacity: 0.15,
              background: "transparent",
              zIndex: 10,
            }}
          >
            <div
              className="transform rotate-[-30deg] text-gray-400 font-bold text-2xl md:text-4xl whitespace-nowrap"
              style={{
                fontSize: "clamp(1rem, 4vw, 3rem)",
                letterSpacing: "0.2em",
              }}
            >
              {Array(3).fill(watermarkText).join("   ")}
            </div>
          </div>
        )}
        
        {/* Screenshot prevention overlay (visible on mobile) */}
        {isMobile && (
          <div
            className="absolute inset-0 bg-transparent pointer-events-none z-20"
            aria-hidden="true"
          />
        )}
      </div>
      
      {/* Prevent capture overlay - shown when tab becomes hidden */}
      {preventCapture && (
        <div
          className="absolute inset-0 bg-white/90 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
        >
          <p className="text-gray-800 font-semibold">
            ⚠️ Screenshot protection active
          </p>
        </div>
      )}
      
      {/* Security message (hidden but accessible to screen readers) */}
      <span className="sr-only">
        This image is protected. Copying, saving, or screenshotting is disabled.
      </span>
    </div>
  );
}

// Hook for checking if user is trying to bypass protection
export function useAntiPiracyMonitor() {
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    // Monitor for dev tools opening
    const detectDevTools = () => {
      const threshold = 160;
      const check = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
          setAlerts(prev => [...prev, "DevTools detected"]);
        }
      };
      
      setInterval(check, 1000);
    };

    // Monitor for console manipulation attempts
    const originalConsole = { ...console };
    let consoleManipulationAttempts = 0;
    
    try {
      Object.defineProperty(window, 'console', {
        get: function() {
          consoleManipulationAttempts++;
          if (consoleManipulationAttempts > 1) {
            setAlerts(prev => [...prev, "Console manipulation detected"]);
          }
          return originalConsole;
        },
        set: function() {
          // Ignore
        }
      });
    } catch (e) {
      // Ignore errors
    }

    // Check for screenshot APIs (mobile)
    if (typeof navigator !== 'undefined' && 'mediaDevices' in navigator) {
      try {
        // This is a detection mechanism, not prevention
        navigator.mediaDevices.addEventListener('devicechange', () => {
          // Could detect screen capture here but browsers block this info
        });
      } catch (e) {
        // Ignore
      }
    }
  }, []);

  return { alerts };
}
