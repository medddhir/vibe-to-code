/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const Module = require("module");
const ts = require("typescript");

const rootDir = process.cwd();

if (typeof global.CustomEvent === "undefined") {
  global.CustomEvent = class MockCustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  };
}

if (typeof global.window === "undefined") {
  const memoryStorage = new Map();

  global.window = {
    _listeners: new Map(),
    addEventListener(type, callback) {
      const list = this._listeners.get(type) ?? [];
      list.push(callback);
      this._listeners.set(type, list);
    },
    removeEventListener(type, callback) {
      const list = this._listeners.get(type) ?? [];
      this._listeners.set(
        type,
        list.filter((existing) => existing !== callback),
      );
    },
    dispatchEvent(event) {
      const list = this._listeners.get(event.type) ?? [];
      list.forEach((callback) => callback(event));
    },
  };

  global.localStorage = {
    getItem: (key) => memoryStorage.get(key) ?? null,
    setItem: (key, value) => {
      memoryStorage.set(key, String(value));
    },
    removeItem: (key) => {
      memoryStorage.delete(key);
    },
  };
}

const compileWithTypeScript = (source) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2017,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;

if (!Module._extensions[".ts"]) {
  Module._extensions[".ts"] = function (module, filename) {
    const source = fs.readFileSync(filename, "utf8");
    const js = compileWithTypeScript(source);
    module._compile(js, filename);
  };
}

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename(path.resolve(rootDir, request.replace(/^@\//, "src/")), parent, isMain, options);
  }

  return originalResolveFilename(request, parent, isMain, options);
};
