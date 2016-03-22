export function option (key, value, text) {
  return function _decorator (classConstructor) {
    let re = /Options\.showHelp/g;
    Object.defineProperty(classConstructor.prototype, key, {
      get: () => {
        let stack = '';
        try {
          throw Error()
        } catch (e) {
          stack = e.stack
        }
        let showHelp = stack
          .split('\n')
          .slice(3)
          .filter(::re.test)
          .filter(Boolean)
          .length;
        return showHelp ? {value, text} : value;
      },
      set: val => value = val,
      enumerable: true
    });
  }
}
