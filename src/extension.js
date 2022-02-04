'use strict';

const { St, GObject } = imports.gi;
const Main = imports.ui.main;
const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();

const { Connections } = Me.imports.conveniences.connections;
const { Prefs, Type } = Me.imports.conveniences.settings;

const { PanelCorner } = Me.imports.panel_corner;

const SYNC_CREATE = GObject.BindingFlags.SYNC_CREATE;
const [GS_MAJOR, GS_MINOR] = Config.PACKAGE_VERSION.split('.');

const Keys = [
    { type: Type.B, name: "force-extension-values" },
    { type: Type.I, name: "panel-corner-radius" },
    { type: Type.I, name: "panel-corner-border-width" },
    { type: Type.S, name: "panel-corner-background-color" },
    { type: Type.D, name: "panel-corner-opacity" },
    { type: Type.B, name: "debug" },
];


class Extension {
    constructor() {
    }

    /// Called on extension enable.
    enable() {
        this._prefs = new Prefs(Keys);
        this._connections = new Connections;

        this._log("starting up...");

        // load the extension when the shell has finished starting up
        if (Main.layoutManager._startingUp)
            this._connections.connect(
                Main.layoutManager,
                'startup-complete',
                this.load.bind(this)
            );
        else
            this.load();
    }

    /// Called when the shell has finished starting up.
    ///
    /// It saves existing corners, if any, and create our new corners.
    load() {
        let panel = Main.panel;

        // if GNOME still supports them, and they do exist, then save existing
        // corners to replace them on extension disable
        if (
            GS_MAJOR < 42 &&
            panel._leftCorner && panel._rightCorner
        ) {
            this._old_corners = [panel._leftCorner, panel._rightCorner];
        }

        // finally update to create our corners
        this.update();
    }

    /// Updates the corners.
    ///
    /// This removes already existing corners (previously created by the
    /// extension, or from the shell itself), and create new ones.
    update() {
        this._log("updating corners...");

        let panel = Main.panel;

        // diconnect old settings signals, see below when it is created
        this._connections.disconnect_all_for(this._prefs.settings);

        // remove already existing corners
        this.remove();

        // create each corner
        panel._leftCorner = new PanelCorner(St.Side.LEFT, this._prefs);
        panel._rightCorner = new PanelCorner(St.Side.RIGHT, this._prefs);

        // bind their style to the panel style
        panel.bind_property('style', panel._leftCorner, 'style', SYNC_CREATE);
        panel.bind_property('style', panel._rightCorner, 'style', SYNC_CREATE);

        // add corners to the panel, showing them
        panel.add_child(panel._leftCorner);
        panel.add_child(panel._rightCorner);

        // connect to each preference change from the extension, allowing the
        // corners to be updated when the user changes preferences.
        Keys.forEach(key => {
            this._connections.connect(
                this._prefs.settings,
                'changed::' + key.name,
                _ => {
                    panel._leftCorner.vfunc_style_changed();
                    panel._rightCorner.vfunc_style_changed();
                }
            );
        });

        this._log("corners updated.");
    }

    /// Removes existing corners.
    ///
    /// It is meant to destroy entirely old corners, except if they were saved
    /// by the extension on load; in which case it keep them intact to restore
    /// them on extension disable.
    remove() {
        let panel = Main.panel;

        if (panel._leftCorner) {
            this.remove_corner(panel._leftCorner);
            delete panel._leftCorner;
        }

        if (panel._rightCorner) {
            this.remove_corner(panel._rightCorner);
            delete panel._rightCorner;
        }
    }

    /// Remove the given corner.
    remove_corner(corner) {
        // remove from panel
        Main.panel.remove_child(corner);

        // disconnect every signal created by the extension
        this._connections.disconnect_all_for(corner);

        // if not an original corner, destroy it
        if (
            !this._old_corners ||
            (this._old_corners && !this._old_corners.includes(corner))
        )
            corner.destroy();
    }

    /// Disables the extension.
    disable() {
        this._connections.disconnect_all();
        this.remove();

        let panel = Main.panel;

        // if using GNOME < 42, restore default corners
        if (this._old_corners) {
            [panel._leftCorner, panel._rightCorner] = this._old_corners;

            // TODO fix crash when replacing child due to Blur my Shell
            panel.add_child(panel._leftCorner);
            panel.add_child(panel._rightCorner);
        }

        this._log("extension disabled.");

        delete this._connections;
        delete this._prefs;
    }

    _log(str) {
        if (this._prefs.DEBUG.get())
            log(`[Panel corners] ${str}`);
    }
}

function init() {
    return new Extension();
};
