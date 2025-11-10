import React from 'react';

interface RiskGaugeProps {
  score: number; // 0-100
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score }) => {
  const getRiskColor = (s: number) => {
    if (s < 40) return '#22c55e'; // green-500
    if (s < 70) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const color = getRiskColor(score);
  const clampedScore = Math.max(0, Math.min(100, score));
  const angle = (clampedScore / 100) * 180;

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const progressArc = describeArc(50, 50, 40, 0, angle);

  return (
    <div className="risk-gauge">
      <svg viewBox="0 0 100 55" className="risk-gauge-svg">
        <path
          d={describeArc(50, 50, 40, 0, 180)}
          className="risk-gauge-background"
        />
        <path
          d={progressArc}
          className="risk-gauge-progress"
          style={{ stroke: color, transition: 'd 0.5s ease' }}
        />
        <text x="50" y="45" className="risk-gauge-text">
          {clampedScore}
        </text>
      </svg>
    </div>
  );
};
