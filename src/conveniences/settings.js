/**
 * An enum non-extensively describing the type of a gsettings key.
 */
export const Type = ({
    B: 'Boolean',
    I: 'Integer',
    D: 'Double',
    S: 'String'
});

class Pref {
    key;
    #id;

    constructor(settings, key) {
        this.key = key.name;
        this.settings = settings;
    }

    changed(cb) {
        this.#id = this.settings.connect('changed::' + this.key, cb);
        return this.#id;
    }

    disconnect(id = this.#id) {
        return this.settings.disconnect(id);
    }

    get() { return; }
    set(v) { }
}

export class BooleanPref extends Pref {
    get() {
        return this.settings.get_boolean(this.key);
    }

    set(v) {
        this.settings.set_boolean(this.key, v);
    }
}

export class IntPref extends Pref {
    get() {
        return this.settings.get_int(this.key);
    }

    set(v) {
        this.settings.set_int(this.key, v);
    }
}

export class DoublePref extends Pref {
    get() {
        return this.settings.get_double(this.key);
    }

    set(v) {
        this.settings.set_double(this.key, v);
    }
}

export class StringPref extends Pref {
    get() {
        return this.settings.get_string(this.key);
    }

    set(v) {
        this.settings.set_string(this.key, v);
    }
}


/**
 * An object to get and manage the gsettings preferences.
 *
 * Should be initialized with an array of keys, for example:
 *
 * let settings = new Settings([
 *     { type: Type.I, name: "panel-corner-radius" },
 *     { type: Type.B, name: "debug" }
 * ]);
 *
 * Each {type, name} object represents a gsettings key, which must be created
 * in the gschemas.xml file of the extension.
 */
export class Settings {
    constructor(keys, settings) {
        this.keys = keys;
        this.settings = settings;

        this.keys.forEach(key => {
            let property_name = this.get_property_name(key.name);

            switch (key.type) {
                case Type.B:
                    this[property_name] = new BooleanPref(settings, key);
                    break;

                case Type.I:
                    this[property_name] = new IntPref(settings, key);
                    break;

                case Type.D:
                    this[property_name] = new DoublePref(settings, key);
                    break;

                case Type.S:
                    this[property_name] = new StringPref(settings, key);
                    break;
            }
        });
    }

    /**
     * From the gschema name, returns the name of the associated property on
     * the Settings object.
     */
    get_property_name(name) {
        return (
            name.replaceAll('-', '_').toUpperCase()
        );
    }

    /**
     * From the gschema name, returns the associated property on the Settings
     * object.
     */
    get_property(name) {
        return this[this.get_property_name(name)];
    }

    /**
     * Remove all connections managed by the Settings object, i.e. created with
     * `settings.PROPERTY.changed(callback)`.
     */
    disconnect_all_settings() {
        this.keys.forEach(key => {
            this.get_property(key.name).disconnect();
        });
    }
};
