// Mock for chalk to avoid ES module issues in Jest
const mockChalk = {
  red: (text) => text,
  green: (text) => text,
  blue: (text) => text,
  yellow: (text) => text,
  cyan: (text) => text,
  magenta: (text) => text,
  white: (text) => text,
  gray: (text) => text,
  grey: (text) => text,
  black: (text) => text,
  bold: (text) => text,
  dim: (text) => text,
  italic: (text) => text,
  underline: (text) => text,
  strikethrough: (text) => text,
  inverse: (text) => text,
  bgRed: (text) => text,
  bgGreen: (text) => text,
  bgBlue: (text) => text,
  bgYellow: (text) => text,
  bgCyan: (text) => text,
  bgMagenta: (text) => text,
  bgWhite: (text) => text,
  bgBlack: (text) => text,
};

// Chain methods for things like chalk.red.bold
Object.keys(mockChalk).forEach(key => {
  mockChalk[key] = Object.assign(mockChalk[key], mockChalk);
});

module.exports = mockChalk;
module.exports.default = mockChalk;