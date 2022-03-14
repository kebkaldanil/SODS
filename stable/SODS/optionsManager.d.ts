export declare class Option {
    name: string;
    private optionGetters;
    constructor(name: string);
    default(value: string, priority?: number): this;
    fromCommandLineArguments(argumentName?: string, priority?: number): this;
    fromConsole(message: string, priority?: number, askAnyway?: boolean): this;
    fromWindow(label: string, _default?: string, priority?: number, askAnyway?: boolean): this;
    fromCallback(cb: () => string, priority?: number): this;
    from(data: any, type: string, priority: number, askAnyway: boolean): this;
}
declare type OptionsManagerConfig = {};
declare type Switcher = {
    [type: string]: (data: any, prevVal?: string) => string;
};
export default class OptionsManager {
    private static args;
    static readonly defaultSwitcher: {
        set: (value: string) => string;
        get_command_line_argument(argumentName: string): string;
        ask_stdin(message: string): void;
        ask_window({ label, default: _default }: {
            label: string;
            default: string;
        }): void;
    };
    switcher: Switcher;
    constructor(config: OptionsManagerConfig);
    process(...options: Option[]): string[];
}
export {};
