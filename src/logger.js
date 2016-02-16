import colors from 'colors';
import symbols from './symbols';
import options from './options';

export default function logger (...args) {
  let d = new Date;
  let [_, day, time] = d.toString().match(/\w+\s(\w+\s\d+)\s\d+\s([\d:]+)/);
  let ms = d.getMilliseconds();
  if (args.length) console.log([`${time}`.gray.dim, ...args].join(' '));
}

logger.debug = function debug (...args) {
  options.debug && this(symbols.debug, ...args);
}

logger.info = function info (...args) {
  this(symbols.info, ...args);
}

logger.success = function success (...args) {
  this(symbols.success, ...args);
}

logger.warning = function warning (...args) {
  this(symbols.warning, ...args);
}

logger.error = function error (...args) {
  this(symbols.error, ...args);
}
