import findUp from 'find-up';
import symbols from 'log-symbols';
import ftp from './ftp';
import { sync, rm } from './commands';
import { argv } from 'yargs';
import log from './logger';
import {read} from './fs';
import {exec, spawn} from './cp';

const rcFile = '.ljsyncrc';

class Options {
  constructor() {
    this.mode = 'rsync';
    this.remote = '/home/tmp';
    this.host = 'hostname';
    this.ftpHost = 'example.com';
    this.user = 'username';
    this.password = 'passw0rd';
    this.git = {branch: 'master'};
    this.chokidar = { interval: 3e2, ignoreInitial: !0, ignored: [ '*node_modules*', '*.git*' ] };
  }

  async init () {
    let opts = await this.readCfg(rcFile);

    for (let key in opts)
      this[key] = opts[key];
    for (let key in argv)
      this[key] = argv[key];

    this.banner();
    if (this.mode === 'ftp')
      await this.initFtp();
    await this.touch();
  }

  async initFtp () {
    try {
      let banner = await ftp.connect({
        host: this.ftpHost,
        user: this.user,
        password: this.password,
        autoReconnect: true,
        keepalive: 1e4,
        preserveCwd: true
      });
      log(symbols.info, 'FTP connected', banner);
    } catch (e) {
      log(symbols.error, 'Can\'t connect to FTP', e)
      log(symbols.warning, 'Using slow Rsync mode');
      this.mode = 'rsync';
    }
  }

  async readCfg (path) {
    var json;
    try {
      let file = await findUp(path);
      if (!file) {
        return {};
      }
      let content = await read(file)
      json = JSON.parse(content);
    } catch (e) {
      log(e.stack);
    }
    return json || {};
  }

  async touch () { // force sync diff files
    let diff = await exec('git diff ' + this.git.branch + ' --name-status | colrm 1 3 | xargs');
    let status = await exec('git status -s | colrm 1 3 | xargs');
    let space = /\s/;
    let files = diff.split(space).filter(Boolean).concat(status.split(space).filter(Boolean));
    files.forEach(sync);
  }


  banner () {
    log(`watch path`,` ${process.cwd()}/**`);
    log(`host`,` ${this.host}`);
    log(`remote path`,` ${this.remote}`);
    log(`git-branch`,` ${this.git.branch}`);
    log(`chkd-interval`,` ${this.chokidar.interval}ms`);
    log(`chkd-ignoreInitial`,` ${this.chokidar.ignoreInitial}`);
    log(`chkd-ignored`,` ${this.chokidar.ignored.join()}`);
  }
}

export default new Options();
