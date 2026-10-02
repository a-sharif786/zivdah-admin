import type { CSSProperties } from 'react';

/**
 * Shared Recharts styling for every dashboard/analytics chart: muted axes, faint grid,
 * and a frosted-glass tooltip. Pair with the `.recharts-*` rules in index.css.
 */
export function getChartStyle(isDark: boolean) {
  const axisColor = isDark ? 'rgba(226,232,240,0.5)' : 'rgba(15,23,42,0.45)';
  const gridColor = isDark ? 'rgba(148,163,184,0.1)' : 'rgba(15,23,42,0.06)';
  const tooltipStyle: CSSProperties = {
    background: isDark ? 'rgba(17,24,39,0.88)' : 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(8px)',
    border: `1px solid ${isDark ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.08)'}`,
    borderRadius: 12,
    boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.5)' : '0 12px 32px -8px rgba(15,23,42,0.22)',
    padding: '10px 14px',
    fontSize: 13,
  };
  const tooltipLabelStyle: CSSProperties = {
    color: isDark ? '#f1f5f9' : '#0f172a',
    fontWeight: 700,
    marginBottom: 4,
  };
  return { axisColor, gridColor, tooltipStyle, tooltipLabelStyle };
}
