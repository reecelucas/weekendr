const dateFormat = require('dateformat');

const addMonths = (date, months) =>
  new Date(date.setMonth(date.getMonth() + months));

const getFormattedDateString = unixTimestamp =>
  dateFormat(new Date(unixTimestamp * 1000), 'mmmm dS (ddd), yyyy, h:MM TT');

module.exports = {
  addMonths,
  getFormattedDateString
};
