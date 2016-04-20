var Vue = require('vue');
function camelToDash(input) {
    return input.replace(/([A-Z])/g, function ($1) {
        return "-" + $1.toLowerCase();
    });
}
//run through all the elements in the `data` hash and convert them to prop form (:attr-name="attrName")
function setPropAttributes(attrs) {
    if (!attrs)
        return '';
    var props = attrs;
    if (typeof attrs === 'function') {
        props = props();
    }
    if (typeof props !== 'object')
        return '';
    var retn = '';
    Object.keys(props).forEach(function (key) {
        retn += " :" + camelToDash(key) + "=\"" + key + "\" ";
    });
    return retn;
}
var Harness = (function () {
    function Harness(name, options) {
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
    Harness.prototype.buildConfig = function () {
        var autobind = this.options.autobindProps;
        if (typeof autobind !== 'boolean') {
            if (this.parentHarness) {
                autobind = this.parentHarness.config.autobindProps;
            }
            else {
                autobind = true;
            }
        }
        if (this.parentHarness) {
            return {
                component: this.options.component || this.parentHarness.config.component,
                position: this.options.position || this.parentHarness.config.position,
                width: this.options.width || this.parentHarness.config.width,
                autobindProps: autobind
            };
        }
        return {
            component: this.options.component,
            position: this.options.position || 'center',
            width: this.options.width || '50%',
            autobindProps: autobind
        };
    };
    Harness.prototype.buildTemplate = function () {
        var template = '';
        if (this.parentHarness) {
            template = "<div>" + (this.options.template || this.parentHarness.options.template) + "</div>";
        }
        else {
            template = "<div>" + (this.options.template || 'COMPONENT') + "</div>";
        }
        this.options.template = template;
        var attrs = (this.config.autobindProps) ? setPropAttributes(this.options.data) : '';
        var compiledTemplate = "<harnessed-component " + attrs + "></harnessed-component>";
        template = template.replace(new RegExp('COMPONENT', 'g'), compiledTemplate);
        return template;
    };
    Harness.prototype.buildVueClass = function () {
        var _this = this;
        var vueOptions = {};
        var ignore = ['el', 'template'];
        Object.keys(this.options).forEach(function (key) {
            if (ignore.indexOf(key) !== -1)
                return;
            vueOptions[key] = _this.options[key];
        });
        var parentComponentClass = this.parentHarness ? this.parentHarness.componentClass : Vue;
        this.componentClass = parentComponentClass.extend(vueOptions);
    };
    Harness.prototype.extend = function (name, options) {
        var autobind = options.autobindProps;
        if (autobind === void 0)
            autobind = true;
        options.parentHarness = this;
        options.template = options.template || this.options.template;
        options.component = options.component || this.options.component;
        options.position = options.position || this.options.position;
        options.width = options.width || this.options.width;
        options.autobindProps = autobind;
        return new Harness(name, options);
    };
    Harness.prototype.use = function () {
        if (Harness.activeInstance)
            Harness.activeInstance.$destroy();
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
        var options = {
            template: this.options.template
        };
        if (this.options.component) {
            options.components = {
                'harnessed-component': this.options.component
            };
        }
        Harness.activeInstance = new this.componentClass(options);
        Harness.activeInstance.$mount('#' + Harness.mountElementId);
    };
    Harness.Use = function (name) {
        var harness = Harness.Get(name);
        harness.use();
    };
    Harness.Get = function (name) {
        if (Harness.harnesses[name]) {
            return Harness.harnesses[name];
        }
        else {
            throw new Error(Harness.NotFound(name));
        }
    };
    Harness.DuplicateFound = function (name) {
        return "Unable to register harness " + name + " because another harness with the same name is already registered.";
    };
    Harness.NotFound = function (name) {
        return "Unable to find harness with name '" + name;
    };
    //mounting point id
    Harness.mountElementId = 'harness-mount-point';
    //registry of harnesses
    Harness.harnesses = {};
    return Harness;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Harness;
exports.harness = function (name, options) {
    if (options === void 0) { options = {}; }
    return function (targetClass) {
        if (typeof targetClass.getVueClassAsync === 'function') {
            options.component = targetClass.getVueClassAsync();
        }
        new Harness(name, options);
    };
};
