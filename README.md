# vue-harness
vue harnessing goodness

This is first swag at getting a harnessing system working for vue components and should not be viewed as a usable project at this time. 

### Standalone Mode

#### Basic Structures
```javascript
export interface IHarnessOptions extends VueComponentOption {
    //A reference to a Vue component or function resolving a vue component (or component options)
    //this is optional if template is provided, otherwise required
     component? : (resolve : Thenable<VueApi>) => void | typeof Vue;
     //should the harness try to automatically map fields exposed in the vue `data` object to 
     //attributes in the template? (default true)
     autobindProps? : boolean;
     //a custom vue template string you can provided. this is required if component is not provided.
     //if you provide both, you can use the string COMPONENT in your template to inject the 
     //relevant component html (with attributes if autobindProps is true)
     template? : string;
     //optionally position the harness relative to the document body
     position? : 'left' | 'right' | 'center' | 'none';
     //optionally constrain the width of the harness (passed directly to the css width property of the parent div)
     width? : string,
     //a reference to the parent of this harness
     parentHarness? : Harness
}
```

#### Creating a harness
In order to use harness you need an element in the dom with the id `harness-mount-point`
```javascript
var harness = new Harness('HarnessNameHere', harnessOptionsHere);

harness.use(); //applies the harness and mounts it at `harness-mount-point`, removing a previous harness if there was one

Harness.Use('HarnessNameHere'); //same as `use()` called on an instance

Harness.Get('HarnessNameHere'); //returns a harness instance if it exists

```
#### What can be harnessed?
A harness is just a Vue component with some wrapping around it, that means you can provide all the normal vue hooks, data fields, methods, mixins etc as you will. The only thing not respected is the `el` property.
```javascript
var myComponent = Vue.component('my-component', {
    template: '<h1>Hi {{name}}</h1>',
    props: ['name']
});

var h = new Harness('MyComponent', <IHarnessOptions>{
    component: myComponent,
    data: function () {
        return {
            name: 'matt' //results in template <h1>Hi matt</h1> since props are set to autobind by default (using v-bind)
        }
    },
    created: function() {},  //normal vue hooks are usable
    methods: {fn: function(){}} //same goes for methods, watchers, mixins etc
});
```

### Extending a harness
Harnesses can be extended, so any options provided to the parent are set on the child unless explicitly overridden

```javascript
//this is still using the myComponent from the parent, output is now <h1>Hi Matthew</hi> since we override data.name
var h2 = h.extend('MyComponent2', <IHarnessOptions>{
    position: 'left', //override parent default of 'center'
    data: function () { //override parent data where name is 'matt'
        return {
            name: 'Matthew'
        }
    }
});
```

### Using with [vue-ts]("https://github.com/weichx/vue-ts')

```javascript

var options = {width: '25%'}; //normal IHarnessOptions provided here

// add @harness to your class annotation before @VueComponent
@harness('ExampleHarness', options)
@VueComponent('example', '<p>im an example, hello {{name}}</p>')
export class Example extends VueApi {
    @prop public name : string;
}

```
