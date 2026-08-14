export function formatCurrency(value: number | null | undefined, currency?: string | null): string {
  if (value === null || value === undefined) return '-';
  // default param (`currency = 'INR'`) only covers `undefined` — the API sends explicit
  // `null` for payments predating the currency column, so fall back with `??` instead.
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency ?? 'INR' }).format(value);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { dateStyle: 'medium' });
}
