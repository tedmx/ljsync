import fs from 'fs';
import inquirer from 'inquirer';

const defaultConf = {
  "host": "hostname",
  "remote": "/home/tmp",
  "git": {
    "branch": "master",
  },
  "chokidar": {
    "interval": 3e2,
    "ignoreInitial": true,
    "ignored": [
      "**/node_modules/**",
      "**/htdocs/min/**",
      "**/.git/**",
      "**/*.swp",
      "**/*.swo"
    ]
  }
};

const questions = [
  {
    type: 'input',
    name: 'host',
    message: 'Hostname to connect to',
    'default': 'host'
  },
  {
    type: 'input',
    name: 'remote',
    message: 'Remote folter to sync with',
    'default': '/home/tmp'
  },
  {
    type: 'input',
    name: 'git',
    message: 'Which git branch should be used for diff',
    'default': 'master',
    filter: branch => ({ branch })
  }
 ];

export default init;

function init (cb) {
  return (process.argv[3] === '--force' || process.argv[3] === '-f') ?
  null :
  inquirer.prompt(questions, onAnswers.bind(null, cb));
}

function onAnswers (cb, answers) {
  let conf = JSON.stringify(Object.assign({}, defaultConf, answers));

  fs.writeFileSync('.ljsyncrc', conf, {encoding:'utf8'});
  console.log('initialized .ljsyncrc:\n', conf);
  cb();
}
