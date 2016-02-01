import colors from 'colors';

export default function logger (...args) {
  let d = new Date;
  let [_, day, time] = d.toString().match(/\w+\s(\w+\s\d+)\s\d+\s([\d:]+)/);
  let ms = d.getMilliseconds();
  if (args.length) console.log([`${time}`.gray.dim, ...args].join(' '));
}
