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
    { type: Type.B, name: "screen-corners" },
    { type: Type.B, name: "panel-corners" },
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
        this.create_panel_corners();

        // create the screen corners manager if needed
        this.create_screen_corners();

        // create and update the panel corners manager if the preference is
        // changed
        this._prefs.PANEL_CORNERS.changed(_ => {
            this.create_panel_corners();
            this.update();
        });

        // create and update the screen corners manager if the preference is
        // changed
        this._prefs.SCREEN_CORNERS.changed(_ => {
            this.create_screen_corners();
            this.update();
        });

        // finally update our corners
        this.update();
    }

    /// Creates the panel corners manager if needed.
    ///
    /// If panel corners are deactivated, the existing corners are destroyed.
    create_panel_corners() {
        if (this._panel_corners) {
            this._panel_corners.remove();
            delete this._panel_corners;
        }

        let show = this._prefs.PANEL_CORNERS.get();
        this._panel_corners = new PanelCorners(
            this._prefs, new Connections, this._old_corners, show
        );
    }

    /// Creates the screen corners manager if needed.
    ///
    /// If screen corners are deactivated, the existing corners are destroyed.
    create_screen_corners() {
        if (this._screen_corners) {
            this._screen_corners.remove();
            delete this._screen_corners;
        }

        if (this._prefs.SCREEN_CORNERS.get()) {
            this._screen_corners = new ScreenCorners(
                this._prefs, new Connections, this._old_corners
            );
        }
    }

    /// Updates the corners.
    update() {
        this._log("updating corners...");

        this._panel_corners.update();
        if (this._screen_corners)
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
        if (this._screen_corners)
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
        if (this._screen_corners)
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
