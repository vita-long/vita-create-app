const fs = require('fs-extra');
const path = require('path');

function createFilePath(name) {
  return path.resolve(process.cwd(), name);
}

function checkFileIsExist(name) {
  const filePath = createFilePath(name);
  return fs.existsSync(filePath);
}

function removeFile(name) {
  const filePath = createFilePath(name);
  fs.remove(filePath);
}

module.exports = {
  createFilePath,
  checkFileIsExist,
  removeFile
};