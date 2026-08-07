export function formatCurrency(value: number | null | undefined, currency = 'INR'): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(value);
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
