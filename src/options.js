import findUp from 'find-up';
import {inspect} from 'util';
import symbols from './symbols';
import ftp from './ftp';
import { sync, rm } from './commands';
import { argv } from 'argh';
import log from './logger';
import {version, read} from './fs';
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

    this.version = await version();

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
    Object.keys(this)
    .forEach(k => log(`${k}: ${inspect(this[k], {colors: true, depth: Infinity})}`));
  }
}

export default new Options();
