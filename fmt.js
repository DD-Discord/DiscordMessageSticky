const { dbSerialize } = require("./db");

const WHITESPACE_REGEX = /\s+/g;

/**
 * @param {string} value 
 */
function sanitizeWhitespace(value) {
  return value.replaceAll(WHITESPACE_REGEX, ' ');
}
module.exports.sanitizeWhitespace = sanitizeWhitespace;

/**
 * @param {string} value 
 * @param {number} maxLength 
 */
function maxLength(value, maxLength) {
  if (value.length > maxLength) {
    value = value.substring(0, maxLength);
    value += ' […]';
  }
  return value;
}
module.exports.maxLength = maxLength;

/**
 * Wraps the given value in a code block. Might return a single or multi line code block dependong on usage.
 * @param {any} value The value to wrap in code. If it is not a string it will be serialized.
 * @param {{maxLength?: number, language?: string, forceLine?: "single" | "multi"}?} opts Additional options for formatting.
 * @returns {string} The formatting string.
 */
function wrapInCode(value, opts = null) {
  let lang = opts?.language;
  if (value === undefined) {
    value = 'undefined';
  } else if (typeof value !== 'string') {
    value = dbSerialize(value);
    if (!lang) {
      lang = 'json';
    }
  }
  value = maxLength(value, opts?.maxLength ?? 1500);
  if (opts?.forceLine !== "single" && (opts?.forceLine === "multi" || value.includes('\n'))) {
    return '```' + (lang ?? '') + '\n' + value + '\n```';
  } else {
    return '`' + value + '`';
  }
}
module.exports.wrapInCode = wrapInCode;

const COLOR = {
  RESET: '\x1b[0m',
  DIM: "\x1b[2m",
  FG_MAGENTA: "\x1b[35m"
}
module.exports.COLOR = COLOR;
