export function calculatePercentage(str: string | null | undefined) {
  if (!str) return null;
  
  const match = str.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return null;
  
  const percentage = (parseInt(match[1]) / parseInt(match[2])) * 100;
  return parseFloat(percentage.toFixed(0));
}
