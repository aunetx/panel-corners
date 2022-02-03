'use strict';

const Gio = imports.gi.Gio;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

const SCHEMA_PATH = 'org.gnome.shell.extensions.panel-corners';

const Type = {
    B: 'Boolean',
    I: 'Integer',
    D: 'Double',
    S: 'String'
};

// Each key name can only be made of lowercase characters and "-"
const Keys = [
    { type: Type.B, name: "force-extension-values" },
    { type: Type.I, name: "panel-corner-radius" },
    { type: Type.I, name: "panel-corner-border-width" },
    { type: Type.S, name: "panel-corner-background-color" },
    { type: Type.D, name: "panel-corner-opacity" },
    { type: Type.B, name: "debug" },
];

function get_local_gsettings(schema_path) {
    const GioSSS = Gio.SettingsSchemaSource;
    let schemaDir = Extension.dir.get_child('schemas');
    let schemaSource = GioSSS.get_default();

    if (schemaDir.query_exists(null)) {
        schemaSource = GioSSS.new_from_directory(
            schemaDir.get_path(),
            schemaSource,
            false);
    }

    let schemaObj = schemaSource.lookup(schema_path, true);
    if (!schemaObj) {
        throw new Error(
            `Schema ${schema_path} could not be found for extension ${Extension.metadata.uuid}`
        );
    }
    return new Gio.Settings({
        settings_schema: schemaObj
    });
};

var Prefs = class Prefs {
    constructor() {
        var settings = this.settings = get_local_gsettings(SCHEMA_PATH);

        Keys.forEach(key => {
            let property_name = key.name;
            let accessible_name = key.name.replaceAll('-', '_').toUpperCase();

            switch (key.type) {
                case Type.B:
                    this[accessible_name] = {
                        key: property_name,
                        get: function () {
                            return settings.get_boolean(this.key);
                        },
                        set: function (v) {
                            settings.set_boolean(this.key, v);
                        },
                        changed: function (cb) {
                            return settings.connect('changed::' + this.key, cb);
                        },
                        disconnect: function () {
                            return settings.disconnect.apply(
                                settings, arguments
                            );
                        }
                    };
                    break;

                case Type.I:
                    this[accessible_name] = {
                        key: property_name,
                        get: function () {
                            return settings.get_int(this.key);
                        },
                        set: function (v) {
                            settings.set_int(this.key, v);
                        },
                        changed: function (cb) {
                            return settings.connect('changed::' + this.key, cb);
                        },
                        disconnect: function () {
                            return settings.disconnect.apply(
                                settings, arguments
                            );
                        },
                    };
                    break;

                case Type.D:
                    this[accessible_name] = {
                        key: property_name,
                        get: function () {
                            return settings.get_double(this.key);
                        },
                        set: function (v) {
                            settings.set_double(this.key, v);
                        },
                        changed: function (cb) {
                            return settings.connect('changed::' + this.key, cb);
                        },
                        disconnect: function () {
                            return settings.disconnect.apply(
                                settings, arguments
                            );
                        },
                    };
                    break;

                case Type.S:
                    this[accessible_name] = {
                        key: property_name,
                        get: function () {
                            return settings.get_string(this.key);
                        },
                        set: function (v) {
                            settings.set_string(this.key, v);
                        },
                        changed: function (cb) {
                            return settings.connect('changed::' + this.key, cb);
                        },
                        disconnect: function () {
                            return settings.disconnect.apply(
                                settings, arguments
                            );
                        },
                    };
                    break;
            }
        });
    }

    /// Returns the extension's value associated to the given `ThemeNode` prop
    /// For example, for '-panel-corner-radius', returns the pref
    /// 'panel-corner-radius' (but not its value).
    ///
    /// The prop should exist for the extension.
    get_prop(name) {
        let accessible_name = name.slice(1).replaceAll('-', '_').toUpperCase();
        return this[accessible_name];
    }

    disconnect_all_settings() {
        Keys.forEach(key => {
            let accessible_name = key.name.replaceAll('-', '_').toUpperCase();
            this[accessible_name].disconnect();
        });
    }
};