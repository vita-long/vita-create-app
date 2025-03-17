
const { exec } = require('child_process');
function gitInit() {
  exec('git init', (error, stdout, stderr) => {
    if (error) {
      console.error(`执行出错: ${error}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
  });
}

module.exports = {
  gitInit
}