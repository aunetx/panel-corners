import Clutter from 'gi://Clutter';
import St from 'gi://St';
import Cogl from 'gi://Cogl';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

/**
 * Returns the edge of the screen the panel is on, `St.Side.TOP` or
 * `St.Side.BOTTOM`. With the `auto` position, it is guessed from where the
 * panel box is on the primary monitor, so it follows the panel when another
 * extension moves it (the translation used to hide the panel is ignored).
 */
export function get_panel_side(settings) {
    switch (settings.PANEL_CORNER_POSITION.get()) {
        case 'top':
            return St.Side.TOP;
        case 'bottom':
            return St.Side.BOTTOM;
    }

    const monitor = Main.layoutManager.primaryMonitor;
    if (!monitor)
        return St.Side.TOP;

    const panel_box = Main.layoutManager.panelBox;
    const panel_center = panel_box.y + panel_box.height / 2;

    return panel_center > monitor.y + monitor.height / 2 ?
        St.Side.BOTTOM : St.Side.TOP;
}

export function lookup_for_length(node, prop, settings) {
    const use_extension_values = node && settings.FORCE_EXTENSION_VALUES.get();

    let lookup = [];
    if (use_extension_values)
        lookup = node.lookup_length(prop, false);

    if (use_extension_values || !lookup[0]) {
        let scale_factor =
            St.ThemeContext.get_for_stage(global.stage).scale_factor;
        let length = settings.get_property(prop.slice(1)).get();

        return length * scale_factor;
    } else {
        return lookup[1];
    }
};

export function lookup_for_double(node, prop, settings) {
    const use_extension_values = node && settings.FORCE_EXTENSION_VALUES.get();

    let lookup = [];
    if (use_extension_values)
        lookup = node.lookup_double(prop, false);

    if (use_extension_values || !lookup[0]) {
        return settings.get_property(prop.slice(1)).get();
    } else {
        return lookup[1];
    }
};

export function lookup_for_color(node, prop, settings) {
    const use_extension_values = node && settings.FORCE_EXTENSION_VALUES.get();

    let lookup = [];
    if (use_extension_values)
        lookup = node.lookup_color(prop, false);

    if (use_extension_values || !lookup[0]) {
        let color_str = settings.get_property(prop.slice(1)).get();
        let color_parsed = Clutter.Color ?
            Clutter.color_from_string(color_str) :
            Cogl.color_from_string(color_str);

        if (color_parsed[0]) {
            return color_parsed[1];
        } else {
            // could not parse color, defaulting to black
            settings.get_property(prop.slice(1)).set('#000000ff');

            return Clutter.Color ?
                Clutter.color_from_string('#000000ff')[1] :
                Cogl.color_from_string('#000000ff')[1];
        }
    } else {
        return lookup[1];
    }
};
