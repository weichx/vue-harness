import ComponentOption = vuejs.ComponentOption;
export interface IHarnessOptions extends ComponentOption {
    component?: (resolve: any) => any;
    autobindProps?: boolean;
    template?: string;
    position?: string;
    width?: string;
    parentHarness?: Harness;
}
export default class Harness {
    static mountElementId: string;
    private static harnesses;
    private static activeInstance;
    private config;
    private componentClass;
    private parentHarness;
    private options;
    constructor(name: string, options: IHarnessOptions);
    private buildConfig();
    private buildTemplate();
    private buildVueClass();
    extend(name: string, options: IHarnessOptions): Harness;
    use(): void;
    static Use(name: string): void;
    private static Get(name);
    private static DuplicateFound(name);
    private static NotFound(name);
}
export declare var harness: (name: string, options?: any) => (targetClass: any) => void;
