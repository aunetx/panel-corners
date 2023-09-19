/**
 * An enum non-extensively describing the type of a gsettings key.
 */
export const Type = /** @type {const} */({
    B: 'Boolean',
    I: 'Integer',
    D: 'Double',
    S: 'String'
});

/**
 * @template T
 */
class Pref {
    /** @type{string} */
    key;

    /** @type{number} */
    #id;

    /**
     * @param {import('@girs/gio-2.0').Settings} settings
     * @param {import('./types.d.ts').KeyType} key
     */
    constructor(settings, key) {
        this.key = key.name;
        this.settings = settings;
    }

    /**
     * @param {(...args: any[]) => unknown} cb
     */
    changed(cb) {
        this.#id = this.settings.connect('changed::' + this.key, cb);
        return this.#id;
    }

    /**
     * @param {number} [id = this.#id]
     */
    disconnect(id = this.#id) {
        return this.settings.disconnect(id);
    }

    /** @return {T} */
    get() { return; }
    /** @param {T} v */
    set(v) { }
}

/** @extends {Pref<boolean>} */
export class BooleanPref extends Pref {
    get() {
        return this.settings.get_boolean(this.key);
    }

    /** @param {boolean} v */
    set(v) {
        this.settings.set_boolean(this.key, v);
    }
}

/** @extends {Pref<number>} */
export class IntPref extends Pref {
    get() {
        return this.settings.get_int(this.key);
    }

    /** @param {number} v */
    set(v) {
        this.settings.set_int(this.key, v);
    }
}

/** @extends {Pref<number>} */
export class DoublePref extends Pref {
    get() {
        return this.settings.get_double(this.key);
    }

    /** @param {number} v */
    set(v) {
        this.settings.set_double(this.key, v);
    }
}

/** @extends {Pref<string>} */
export class StringPref extends Pref {
    get() {
        return this.settings.get_string(this.key);
    }

    /** @param {string} v */
    set(v) {
        this.settings.set_string(this.key, v);
    }
}


/**
 * An object to get and manage the gsettings preferences.
 *
 * Should be initialized with an array of keys, for example:
 *
 * let prefs = new Prefs([
 *     { type: Type.I, name: "panel-corner-radius" },
 *     { type: Type.B, name: "debug" }
 * ]);
 *
 * Each {type, name} object represents a gsettings key, which must be created
 * in the gschemas.xml file of the extension.
 */
export class Prefs {
    /** @type {Pref} */ PANEL_CORNERS;
    /** @type {Pref} */ SCREEN_CORNERS;
    /** @type {Pref} */ DEBUG;
    /** @type {Pref} */ FORCE_EXTENSION_VALUES;

    /** @type {Pref} */ PANEL_CORNER_RADIUS;
    /** @type {Pref} */ PANEL_CORNER_BORDER_WIDTH;
    /** @type {Pref} */ PANEL_CORNER_BACKGROUND_COLOR;
    /** @type {Pref} */ PANEL_CORNER_OPACITY;
    /** @type {Pref} */ SCREEN_CORNER_RADIUS;
    /** @type {Pref} */ SCREEN_CORNER_BACKGROUND_COLOR;
    /** @type {Pref} */ SCREEN_CORNER_OPACITY;

    /**
     * @param {import('./types.d.ts').KeyType[]} keys
     * @param {import('@girs/gio-2.0').Settings} settings
     */
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
     * the Prefs object.
     * @param {string} name
     * @return {import('./types.d.ts').PrefsKey}
     */
    get_property_name(name) {
        return /** @type{import('./types.d.ts').PrefsKey} */(
            name.replaceAll('-', '_').toUpperCase()
        );
    }

    /**
     * From the gschema name, returns the associated property on the Prefs
     * object.
     * @param {string} name
     */
    get_property(name) {
        return this[this.get_property_name(name)];
    }

    /**
     * Remove all connections managed by the Prefs object, i.e. created with
     * `prefs.PROPERTY.changed(callback)`.
     */
    disconnect_all_settings() {
        this.keys.forEach(key => {
            this.get_property(key.name).disconnect();
        });
    }
};
