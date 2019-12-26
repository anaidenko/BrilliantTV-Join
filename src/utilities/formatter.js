export function formatCurrency(amount) {
  const value = Number(amount);
  if (Number.isNaN(value)) {
    return '';
  }
  return `$${value.toFixed(2).replace('.00', '')}`;
}
