(function () {
  const DEFAULT = {
    apiBaseUrl: "",
    instance: "",
    webhookUrl: "",
    leads: [],
    conversations: [],
    messages: {},
    user: null,
    settings: {}
  };

  const state = Object.assign({}, DEFAULT);

  function get(path) {
    return path.split(".").reduce((acc, part) => (acc && acc[part] != null ? acc[part] : undefined), state);
  }

  function set(path, value) {
    const parts = path.split(".");
    const last = parts.pop();
    const target = parts.reduce((acc, part) => {
      if (!acc[part]) acc[part] = {};
      return acc[part];
    }, state);
    target[last] = value;
  }

  function snapshot() {
    return JSON.parse(JSON.stringify(state));
  }

  function reset() {
    Object.keys(state).forEach((key) => delete state[key]);
    Object.assign(state, JSON.parse(JSON.stringify(DEFAULT)));
  }

  window.__STATE__ = {
    get,
    set,
    snapshot,
    reset
  };
})();
