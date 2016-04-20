import Vue = require('vue');
import VueStatic = vuejs.VueStatic;
import ComponentOption = vuejs.ComponentOption;

export interface IHarnessOptions extends ComponentOption {
    component? : (resolve : any) => any;
    autobindProps? : boolean;
    template? : string;
    position? : string;//('left' | 'right' | 'center' | 'none');
    width? : string;
    parentHarness? : Harness;
}

function camelToDash(input : string) : string {
    return input.replace(/([A-Z])/g, function ($1 : string) : string {
        return "-" + $1.toLowerCase();
    });
}
//run through all the elements in the `data` hash and convert them to prop form (:attr-name="attrName")
function setPropAttributes(attrs : any) : string {
    if (!attrs) return '';
    var props  = attrs;

    if (typeof attrs === 'function') {
        props = props();
    }
    if (typeof props !== 'object') return '';
    var retn = '';
    Object.keys(props).forEach(function (key) {
        retn += ` :${camelToDash(key)}="${key}" `
    });
    return retn;
}

export default class Harness {
    //mounting point id
    public static mountElementId : string = 'harness-mount-point';
    //registry of harnesses
    private static harnesses : {[str : string] : Harness } = {};
    //which harness vue instance is active
    private static activeInstance : any;

    //config containing non-vue data
    private config : any;
    //the vue generated class from our options hash
    private componentClass : any;
    //if this harness has a parent, this will point to it
    private parentHarness : Harness;
    //general vue options
    private options : IHarnessOptions;

    constructor(name : string, options : IHarnessOptions) {
        this.options = options;
        this.parentHarness = this.options.parentHarness || null;
        this.config = this.buildConfig();
        this.options.template = this.buildTemplate();
        this.componentClass = null;
        if (!this.options.component && !this.options.template) {
            throw new Error("You must provide either a component or a template to a harness");
        }
        if (Harness.harnesses[name]) {
            throw new Error(Harness.DuplicateFound(name));
        }

        Harness.harnesses[name] = this;

        this.buildVueClass();
    }

    private buildConfig() {
        var autobind : boolean = this.options.autobindProps;
        if(typeof autobind !== 'boolean') {
            if(this.parentHarness) {
                autobind = this.parentHarness.config.autobindProps;
            }
            else {
                autobind = true;
            }
        }

        if(this.parentHarness) {
            return {
                component: this.options.component || this.parentHarness.config.component,
                position: this.options.position || this.parentHarness.config.position,
                width: this.options.width || this.parentHarness.config.width,
                autobindProps: autobind
            }
        }
        return {
            component: this.options.component,
            position: this.options.position || 'center',
            width: this.options.width || '50%', //todo position is only respected if width is < 100%
            autobindProps: autobind
        }
    }

    private buildTemplate() : string {

        var template = '';

        if (this.parentHarness) {
            template = `<div>${this.options.template || this.parentHarness.options.template}</div>`;
        }
        else {
            template = `<div>${this.options.template || 'COMPONENT'}</div>`;
        }

        this.options.template = template;


        var attrs = (this.config.autobindProps) ? setPropAttributes(this.options.data) : '';

        var compiledTemplate = `<harnessed-component ${attrs}></harnessed-component>`;
        template = template.replace(new RegExp('COMPONENT', 'g'), compiledTemplate);

        return template;
    }

    private buildVueClass() : void {
        var vueOptions : any = {};
        var ignore = ['el', 'template'];

        Object.keys(this.options).forEach((key : string) => {
            if (ignore.indexOf(key) !== -1) return;
            vueOptions[key] = this.options[key];
        });

        var parentComponentClass = this.parentHarness ? this.parentHarness.componentClass : Vue;

        this.componentClass = (<VueStatic>parentComponentClass).extend(vueOptions);
    }

    public extend(name : string, options : IHarnessOptions) : Harness {
        var autobind = options.autobindProps;
        if (autobind === void 0) autobind = true;
        options.parentHarness = this;
        options.template = options.template || this.options.template;
        options.component = options.component || this.options.component;
        options.position = options.position || this.options.position;
        options.width = options.width || this.options.width;
        options.autobindProps = autobind;
        return new Harness(name, options);
    }

    public use() : void {
        if(Harness.activeInstance) Harness.activeInstance.$destroy();

        var mount = document.getElementById(Harness.mountElementId);
        mount.style.width = this.config.width;

        switch (this.config.position) {
            case 'center':
                mount.style.marginLeft = 'auto';
                mount.style.marginRight = 'auto';
                break;
            case 'right':
                //todo math of window size
                mount.style.marginLeft = (100 - 30).toString() + '%';
                break;
            default:
                break;
        }

        var options : any = {
            template: this.options.template
        };

        if (this.options.component) {
            options.components = {
                'harnessed-component': this.options.component
            }
        }

        Harness.activeInstance = new this.componentClass(options);

        Harness.activeInstance.$mount('#' + Harness.mountElementId);
    }

    public static Use(name : string) {
        var harness = Harness.Get(name);
        harness.use();
    }

    private static Get(name : string) : Harness {
        if (Harness.harnesses[name]) {
            return Harness.harnesses[name];
        }
        else {
            throw new Error(Harness.NotFound(name))
        }
    }

    private static DuplicateFound(name : string) {
        return `Unable to register harness ${name} because another harness with the same name is already registered.`;
    }

    private static NotFound(name : string) {
        return `Unable to find harness with name '${name}`;
    }
}

export var harness = function(name : string, options : any = <IHarnessOptions>{}) {
    return function(targetClass : any) {

        if(typeof targetClass.getVueClassAsync === 'function') {
            options.component = targetClass.getVueClassAsync()
        }

        new Harness(name, options);
    }
};
