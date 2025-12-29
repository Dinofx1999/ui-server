export function calculatePercentage(str: string | null | undefined) {
  if (!str) return null;
  
  const match = str.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return null;
  
  const percentage = (parseInt(match[1]) / parseInt(match[2])) * 100;
  return parseFloat(percentage.toFixed(0));
}

export function formatSecondsToTime(seconds : number) {
  const absSeconds = Math.abs(seconds);
  
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;
  
  const formatted = [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
  
  return seconds < 0 ? `-${formatted}` : formatted;
}

export function formatNewsMessage(newsArray:any) {
  if (!newsArray || newsArray.length === 0) {
    return "No news available";
  }

  return newsArray
    .map((item:any) => `[${item.timeLabel.trim()}] ${item.currency} | ${item.name}`)
    .join(' , ');
};

export function normalizeBrokerName(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

// export function calcAskPrice(bid: number, spread: number, digit: number) {
//   const point = Math.pow(10, -digit);
//   const ask = bid + spread * point;
//   return (ask.toFixed(digit));
// }

export function calcAskPrice(bid:any, spread:any, digit:any) {
   const _bid = Number(bid);
  const _spread = Number(spread);
  const _digit = Number(digit);

  if (!Number.isFinite(_bid) || !Number.isFinite(_spread) || !Number.isFinite(_digit)) {
    return null; // hoặc throw new Error("Invalid input")
  }

  const point = 10 ** (-_digit);
  const ask = _bid + _spread * point;

  // toFixed trả về string, nên parseFloat để ra number (hoặc giữ string tùy bạn)
  return Number(ask.toFixed(_digit));
}

export function formatDecimal(value: any, digit: number) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return num.toFixed(digit);
}