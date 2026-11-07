"use client";

import { useId, useState } from "react";
import type { DashboardPoint } from "@/types/api";
import {
  formatCountCompact,
  formatNaira,
  formatNairaCompact,
  formatNumber,
} from "@/lib/format";
import { cn } from "@/lib/cn";

interface SeriesChartProps {
  points: DashboardPoint[];
  kind: "count" | "currency";
  variant?: "area" | "bar";
  className?: string;
}

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { top: 16, right: 14, bottom: 30, left: 56 };
const PLOT_WIDTH = WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;
const TICKS = 4;

function niceCeiling(value: number) {
  if (value <= 0) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const fraction = value / magnitude;

  for (const step of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (fraction <= step) return step * magnitude;
  }

  return 10 * magnitude;
}

function xFor(index: number, count: number, variant: "area" | "bar") {
  if (variant === "bar" || count === 1) {
    return PADDING.left + ((index + 0.5) / count) * PLOT_WIDTH;
  }

  return PADDING.left + (index / (count - 1)) * PLOT_WIDTH;
}

export default function SeriesChart({
  points,
  kind,
  variant = "area",
  className,
}: SeriesChartProps) {
  const gradientId = useId();
  const [active, setActive] = useState<number | null>(null);

  const maxValue = Math.max(...points.map((point) => point.value), 0);
  const yMax = niceCeiling(maxValue * 1.1);
  const baseY = PADDING.top + PLOT_HEIGHT;
  const slot = PLOT_WIDTH / Math.max(points.length, 1);

  const coordinates = points.map((point, index) => ({
    x: xFor(index, points.length, variant),
    y: baseY - (point.value / yMax) * PLOT_HEIGHT,
    point,
  }));

  const linePath = coordinates
    .map(({ x, y }, index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const areaPath = coordinates.length
    ? `${linePath} L${coordinates[coordinates.length - 1].x.toFixed(1)},${baseY} L${coordinates[0].x.toFixed(1)},${baseY} Z`
    : "";

  const formatAxis = kind === "currency" ? formatNairaCompact : formatCountCompact;
  const formatFull = kind === "currency" ? formatNaira : formatNumber;

  // Never render more than six x-axis labels, always keeping the last bucket.
  const labelStep = Math.max(1, Math.ceil(points.length / 6));
  const activePoint = active === null ? null : coordinates[active];

  const tooltipWidth = 140;
  const tooltipHeight = 46;
  const tooltipX = activePoint
    ? Math.min(
        Math.max(activePoint.x - tooltipWidth / 2, PADDING.left),
        WIDTH - PADDING.right - tooltipWidth,
      )
    : 0;

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full touch-none"
        role="img"
        aria-label={`Chart with ${points.length} data points. Maximum value ${formatFull(maxValue)}.`}
        onMouseLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
      >
        {Array.from({ length: TICKS + 1 }).map((_, index) => {
          const value = (yMax / TICKS) * index;
          const y = baseY - (index / TICKS) * PLOT_HEIGHT;

          return (
            <g key={index}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y}
                y2={y}
                stroke="#E9ECEC"
                strokeWidth={index === 0 ? 1 : 1}
                strokeDasharray={index === 0 ? undefined : "3 4"}
              />
              <text
                x={PADDING.left - 10}
                y={y + 3}
                textAnchor="end"
                fontSize={9}
                fill="#6B6B6B"
              >
                {formatAxis(value)}
              </text>
            </g>
          );
        })}

        {variant === "area" ? (
          <>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#064C50" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#064C50" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradientId})`} />
            <path
              d={linePath}
              fill="none"
              stroke="#064C50"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        ) : (
          coordinates.map(({ x, y, point }, index) => {
            const barWidth = Math.max(3, slot * 0.55);
            const height = Math.max(baseY - y, 0);

            return (
              <rect
                key={point.key}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={height}
                rx={Math.min(4, barWidth / 2)}
                fill={active === index ? "#0B2E30" : "#064C50"}
                opacity={active === null || active === index ? 1 : 0.55}
              />
            );
          })
        )}

        {activePoint ? (
          <>
            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={PADDING.top}
              y2={baseY}
              stroke="#064C50"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.5}
            />
            {variant === "area" ? (
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={4.5}
                fill="#BCEB70"
                stroke="#064C50"
                strokeWidth={2}
              />
            ) : null}
            <g>
              <rect
                x={tooltipX}
                y={PADDING.top}
                width={tooltipWidth}
                height={tooltipHeight}
                rx={9}
                fill="#FFFFFF"
                stroke="#E9ECEC"
              />
              <text
                x={tooltipX + 10}
                y={PADDING.top + 17}
                fontSize={9}
                fill="#6B6B6B"
              >
                {activePoint.point.label}
              </text>
              <text
                x={tooltipX + 10}
                y={PADDING.top + 34}
                fontSize={12}
                fontWeight={600}
                fill="#111111"
              >
                {formatFull(activePoint.point.value)}
              </text>
            </g>
          </>
        ) : null}

        {coordinates.map(({ x, point }, index) => {
          const showLabel =
            index % labelStep === 0 || index === points.length - 1;

          return (
            <g key={`label-${point.key}`}>
              {showLabel ? (
                <text
                  x={x}
                  y={HEIGHT - 9}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#6B6B6B"
                >
                  {point.label}
                </text>
              ) : null}
              <rect
                x={x - slot / 2}
                y={PADDING.top}
                width={slot}
                height={PLOT_HEIGHT}
                fill="transparent"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                tabIndex={-1}
              >
                <title>
                  {point.label}: {formatFull(point.value)}
                </title>
              </rect>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
