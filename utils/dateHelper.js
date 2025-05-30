exports.hasDayPassed = (lastClaimed) => {
  const now = new Date();
  const lastDate = new Date(lastClaimed);
  return now.getDate() !== lastDate.getDate() || now - lastDate >= 86400000;
};
