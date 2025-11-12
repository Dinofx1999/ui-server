export function calculatePercentage(str : any) { //Tính phần trăm từ chuỗi [x / y]
  const match = str.match(/\[(\d+)\s*\/\s*(\d+)\]/);
  if (!match) return null;
  
  const percentage = (parseInt(match[1]) / parseInt(match[2])) * 100;
  return parseFloat(percentage.toFixed(0));
}