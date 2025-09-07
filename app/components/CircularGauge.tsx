"use client";

interface CircularGaugeProps {
  value: number;
  onChange: (value: number) => void;
  position: "left" | "right";
}

export default function CircularGauge({ value, onChange, position }: CircularGaugeProps) {
  const handleGaugeInteraction = (event: React.MouseEvent | React.TouchEvent, targetElement?: HTMLElement) => {
    const target = targetElement || event.currentTarget as HTMLElement;
    if (!target || !target.getBoundingClientRect) return;

    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX: number, clientY: number;
    
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const x = clientX - centerX;
    const y = clientY - centerY;

    let angle = Math.atan2(y, x) * (180 / Math.PI);
    angle = (angle + 360) % 360;

    let gaugeValue;

    if (position === "left") {
      if (angle >= 270 && angle <= 360) {
        gaugeValue = (360 - angle) / 90;
      } else if (angle >= 0 && angle <= 90) {
        gaugeValue = (90 - angle) / 90;
      } else {
        gaugeValue = 0;
      }
    } else {
      if (angle >= 180 && angle <= 270) {
        gaugeValue = (angle - 180) / 90;
      } else {
        gaugeValue = 0;
      }
    }

    onChange(gaugeValue);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    const targetElement = event.currentTarget as HTMLElement;
    handleGaugeInteraction(event, targetElement);

    const handleMouseMove = (e: MouseEvent) => {
      handleGaugeInteraction(e as any, targetElement);
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    event.preventDefault();
    const targetElement = event.currentTarget as HTMLElement;
    handleGaugeInteraction(event, targetElement);

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleGaugeInteraction(e as any, targetElement);
    };
    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
  };

  const positionClasses =
    position === "left"
      ? "bottom-0 left-0 translate-x-[-50%] translate-y-[50%]"
      : "bottom-0 right-0 translate-x-[50%] translate-y-[50%]";

  const size = 288;
  const center = size / 2;
  const radius = 108;
  const strokeWidth = 48;
  const circumference = 2 * Math.PI * radius;
  const quarterCircumference = circumference / 4;

  return (
    <div className={`absolute w-72 h-72 transform ${positionClasses}`}>
      <svg
        width={size}
        height={size}
        className="absolute inset-0 pointer-events-none"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#4b5563"
          strokeWidth={strokeWidth}
          opacity="0.8"
          filter="drop-shadow(0 0 8px rgba(75, 85, 99, 0.5))"
        />

        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
          strokeDasharray={`${quarterCircumference} ${circumference}`}
          strokeDashoffset={
            position === "left" 
              ? quarterCircumference * (1 - value)
              : quarterCircumference * (1 - value)
          }
          strokeLinecap="round"
          transform={
            position === "left"
              ? `rotate(180 ${center} ${center}) scale(-1, 1) translate(-${size}, 0)`
              : `rotate(180 ${center} ${center})`
          }
          style={{
            transition: "stroke-dashoffset 0.1s ease-out",
          }}
        />
      </svg>

      <div
        className="absolute inset-0 w-full h-full cursor-pointer bg-transparent z-20"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      ></div>
    </div>
  );
}