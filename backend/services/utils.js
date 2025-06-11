const moment = require('moment');

function isOnTime(attendance, today) {
  const clockInTime = new Date(`${attendance.date} ${attendance.clockIn}`);
  const startTime = new Date(`${attendance.date} 07:45 AM`);
  const endTime = new Date(`${attendance.date} 08:00 AM`);
  
  const isStartTimeGreater = moment(clockInTime).isSameOrAfter(moment(startTime));
  const isClockInTimeLessThanOrEqual = moment(clockInTime).isSameOrBefore(moment(endTime));
  
  return isStartTimeGreater && isClockInTimeLessThanOrEqual;
}

function isAbsent(attendance) {
  return !attendance.clockIn;
}

function isEarlyDeparture(attendance) {
  const clockOutTime = attendance.clockOut ? new Date(`${attendance.date} ${attendance.clockOut}`) : null;
  const earlyDepartureTime = new Date(`${attendance.date} 12:00 PM`);
  
  return clockOutTime && moment(clockOutTime).isSameOrBefore(moment(earlyDepartureTime));
}

function isTimeOff(attendance) {
  return !attendance.clockIn && (attendance.leaveType === "FULL_LEAVE");
}

module.exports = { isOnTime, isAbsent, isEarlyDeparture, isTimeOff };
