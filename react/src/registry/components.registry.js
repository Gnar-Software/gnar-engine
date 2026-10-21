
export const componentsRegistry = {
    components: {},
    overridden: {},

    register: function(name, component) {
        if (this.components[name]) {
            throw new Error(`Component ${name} is already registered.`);
        }

        this.components[name] = component;
    },

    override: function(name, component) {
        if (this.components[name]) {
            this.overridden[name] = this.components[name];
            this.components[name] = component;
        } else {
            throw new Error(`Component ${name} does not exist and cannot be overridden.`);
        }
    },

    render: function(name) {
        return this.components[name];
    }
};
