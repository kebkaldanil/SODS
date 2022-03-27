type objectByPriority = {
  [priority: number]: {
    type: string;
    askAnyway: boolean;
    data: any;
  };
};

type FriendOption = {
  name: string;
  optionGetters: objectByPriority;
  value?: string;
}

export class Option {
  name: string;
  private optionGetters: objectByPriority;
  /**
     *
     */
  constructor(name: string) {
    this.name = name;
  }

  default(value: string, priority = 0) {
    return this.from(value, "set", priority, false);
  }

  fromCommandLineArguments(argumentName?: string, priority = 0x40) {
    return this.from(argumentName, "get_command_line_argument", priority, false);
  }

  fromConsole(message: string, priority = 0x20, askAnyway = false) {
    return this.from(message, "ask_stdin", priority, askAnyway);
  }

  fromWindow(label: string, _default?: string, priority = 0x30, askAnyway = false) {
    return this.from({
      label,
      default: _default,
    }, "ask_window", priority, askAnyway);
  }

  fromCallback(cb: () => string, priority = 0x10) {
    return this.from(cb, "get_cb", priority, false);
  }

  from(data: any, type: string, priority: number, askAnyway: boolean) {
    this.optionGetters[priority] = {
      data,
      type,
      askAnyway,
    };
    return this;
  }
}

type OptionsManagerConfig = {
};

type Switcher = {
  [type: string]: (data: any, prevVal?: string) => string;
};

export default class OptionsManager {
  private static args: string[];
  static readonly defaultSwitcher = {
    set: (value: string) => value,
    get_command_line_argument(argumentName: string) {
      return "";
    },
    ask_stdin(message: string) {
    },
    ask_window({ label, default: _default }: {label: string, default: string}) {
    },
  };

  switcher: Switcher;
  /**
     *
     */
  constructor(config: OptionsManagerConfig) {

  }

  process(...options: Option[]) {
    return options.map(option => {
      let result: string;
      const friendOption = option as unknown as FriendOption;
      for (const priority of Object.keys(friendOption.optionGetters).sort()) {
        const getter = friendOption.optionGetters[priority as unknown as number];
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
