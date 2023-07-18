/** "@dfkaye/safe-math"
 * https://github.com/dfkaye/safe-math
 * Safer floating-point math operations in JavaScript, to avoid binary-decimal
 * impedance mismatches.
 * 
 * Examples:
 * 1. Adding 0.1 + 0.2 should return 0.3 instead of 0.30000000000000004.
 * 2. Multiplying 0.1 * 0.1 should return 0.01 instead of 0.010000000000000002.
 * 3. Any value can be an object whose valueOf() method returns a numeric value,
 *    i.e., a functionally numeric value.
 * 
 * Library contains 4 internal helper functions:
 * 1. for extracting values from a series and ignoring non-numeric values,
 * 2. checking that a value is at least functionally numeric,
 * 3. expanding values to the largest integer string,
 * 4. ascending sort function, used by median.
 */

module.exports = {
    // operations
    add, minus, multiply, divide,
  }
  
  /**
   * @function add, for safely adding numbers.
   * 
   * @param  {...any} values
   * @returns {number} sum
   */
  function add(...values) {
    return getValues(...values).reduce(function (augend, addend) {
      var { left, right, exponent } = expand(augend, addend);
  
      return (left + right) / exponent;
    }, 0);
  }
  
  /**
   * @function minus, for safely subtracting numbers.
   * 
   * @param  {...any} values
   * @returns {number} difference
   */
  function minus(...values) {
    var numbers = getValues(...values);
    var first = numbers.shift()
  
    return numbers.reduce(function (minuend, subtrahend) {
      var { left, right, exponent } = expand(minuend, subtrahend);
  
      return (left - right) / exponent;
    }, first);
  }
  
  /**
   * @function multiply, for safely multiplying numbers.
   * 
   * @param  {...any} values
   * @returns {number} product
   */
  function multiply(...values) {
    return getValues(...values).reduce(function (multiplicand, multiplier) {
      var { left, right, exponent } = expand(multiplicand, multiplier);
  
      return (left * right) / (exponent * exponent);
    }, 1);
  }
  
  /**
   * @function divide, for safely dividing numbers.
   * 
   * @param  {...any} values
   * @returns {number} quotient
   */
  function divide(...values) {
    var numbers = getValues(...values);
    var first = numbers.shift()
  
    return numbers.reduce(function (dividend, divisor) {
      var { left, right } = expand(dividend, divisor);
  
      // exponent not needed
      return left / right;
    }, first);
  }

  function getValues(...values) {
    if (Array.isArray(values[0])) {
      values = values[0];
    }
  
    return values.filter(isNumeric)
  }
  
  /**
   * @function isNumeric, tests whether a given value is "functionally numeric,"
   * meaning Object(value).valueOf() returns a numeric value. Function removes
   * any formatting commas from string values before testing, and returns boolean
   * indicating the extracted value is not NaN, null, undefined, or an empty
   * string.
   * 
   * @param {*} a
   * @returns {boolean} 
   */
  function isNumeric(a) {

    var v = /^string/.test(typeof a)
      ? a.replace(/[,]/g, '').trim()
      : a;
  
    var reInvalid = /^(NaN|null|undefined|)$/;
  
    return !reInvalid.test(v);
  }
  
  /**
 * @function expand, accepts two parameters, coerces them to integers, and
 * returns an object containing the x & y integer pair, plus the exponent by
 * which to reduce the result of an operation on them to their original decimal
 * precision.
 *  
 * Example: given 1.23 and 1.234, function returns an object with 3 integers:
 * 
 *    left: 1230
 *    right: 1234
 *    exponent: 1000
 *
 * Originally part of gist at
 * https://gist.github.com/dfkaye/c2210ceb0f813dda498d22776f98d48a
 * 
 * @param {*} x 
 * @param {*} y
 * @returns {{ x: number, y: number, exponent: number }}
 */
function expand(x, y) {
    // Object(value).valueOf() trick for "functionally numeric" objects.
  
    x = Object(x).valueOf();
    y = Object(y).valueOf();
  
    // Format strings and convert into numbers.
  
    var reCommas = /[\,]/g
  
    if (typeof x == "string") {
      x = +x.toString().replace(reCommas, '');
    }
  
    if (typeof y == "string") {
      y = +y.toString().replace(reCommas, '');
    }
  
    // https://github.com/dfkaye/safe-math/issues/1
    // Special case: Given very small numbers, the runtime may convert the value
    // to scientific notation. For example, 0.0000000000186264514923095703125 is 
    // converted to 1.862645149230957e-11. In that case we set left and right to
    // x and y respectively, and set d the exponent to 1, and return early.
  
    var sX = x.toString()
    var sY = y.toString()
    var mX = sX.split('.')[1] || ""
    var mY = sY.split('.')[1] || ""
    var dX = mX.split('e-')
    var dY = mY.split('e-')
  
    if (dX[1] || dY[1]) {
      return {
        left: x,
        right: y,
        exponent: 1
      }
    }
  
    // Main case: determine exponent based on largest mantissa length.
  
    var a = mX.length
    var b = mY.length
    var c = a > b ? a : b
    var d = Math.pow(10, c)
  
    /*
     * Expand x and y to integer values multiplying by exponent, converting
     * non-numeric values to their numeric equivalent, AND passing conversions to
     * the parseInt() function.
     * 
     * Some examples:
     *  {} becomes NaN,
     *  true becomes 1,
     *  [4] becomes '4' which becomes 4,
     * and so on. 
     * 
     * Why parseInt()?
     *  Because, for example, .14 * 100 still produces 14.000000000000002.
     * 
     * Why the self equality checks?
     *  Those are !NaN checks. parseInt(Infinity) returns NaN
     */
  
    var left = parseInt(x * d);
    var right = parseInt(y * d);
  
    return {
      left: left === left ? left : x * d,
      right: right === right ? right : y * d,
      exponent: d
    }
  }