import rough from 'roughjs';
import { SystemNode, ComponentType } from '../types/system';

export interface RoughShapeOptions {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  roughness?: number;
  bowing?: number;
  fillStyle?: 'solid' | 'hachure' | 'zigzag' | 'cross-hatch' | 'dots';
}

export const COMPONENT_COLORS_LIGHT: Record<
  ComponentType,
  { bg: string; border: string; accent: string }
> = {
  client: { bg: '#e0f2fe', border: '#0284c7', accent: '#0369a1' },
  cdn_edge: { bg: '#ede9fe', border: '#7c3aed', accent: '#6d28d9' },
  api_gateway: { bg: '#fef3c7', border: '#d97706', accent: '#b45309' },
  load_balancer: { bg: '#ffedd5', border: '#ea580c', accent: '#c2410c' },
  service: { bg: '#ecfdf5', border: '#059669', accent: '#047857' },
  llm_server: { bg: '#fae8ff', border: '#c026d3', accent: '#a21caf' },
  rag_pipeline: { bg: '#f3e8ff', border: '#9333ea', accent: '#7e22ce' },
  mcp_server: { bg: '#fce7f3', border: '#db2777', accent: '#be185d' },
  vector_db: { bg: '#e0e7ff', border: '#4f46e5', accent: '#3730a3' },
  cache: { bg: '#fee2e2', border: '#dc2626', accent: '#b91c1c' },
  database: { bg: '#dcfce7', border: '#16a34a', accent: '#15803d' },
  message_queue: { bg: '#fef9c3', border: '#ca8a04', accent: '#a16207' },
  worker: { bg: '#f1f5f9', border: '#475569', accent: '#334155' },
  storage: { bg: '#e2e8f0', border: '#64748b', accent: '#475569' },
  region_zone: { bg: '#f8fafc', border: '#94a3b8', accent: '#64748b' },
  generic: { bg: '#f8fafc', border: '#64748b', accent: '#475569' },
};

export const COMPONENT_COLORS_DARK: Record<
  ComponentType,
  { bg: string; border: string; accent: string }
> = {
  client: { bg: '#082f49', border: '#38bdf8', accent: '#0ea5e9' },
  cdn_edge: { bg: '#2e1065', border: '#a855f7', accent: '#c084fc' },
  api_gateway: { bg: '#451a03', border: '#fbbf24', accent: '#f59e0b' },
  load_balancer: { bg: '#431407', border: '#fb923c', accent: '#f97316' },
  service: { bg: '#064e3b', border: '#34d399', accent: '#10b981' },
  llm_server: { bg: '#3b0764', border: '#e879f9', accent: '#d946ef' },
  rag_pipeline: { bg: '#312e81', border: '#a78bfa', accent: '#8b5cf6' },
  mcp_server: { bg: '#500724', border: '#f472b6', accent: '#ec4899' },
  vector_db: { bg: '#1e1b4b', border: '#818cf8', accent: '#6366f1' },
  cache: { bg: '#450a0a', border: '#f87171', accent: '#ef4444' },
  database: { bg: '#052e16', border: '#4ade80', accent: '#22c55e' },
  message_queue: { bg: '#422006', border: '#facc15', accent: '#eab308' },
  worker: { bg: '#1e293b', border: '#94a3b8', accent: '#cbd5e1' },
  storage: { bg: '#0f172a', border: '#64748b', accent: '#94a3b8' },
  region_zone: { bg: '#18181b', border: '#52525b', accent: '#71717a' },
  generic: { bg: '#18181b', border: '#71717a', accent: '#a1a1aa' },
};

export function renderSketchyNode(
  rc: ReturnType<typeof rough.svg>,
  node: SystemNode,
  isSelected: boolean,
  status: 'healthy' | 'warning' | 'critical' | 'dead' = 'healthy',
  isDark: boolean = false
): SVGElement {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const { x, y, width, height, type } = node;
  const palette = isDark ? COMPONENT_COLORS_DARK : COMPONENT_COLORS_LIGHT;
  const colors = palette[type] || palette.service;

  let borderColor = isSelected ? (isDark ? '#60a5fa' : '#2563eb') : colors.border;
  let strokeWidth = isSelected ? 2.5 : 1.6;
  let fillColor = node.customColor || colors.bg;

  if (status === 'critical') {
    borderColor = '#ef4444';
    fillColor = isDark ? '#450a0a' : '#fee2e2';
  } else if (status === 'warning') {
    borderColor = '#f59e0b';
    fillColor = isDark ? '#451a03' : '#fef3c7';
  } else if (status === 'dead') {
    borderColor = isDark ? '#52525b' : '#6b7280';
    fillColor = isDark ? '#27272a' : '#f3f4f6';
  }

  const roughOpts: RoughShapeOptions = {
    fill: fillColor,
    fillStyle: 'solid',
    stroke: borderColor,
    strokeWidth,
    roughness: 0.9,
    bowing: 1.0,
  };

  // Cylinder for Databases and Vector DBs
  if (type === 'database' || type === 'vector_db' || type === 'cache') {
    const rx = width / 2;
    const ry = 14;
    // Base body
    const bodyPath = `M ${x} ${y + ry} L ${x} ${y + height - ry} A ${rx} ${ry} 0 0 0 ${
      x + width
    } ${y + height - ry} L ${x + width} ${y + ry} Z`;
    const bodyElem = rc.path(bodyPath, roughOpts);
    // Top ellipse
    const topElem = rc.ellipse(x + rx, y + ry, width, ry * 2, {
      ...roughOpts,
      fill: fillColor,
    });
    group.appendChild(bodyElem);
    group.appendChild(topElem);
  } else if (type === 'cdn_edge') {
    // Cloud-like shape for CDN
    const cloudPath = `
      M ${x + 20} ${y + height - 10}
      A 18 18 0 0 1 ${x + 20} ${y + 25}
      A 25 25 0 0 1 ${x + width / 2} ${y + 10}
      A 28 28 0 0 1 ${x + width - 20} ${y + 20}
      A 20 20 0 0 1 ${x + width - 10} ${y + height - 10}
      Z
    `;
    const cloud = rc.path(cloudPath, roughOpts);
    group.appendChild(cloud);
  } else if (type === 'generic') {
    // Square box for Generic Components
    const square = rc.rectangle(x, y, width, height, {
      ...roughOpts,
      roughness: 0.7,
      bowing: 0.5,
    });
    group.appendChild(square);
  } else {
    // Rounded clean rectangle for Services, LLMs, Gateways, Clients
    const rect = rc.rectangle(x, y, width, height, roughOpts);
    group.appendChild(rect);
  }

  // Draw selection bounding ring if selected
  if (isSelected) {
    const selRing = rc.rectangle(x - 5, y - 5, width + 10, height + 10, {
      stroke: isDark ? '#60a5fa' : '#3b82f6',
      strokeWidth: 1.5,
      roughness: 0.6,
      fill: 'none',
      strokeLineDash: [4, 4],
    });
    group.appendChild(selRing);
  }

  return group;
}

export function renderSketchyArrow(
  rc: ReturnType<typeof rough.svg>,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  isHot: boolean = false,
  isRedundant: boolean = false,
  isDark: boolean = false
): SVGElement {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const defaultStroke = isDark ? '#94a3b8' : '#374151';
  const strokeColor = isHot ? '#ef4444' : isRedundant ? '#c084fc' : defaultStroke;

  // Arrow line
  const line = rc.line(x1, y1, x2, y2, {
    stroke: strokeColor,
    strokeWidth: isHot ? 2.8 : 2,
    roughness: 0.9,
    strokeLineDash: isRedundant ? [5, 4] : undefined,
  });
  group.appendChild(line);

  // Arrowhead at (x2, y2)
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 13;
  const arrowAngle = Math.PI / 7;

  const ax1 = x2 - headLen * Math.cos(angle - arrowAngle);
  const ay1 = y2 - headLen * Math.sin(angle - arrowAngle);
  const ax2 = x2 - headLen * Math.cos(angle + arrowAngle);
  const ay2 = y2 - headLen * Math.sin(angle + arrowAngle);

  const head = rc.polygon(
    [
      [x2, y2],
      [ax1, ay1],
      [ax2, ay2],
    ],
    {
      fill: strokeColor,
      fillStyle: 'solid',
      stroke: strokeColor,
      strokeWidth: 1.5,
      roughness: 0.6,
    }
  );
  group.appendChild(head);

  return group;
}

export function renderSketchySticky(
  rc: ReturnType<typeof rough.svg>,
  x: number,
  y: number,
  width: number,
  height: number,
  bgColor: string = '#fef08a',
  isDark: boolean = false
): SVGElement {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  // Shadow
  const shadow = rc.rectangle(x + 4, y + 4, width, height, {
    fill: isDark ? '#18181b' : '#e5e7eb',
    fillStyle: 'solid',
    stroke: 'none',
    roughness: 0.6,
  });

  const bodyBg = isDark ? '#27272a' : bgColor;
  const borderCol = isDark ? '#eab308' : '#ca8a04';

  const body = rc.rectangle(x, y, width, height, {
    fill: bodyBg,
    fillStyle: 'solid',
    stroke: borderCol,
    strokeWidth: 1.2,
    roughness: 0.9,
  });
  group.appendChild(shadow);
  group.appendChild(body);
  return group;
}
