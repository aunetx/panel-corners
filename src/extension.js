'use strict';

const { St, GObject } = imports.gi;
const Main = imports.ui.main;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const { PanelCorner } = Me.imports.panel_corner;
const { Prefs, Keys } = Me.imports.settings;

const SYNC_CREATE = GObject.BindingFlags.SYNC_CREATE;


class Extension {
    constructor() {
    }

    enable() {
        this._log("starting up...");

        this._prefs = new Prefs;

        if (Main.layoutManager._startingUp)
            this.startup_complete_id = Main.layoutManager.connect(
                'startup-complete',
                this.update.bind(this)
            );
        else
            this.update();
    }

    update() {
        this._log("corners updated");

        let panel = Main.panel;

        // remove already existing corners

        if (panel._leftCorner)
            panel.remove_child(panel._leftCorner);
        if (panel._rightCorner)
            panel.remove_child(panel._rightCorner);
        if (this._settings_changed_id_left)


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
            this._prefs.get_key(key).changed(_ => {
                this._settings_changed_id_left = panel._leftCorner.vfunc_style_changed();
                this._settings_changed_id_right = panel._rightCorner.vfunc_style_changed();
            });
        });
    }

    disable() {
        if (this.startup_complete_id)
            Main.layoutManager.disconnect(this.startup_complete_id);

        let panel = Main.panel;

        panel.remove_child(panel._leftCorner);
        panel.remove_child(panel._rightCorner);
        panel._leftCorner.destroy();
        panel._rightCorner.destroy();
        delete panel._leftCorner;
        delete panel._rightCorner;
    }

    _log(str) {
        log(`[Panel corners] ${str}`);
    }
}

function init() {
    return new Extension();
};
