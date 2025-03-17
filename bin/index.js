#! /usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const gitClone = require('git-clone');
const figlet = require('figlet');
const fs = require('fs-extra');
const path = require('path');
const { gitInit } = require('../src/git');
const { checkFileIsExist, removeFile, createFilePath } = require('../src/file');
const pkg = require('../package.json');

const program = new Command();

program
  .name('vita-create-app')
  .usage('<command> [options]')

// version
program.version(`
${chalk.green(figlet.textSync('vita', {
  font: "Standard",
  horizontalLayout: "default",
  verticalLayout: "default",
  width: 80,
  whitespaceBreak: true,
}))}
${chalk.green(pkg.version)}
`);

// 给help信息添加提示
program.on('--help', () => {
  console.log(`Run the ${chalk.yellow('help')} commond`)
})

// 出错后展示帮助信息
program.showHelpAfterError('(add --help for additional information)');

/** 添加命令 */
program
  .command('create <projectName>')
  .description('create a new project')
  .action(async function(name, options, command) {
    const filePath = createFilePath(name);
    // 判断是否已存在项目文件名
    if (checkFileIsExist(name)) {
      const answers = await inquirer.prompt([
        { type: 'confirm', message: '已存在当前文件，确认是否覆盖原文件?', default: true, name: 'overwrite' }
      ])
      
      if (answers.overwrite) {
        removeFile(name);
        console.log(chalk.green('删除成功'))
      } else {
        // 提示用户输入新的文件夹名称
        let newFolderName = name;
        let valid = false;

        while (!valid) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'name',
              message: '请输入一个新的文件夹名称：',
              validate: (input) => {
                if (!input) {
                  return '文件夹名称不能为空！';
                }
                if (checkFileIsExist(input)) {
                  return '该文件夹名称已存在！请重新输入。';
                }
                return true;
              },
            },
          ]);

          newFolderName = answers.name;
          valid = true;

          // 检查新的文件夹名称是否已存在
          if (checkFileIsExist(newFolderName)) {
            valid = false;
          }
        }
      }
    }

    const projectList = {
      'react&ts': 'git@github.com:vita-long/reactjs-template.git',
      'react&js': ''
    }

    // 新建
    const res = await inquirer.prompt([
      {
        type: 'list',
        message: '请选择项目类型',
        name: 'type',
        choices: [
          { name: 'react', value: 'react' },
          { name: 'vue', value: 'vue' }
        ]
      },
      {
        type: 'list',
        message: '请选择开发语言',
        name: 'language',
        choices: [
          { name: 'typescript', value: 'ts' },
          { name: 'javascript', value: 'js' }
        ]
      },
      {
        type: 'list',
        message: '请选择包管理工具',
        name: 'tool',
        choices: [
          { name: 'pnpm', value: 'pnpm' },
          { name: 'yarn', value: 'yarn' },
          { name: 'npm', value: 'npm' },
        ]
      }
    ])

    const key = res.type + `&${res.language}`;
    if (!projectList[key]) {
      console.log(`当前暂未查询到项目类型，请重新选择`);
      process.exit(1);
    }
    const spinner = ora('下载中...').start();
    gitClone(projectList[key], name, async function(err) {
      if (err) {
        spinner.fail('下载失败');
      } else {
        await changePackageJson(name);
        spinner.succeed('下载成功');
        fs.remove(path.resolve(filePath, '.git'));
        await gitInit();
        console.log('Done! Now run:');
        console.log(chalk.green(` cd ${name}`));
        console.log(chalk.green(` ${res.tool} install`));
        console.log(chalk.green(` ${res.tool} start`));
      }
    })
  })
// 修改package.json中的内容
function changePackageJson(name) {
  return new Promise((resolve, reject) => {
    const filePath = path.resolve(process.cwd(), name, 'package.json');
    fs.readFile(filePath, 'utf-8', function(err, data) {
      if (err) {
        reject(err);
      }
      const pkgJson = JSON.parse(data);
      pkgJson.name = name;
      pkgJson.description = 'description';
      fs.writeFile(filePath, JSON.stringify(pkgJson, null, 2), 'utf-8', function(err) {
        if (err) {
          reject(err);
        }
        resolve()
      })
    })
  })
}


program.parse(process.argv);
