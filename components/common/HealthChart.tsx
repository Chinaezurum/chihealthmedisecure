import React, { useState } from 'react';

interface ChartDataPoint {
  value: number;
  label: string;
}

interface HealthChartProps {
  data: ChartDataPoint[];
  color: string;
  unit: string;
}

const SVG_WIDTH = 500;
const SVG_HEIGHT = 180;
const PADDING = { top: 10, bottom: 20, left: 10, right: 10 };

export const HealthChart: React.FC<HealthChartProps> = ({ data, color, unit }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: ChartDataPoint } | null>(null);

  if (data.length < 2) {
    return <div className="health-chart-container flex items-center justify-center text-text-tertiary text-sm">Not enough data to display chart.</div>;
  }

  const chartWidth = SVG_WIDTH - PADDING.left - PADDING.right;
  const chartHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;

  const maxVal = Math.max(...data.map(d => d.value), 0);
  const minVal = Math.min(...data.map(d => d.value), 0);
  const valueRange = maxVal - minVal || 1;

  const getX = (index: number) => PADDING.left + (index / (data.length - 1)) * chartWidth;
  const getY = (value: number) => PADDING.top + chartHeight - ((value - minVal) / valueRange) * chartHeight;

  const pathPoints = data.map((point, i) => `${getX(i)},${getY(point.value)}`).join(' ');
  const areaPoints = `${PADDING.left},${SVG_HEIGHT - PADDING.bottom} ${pathPoints} ${SVG_WIDTH - PADDING.right},${SVG_HEIGHT - PADDING.bottom}`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const index = Math.round(((x - PADDING.left) / chartWidth) * (data.length - 1));

    if (index >= 0 && index < data.length) {
      const point = data[index];
      setTooltip({
        x: getX(index),
        y: getY(point.value),
        data: point,
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };
  
  return (
    <div className="health-chart-container">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-full"
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="health-chart-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area */}
        <polygon points={areaPoints} fill="url(#health-chart-gradient)" />

        {/* Line */}
        <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pathPoints} />

        {/* Interactive points and tooltip */}
        {tooltip && (
          <g>
            <line x1={tooltip.x} y1={PADDING.top} x2={tooltip.x} y2={SVG_HEIGHT - PADDING.bottom} stroke={color} strokeWidth="1" strokeDasharray="4" />
            <circle cx={tooltip.x} cy={tooltip.y} r="5" fill={color} stroke="var(--background-secondary)" strokeWidth="2" />
          </g>
        )}
      </svg>
      {tooltip && (
        <div
          className="health-chart-tooltip"
          style={{
            transform: `translate(${tooltip.x * (100/SVG_WIDTH)}%, ${tooltip.y}px) translate(-50%, -120%)`,
            left: '0px',
            top: '0px'
          }}
        >
          <span className="health-chart-tooltip-label">{tooltip.data.label}: </span>
          <span className="health-chart-tooltip-value">{tooltip.data.value} {unit}</span>
        </div>
      )}
    </div>
  );
};