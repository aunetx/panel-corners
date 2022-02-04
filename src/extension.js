'use strict';

const { St, GObject } = imports.gi;
const Main = imports.ui.main;
const Config = imports.misc.config;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const { PanelCorner } = Me.imports.panel_corner;
const { Connections } = Me.imports.connections;
const { Prefs, Keys } = Me.imports.settings;

const SYNC_CREATE = GObject.BindingFlags.SYNC_CREATE;
const [GS_MAJOR, GS_MINOR] = Config.PACKAGE_VERSION.split('.');


class Extension {
    constructor() {
    }

    enable() {
        this._prefs = new Prefs;
        this._connections = new Connections;

        this._log("starting up...");

        if (Main.layoutManager._startingUp)
            this._connections.connect(
                Main.layoutManager,
                'startup-complete',
                this.first_update.bind(this)
            );
        else
            this.first_update();
    }

    first_update() {
        if (GS_MAJOR < 42 && Main.panel._leftCorner && Main.panel._rightCorner) {
            this._old_corners = [Main.panel._leftCorner, Main.panel._rightCorner];
        }
        this.update();
    }

    update() {
        this._log("corners updated");

        let panel = Main.panel;

        // diconnect old settings signals
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


        // connect to the preference changes
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
    }

    remove() {
        let panel = Main.panel;

        if (panel._leftCorner) {
            // remove from panel
            panel.remove_child(panel._leftCorner);
            // disconnect extension's signals
            this._connections.disconnect_all_for(panel._leftCorner);
            // if not original corners (which we want to restore later), destroy
            if (
                !this._old_corners ||
                (this._old_corners && !this._old_corners.includes(panel._leftCorner))
            )
                panel._leftCorner.destroy();
            // remove from panel class
            delete panel._leftCorner;
        }

        // all the same
        if (panel._rightCorner) {
            panel.remove_child(panel._rightCorner);
            this._connections.disconnect_all_for(panel._rightCorner);
            if (
                !this._old_corners ||
                (this._old_corners && !this._old_corners.includes(panel._rightCorner))
            )
                panel._rightCorner.destroy();
            delete panel._rightCorner;
        }
    }

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
