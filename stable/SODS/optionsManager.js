"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Option = void 0;
class Option {
    constructor(name) {
        this.name = name;
    }
    default(value, priority = 0) {
        return this.from(value, "set", priority, false);
    }
    fromCommandLineArguments(argumentName, priority = 0x40) {
        return this.from(argumentName, "get_command_line_argument", priority, false);
    }
    fromConsole(message, priority = 0x20, askAnyway = false) {
        return this.from(message, "ask_stdin", priority, askAnyway);
    }
    fromWindow(label, _default, priority = 0x30, askAnyway = false) {
        return this.from({
            label,
            default: _default
        }, "ask_window", priority, askAnyway);
    }
    fromCallback(cb, priority = 0x10) {
        return this.from(cb, "get_cb", priority, false);
    }
    from(data, type, priority, askAnyway) {
        this.optionGetters[priority] = {
            data,
            type,
            askAnyway
        };
        return this;
    }
}
exports.Option = Option;
class OptionsManager {
    constructor(config) {
    }
    process(...options) {
        return options.map(option => {
            let result;
            const friendOption = option;
            for (const priority of Object.keys(friendOption.optionGetters).sort()) {
                const getter = friendOption.optionGetters[priority];
                if (result && !getter.askAnyway)
                    continue;
                const tmp = this.switcher[getter.type](getter.data, result);
                if (tmp)
                    result = tmp;
            }
            return result;
        });
    }
}
exports.default = OptionsManager;
OptionsManager.defaultSwitcher = {
    set: (value) => value,
    get_command_line_argument(argumentName) {
        return "";
    },
    ask_stdin(message) {
    },
    ask_window({ label, default: _default }) {
    }
};
//# sourceMappingURL=optionsManager.js.map