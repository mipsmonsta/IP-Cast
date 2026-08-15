globalThis.expo = {
  EventEmitter: class EventEmitter {
    addListener() {
      return { remove() {} };
    }
    removeAllListeners() {}
    emit() {}
  },
  modules: {},
};
