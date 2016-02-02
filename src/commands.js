import rsync from 'rsync';
import node_path from 'path';
import cp from 'child_process';
import {spawn} from './cp';
import {join} from 'path';
import {Executor} from './executor';
import opts from './options';
import log from './logger';
import ftp from './ftp';
import colors from 'colors';

const ex = new Executor();

export async function rmDir (path) {
  let command = `'rm\ -rf\ ${opts.remote}/${path}'`;
  ex.push({
    path,
    type: 'rmDir',
    name: 'rmDir '+path,
    priority: 9,
    message: [ 'rmDir'.red, path ].join(' '),
    fn: () => new Promise((res, rej) => {
      function oldSchoolSync () {
        let ssh = cp.spawn('ssh', ['-tt', `${opts.host}`, 'bash', '-ic', command], { stdio: ['ignore', 'ignore', 'pipe'] });
        ssh.stderr.on('data', rej);
        ssh.on('close', code => { res(code) });
      }
      if (opts.mode === 'ftp' ) {
        ftp.rmdir(node_path.join(opts.remote, path)).then(res).catch(oldSchoolSync);
      } else {
        oldSchoolSync();
      }
    })
  });
}

export async function rm (path) {
  let command = `'rm\ -rf\ ${opts.remote}/${path}'`;
  ex.push({
    path,
    type: 'rm',
    name: 'rm '+path,
    priority: 10, // rm should always come first
    message: [ 'rm'.red, path ].join(' '),
    fn: () => new Promise((res, rej) => {
      function oldSchoolSync (e) {
        if (e && e.message === 'No such file') return rej(e);
        let ssh = cp.spawn('ssh', ['-tt', `${opts.host}`, 'bash', '-ic', command], { stdio: ['ignore', 'ignore', 'ignore'] });
        ssh.on('close', code => { res(code) });
      }
      if (opts.mode === 'ftp' ) {
        ftp.unlink(node_path.join(opts.remote, path)).then(res).catch(oldSchoolSync);
      } else {
        oldSchoolSync();
      }
    })
  });
}

export async function addDir (path) {
  let config = { flags: 'RplvPh', source: path, destination: `${opts.host}:${opts.remote}` };
  let command = rsync.build(config);
  ex.push({
    path,
    name: 'addDir '+path,
    type: 'addDir',
    priority: 2,
    message: [ 'addDir'.magenta, config.source ].join(' '),
    fn: () => new Promise((res, rej) => {
      let recursive = true;
      function oldSchoolSync () { command.execute( (err, code, cmd) => err ? rej(err) : res(code)) }
      if (opts.mode === 'ftp') {
        ftp.mkdir(node_path.join(opts.remote, path), recursive).then(res).catch(oldSchoolSync);
      } else {
        oldSchoolSync();
      }
    })
  });
}

export async function sync (path) {
  let match = path.match(/htdocs(.*\.js)$/);
  if (match && match.length && match[1]) {
    let min = join('htdocs/min', match[1]);
    await rm(min);
  }
  let config = { flags: 'RplvPh', source: path, destination: `${opts.host}:${opts.remote}` };
  let command = rsync.build(config);
  ex.push({
    path,
    name: 'sync '+path,
    type: 'sync',
    priority: 1,
    message: [ 'sync'.magenta, config.source ].join(' '),
    fn: () => new Promise((res, rej) => {
      function oldSchoolSync () { command.execute( (err, code, cmd) => err ? rej(err) : res(code)) }
      if (opts.mode === 'ftp') {
        ftp.put(path, node_path.join(opts.remote, path)).then(res).catch(oldSchoolSync);
      } else {
        oldSchoolSync();
      }
    })
  });
}
