export function formatCurrency(amount) {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '';
  }
  const formattedValue = `$${value.toFixed(2).replace('.00', '')}`;
  return formattedValue;
}
