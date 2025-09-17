exports.combineDateTime = (date, time) => {
  // date: "2025-09-20"
  // time: "14:30"
  const isoString = new Date(`${date}T${time}:00Z`).toISOString();
  return isoString; // "2025-09-20T14:30:00.000Z"
};
