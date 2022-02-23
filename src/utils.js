'use strict';

const { Clutter, St } = imports.gi;
const Main = imports.ui.main;
const Cairo = imports.cairo;

const Me = imports.misc.extensionUtils.getCurrentExtension();


var lookup_for_length = function (node, prop, prefs) {
    const use_extension_values = node && prefs.FORCE_EXTENSION_VALUES.get();

    let lookup = [];
    if (use_extension_values)
        lookup = node.lookup_length(prop, false);

    if (use_extension_values || !lookup[0]) {
        let scale_factor =
            St.ThemeContext.get_for_stage(global.stage).scale_factor;
        let length = prefs.get_property(prop.slice(1)).get();

        return length * scale_factor;
    } else {
        return lookup[1];
    }
};

var lookup_for_double = function (node, prop, prefs) {
    const use_extension_values = node && prefs.FORCE_EXTENSION_VALUES.get();

    let lookup = [];
    if (use_extension_values)
        lookup = node.lookup_double(prop, false);

    if (use_extension_values || !lookup[0]) {
        return prefs.get_property(prop.slice(1)).get();
    } else {
        return lookup[1];
    }
};

var lookup_for_color = function (node, prop, prefs) {
    const use_extension_values = node && prefs.FORCE_EXTENSION_VALUES.get();

    let lookup = [];
    if (use_extension_values)
        lookup = node.lookup_color(prop, false);

    if (use_extension_values || !lookup[0]) {
        let color_str = prefs.get_property(prop.slice(1)).get();
        let color_parsed = Clutter.color_from_string(color_str);

        if (color_parsed[0]) {
            return color_parsed[1];
        } else {
            // could not parse color, defaulting to black
            prefs.get_property(prop.slice(1)).set('#000000ff');

            return Clutter.color_from_string('#000000ff')[1];
        }
    } else {
        return lookup[1];
    }
};