import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function HardwareButton({ 
  children, 
  className, 
  color = "#E8E8E8", 
  textColor = "#000",
  onClick,
  disabled = false,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { color?: string, textColor?: string }) {
  return (
    <button
      className={cn(
        "hardware-key flex items-center justify-center p-4 text-lg sm:text-xl",
        className
      )}
      style={{ backgroundColor: color, color: textColor }}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function OLEDDisplay({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("oled-screen p-4 min-h-[100px]", className)}>
      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}

export function TapeLabel({ children, className, angle = -2 }: { children: React.ReactNode, className?: string, angle?: number }) {
  return (
    <div 
      className={cn("tape-label inline-block", className)}
      style={{ transform: `rotate(${angle}deg)` }}
    >
      {children}
    </div>
  );
}

export function Knob({ 
  value, 
  onChange, 
  min = 0, 
  max = 100,
  label 
}: { 
  value: number; 
  onChange?: (v: number) => void; 
  min?: number; 
  max?: number;
  label?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const rotation = -135 + (percentage * 270); // -135deg to +135deg

  // Simple drag interaction mocked - in reality you'd attach mouse/touch handlers to window
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    let newRot = angle + 90;
    if (newRot < -135) newRot = -135;
    if (newRot > 135) newRot = 135;
    const newVal = min + ((newRot + 135) / 270) * (max - min);
    onChange(Math.round(newVal));
  };

  return (
    <div className="knob-container">
      {label && <span className="font-display text-xs text-neutral-400 uppercase tracking-widest">{label}</span>}
      <div 
        className="relative w-20 h-20 rounded-full bg-[#111] border-4 border-[#222] shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] cursor-pointer active:scale-95 transition-transform"
        onClick={handleClick}
      >
        {/* Indicator Line */}
        <motion.div 
          className="absolute top-0 left-1/2 w-1 h-1/2 origin-bottom -translate-x-1/2"
          animate={{ rotate: rotation }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="w-1 h-3 bg-[#FF4F00] mx-auto mt-1 rounded-full shadow-[0_0_4px_#FF4F00]" />
        </motion.div>
        
        {/* Inner divet */}
        <div className="absolute inset-4 rounded-full bg-[#0a0a0a] shadow-[inset_0_2px_4px_rgba(0,0,0,1)]" />
      </div>
      <OLEDDisplay className="p-1 min-h-0 text-xs w-20 text-center shadow-none">{value}</OLEDDisplay>
    </div>
  );
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
