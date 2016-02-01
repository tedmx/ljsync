import log from './logger';
import {stat} from './fs';
import symbols from 'log-symbols';

export class Executor {

  constructor () {
    this.queue = [];
    this.set = new Set();
    this.errors = {};
    this.run();
  }

  push (task) {
    if (!this.set.has(task.name)) {
      log(symbols.info, 'enqueue'.cyan, task.name);
      this.set.add(task.name);
      this.queue.push(task);
    }
  }

  async run () {
    var task;

    this.sort();

    if (!this.queue.length)
      return setTimeout(::this.run, 42);

    task = this.queue.shift();
    this.set.delete(task.name);

    try {
      let time = Date.now();
      await task.fn();
      log(`${Date.now()-time}ms`.bgBlack.white, symbols.success, task.message);
    } catch (e) {
      await this.handleError(e, task);
    }

    this.run();
  }

  async handleError (e, task) {
    let exist = await stat(task.path);

    if ((!exist && task.type === 'sync') || (e.message === 'No such file'))
      return log(symbols.warning, '404 Not Found'.yellow, 'while', task.message);

    log(symbols.error, task.name, e.stack);

    if (!this.errors[task.name])
      this.errors[task.name] = 1;
    else
      this.errors[task.name]++;

    if (this.errors[task.name] >= 2) // too much errors for this task
      return this.errors[task.name] = 0;

    this.push(task); // retry
  }

  sort () {
    this.queue = this.queue.sort((a, b) => b.priority - a.priority);
  }

}
