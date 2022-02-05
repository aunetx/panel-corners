'use strict';

const { St, Meta } = imports.gi;
const Main = imports.ui.main;
const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();

const { Connections } = Me.imports.conveniences.connections;
const { Prefs, Type } = Me.imports.conveniences.settings;

const { PanelCorners } = Me.imports.panel_corner;
const { ScreenCorners } = Me.imports.screen_corner;

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
    constructor() { }

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
        Main.layoutManager._screenCorners = [];

        // if GNOME still supports them, and they do exist, then save existing
        // corners to replace them on extension disable
        if (
            GS_MAJOR < 42 &&
            panel._leftCorner && panel._rightCorner
        ) {
            this._old_corners = [panel._leftCorner, panel._rightCorner];
        } else {
            this._old_corners = null;
        }

        // create the panel corners manager
        this._panel_corners = new PanelCorners(
            this._prefs, new Connections, this._old_corners
        );

        // create the screen corners manager
        this._screen_corners = new ScreenCorners(
            this._prefs, new Connections, this._old_corners
        );

        // finally update our corners
        this.update();
    }

    /// Updates the corners.
    update() {
        this._log("updating corners...");

        this._panel_corners.update();
        this._screen_corners.update();

        this._log("corners updated.");
    }

    /// Removes existing corners.
    ///
    /// It is meant to destroy entirely old corners, except if they were saved
    /// by the extension on load; in which case it keep them intact to restore
    /// them on extension disable.
    remove() {
        this._panel_corners.remove();
        this._screen_corners.remove();
    }

    /// Disables the extension.
    disable() {
        this.remove();

        this._connections.disconnect_all();

        let panel = Main.panel;

        // if using GNOME < 42, restore default corners
        if (this._old_corners) {
            [panel._leftCorner, panel._rightCorner] = this._old_corners;

            // TODO fix crash when replacing child due to Blur my Shell
            panel.add_child(panel._leftCorner);
            panel.add_child(panel._rightCorner);
        }

        this._log("extension disabled.");

        delete this._panel_corners;
        delete this._screen_corners;
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
