import React from "react";

interface CircularProgressRingProps {
  progress: number; // 0 to 100
  size?: number; // size in pixels
  strokeWidth?: number; // stroke width in pixels
  colorClass?: string; // color class for the progress stroke
  showLabel?: boolean; // whether to show percentage label inside
  labelColorClass?: string; // class for the label text
}

export const CircularProgressRing: React.FC<CircularProgressRingProps> = ({
  progress,
  size = 28,
  strokeWidth = 3,
  colorClass = "text-emerald-400",
  showLabel = true,
  labelColorClass = "text-emerald-300 font-bold",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center shrink-0 select-none"
      style={{ width: size, height: size }}
    >
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-800/90"
          fill="transparent"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={`${colorClass} transition-all duration-150 ease-out`}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      {showLabel && (
        <span className={`absolute text-[8px] font-mono leading-none ${labelColorClass}`}>
          {Math.min(99, Math.round(clampedProgress))}
        </span>
      )}
    </div>
  );
};
