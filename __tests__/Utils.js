const path = require('path');
const fs = require('fs');

/**
 * Eval a JS source to be used in tests
 * Since GAS doesn't use modules, we need to eval the source
 *
 * @param {string} filePath - Relative path to the file from __tests__ directory
 */
function evalSource(filePath) {
    const sourceCode = fs.readFileSync(
        path.join(__dirname, filePath),
        'utf8'
    );
    global.eval(sourceCode);
}

module.exports={
    evalSource,
}
