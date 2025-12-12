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