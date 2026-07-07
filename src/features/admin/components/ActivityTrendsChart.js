"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

// SVG Line Chart Curve Generator Utility
function getCurvePath(points) {
  if (points.length === 0) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 2;
    const cpY1 = p0.y;
    const cpX2 = p0.x + (p1.x - p0.x) / 2;
    const cpY2 = p1.y;
    path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
  }
  return path;
}

function getFillPath(points) {
  const curve = getCurvePath(points);
  if (!curve) return "";
  return `${curve} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`;
}

export default function ActivityTrendsChart({ chartData = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Map 7-Day points to SVG coordinates (width=500, height=180)
  const maxVal = Math.max(...chartData.map((d) => Math.max(d.coupons, d.deals))) || 10;
  const cPoints = chartData.map((d, i) => ({
    x: 40 + i * (420 / 6),
    y: 140 - (d.coupons / maxVal) * 100,
  }));
  const dPoints = chartData.map((d, i) => ({
    x: 40 + i * (420 / 6),
    y: 140 - (d.deals / maxVal) * 100,
  }));

  return (
    <Card className="relative rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 lg:col-span-2 shadow-sm overflow-visible">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <CardTitle className="text-base font-bold tracking-tight text-[var(--text)]">Catalog Activity Trends</CardTitle>
          <CardDescription className="text-xs text-[var(--muted)] mt-0.5">Publishing volume of coupons vs active deals.</CardDescription>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-[var(--text)]">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Coupons
          </span>
          <span className="flex items-center gap-1.5 text-[var(--text)]">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Deals
          </span>
        </div>
      </div>

      <div className="relative mt-6">
        {/* Dynamic Tooltip */}
        {hoveredIndex !== null && (
          <div
            className="absolute z-10 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 shadow-xl pointer-events-none text-xs flex flex-col gap-1 min-w-[120px]"
            style={{
              left: `calc(${(cPoints[hoveredIndex].x / 500) * 100}% - 60px)`,
              top: `-15px`,
            }}
          >
            <p className="font-bold text-[var(--text)] border-b border-[var(--border)] pb-1 mb-1">
              {chartData[hoveredIndex].labelDay}
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--muted)] font-medium">Coupons:</span>
              <span className="font-bold text-blue-500">{chartData[hoveredIndex].coupons}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--muted)] font-medium">Deals:</span>
              <span className="font-bold text-purple-500">{chartData[hoveredIndex].deals}</span>
            </div>
          </div>
        )}

        <svg className="w-full h-56 overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          <line x1="40" y1="40" x2="460" y2="40" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
          <line x1="40" y1="90" x2="460" y2="90" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
          <line x1="40" y1="140" x2="460" y2="140" stroke="var(--border)" strokeWidth="1" />

          {/* Vertical indicator guide */}
          {hoveredIndex !== null && (
            <line
              x1={cPoints[hoveredIndex].x}
              y1={20}
              x2={cPoints[hoveredIndex].x}
              y2={140}
              stroke="var(--color-primary)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.4"
            />
          )}

          {/* Fill areas */}
          <path d={getFillPath(cPoints)} fill="url(#cGrad)" />
          <path d={getFillPath(dPoints)} fill="url(#dGrad)" />

          {/* Curves */}
          <path d={getCurvePath(cPoints)} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
          <path d={getCurvePath(dPoints)} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />

          {/* Nodes */}
          {chartData.map((d, i) => (
            <g key={i}>
              <text x={40 + i * (420 / 6)} y="165" textAnchor="middle" className="text-[10px] font-bold fill-[var(--muted)]">
                {d.label}
              </text>
              <circle
                cx={cPoints[i].x}
                cy={cPoints[i].y}
                r={hoveredIndex === i ? "5" : "3.5"}
                fill="#3b82f6"
                stroke="var(--surface)"
                strokeWidth="1.5"
                className="transition-all duration-150"
              />
              <circle
                cx={dPoints[i].x}
                cy={dPoints[i].y}
                r={hoveredIndex === i ? "5" : "3.5"}
                fill="#a855f7"
                stroke="var(--surface)"
                strokeWidth="1.5"
                className="transition-all duration-150"
              />
            </g>
          ))}

          {/* Transparent Hover Hit Boxes */}
          {chartData.map((d, i) => {
            const x = 40 + i * (420 / 6);
            return (
              <rect
                key={i}
                x={x - 30}
                y={10}
                width={60}
                height={140}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>
      </div>
    </Card>
  );
}
