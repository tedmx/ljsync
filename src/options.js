import findUp from 'find-up';
import {inspect} from 'util';
import symbols from './symbols';
import ftp from './ftp';
import { sync, rm } from './commands';
import { argv } from 'argh';
import log from './logger';
import {version, read} from './fs';
import {exec, spawn} from './cp';
import {option} from './decorators';

const rcFile = '.ljsyncrc';

@option('help', false, 'show this help and exit immediately. ' + 'Default: false'.yellow)
@option('maxErrors', 30, 'after this number of errors/no-errors debugging will auto turn on/off. ' + 'Default: 30'.yellow)
@option('debug', false, 'show extensive debugging info. ' + 'Default: false'.yellow)
@option('notify', false, 'display critical notifications in osx notification center.' + ' Default: false'.yellow)
@option('no-git', false, 'do not sync files that has diff to git:branch.' + ' Default: false'.yellow)
@option('dry-run', false, 'do not perform any network operations, just pretend to. ' + 'Default: false'.yellow)
@option('ftpHost', 'example.com', 'remote ftp hostname to connect through sftp to. ' + 'Default: example.com'.yellow)
@option('remote', '/home/tmp', 'remote folder to sync changes to.' + ' Default: /home/tmp'.yellow)
@option('password', 'passw0rd', 'user\'s password from sftp account. ' + 'Default: passw0rd'.yellow)
@option('user', 'username', 'sftp username. ' + 'Default: username')
@option('host', 'hostname', 'remote machine to sync files to.' + ' Default: hostname'.yellow)
@option('mode', 'rsync', 'use fast sftp over ssh or slow rsync for file operations.' + ' Default: rsync'.yellow)
class Options {
  constructor() {
    this.git = {branch: 'master'};
    this.chokidar = { interval: 3e2, ignoreInitial: !0, ignored: [ '*node_modules*', '*.git*' ] };
  }

  async init () {
    log.debug('reading file rcFile');
    let opts = await this.readCfg(rcFile);

    for (let key in opts)
      this[key] = opts[key];
    for (let key in argv)
      this[key] = argv[key];

    log.debug('getting package version');
    this.version = await version();

    this.showHelp();
    if (this.help)
      process.exit()

    this.banner();
    if (this.mode === 'ftp')
      await this.initFtp();
    if (!this['no-git'])
      await this.touch();
  }

  showHelp () {
    console.log('LiveJournal sync tool'.bold, `v${this.version}\n`)
    for (let key in this) {
      let {value, text} = this[key];
      if (text) console.log((`\t--${key}`).blue + ' = '.gray + (`${value}`).green + ' -- '.gray + (`${text}`));
    }
    console.log('\n\n')
  }

  async initFtp () {
    log.debug('init ftp started');
    try {
      let banner = await ftp.connect({
        host: this.ftpHost,
        user: this.user,
        password: this.password,
        autoReconnect: true,
        keepalive: 1e4,
        preserveCwd: true
      });
      log.info('FTP connected', banner);
    } catch (e) {
      log.error('Can\'t connect to FTP', e)
      log.warning('Using slow Rsync mode');
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
      log.error(e.stack);
    }
    return json || {};
  }

  async touch () { // force sync diff files
    log.debug('touching git files');
    let diff = await exec('git diff ' + this.git.branch + ' --name-status | colrm 1 3 | xargs');
    let status = await exec('git status -s | colrm 1 3 | xargs');
    let space = /\s/;
    let files = diff.split(space).filter(Boolean).concat(status.split(space).filter(Boolean));
    log.debug('files touched', files);
    files.forEach(sync);
  }


  banner () {
    Object.keys(this)
    .forEach(k => log(`${k}: ${inspect(this[k], {colors: true, depth: Infinity})}`));
  }
}

export default new Options();
