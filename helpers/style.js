// Basic tagged template literal to generate a style string from
// a string literal. Doesn't support expressions.
module.exports = strings =>
  strings.reduce((acc, string) => (acc += string), '').replace(/\s/g, '');
