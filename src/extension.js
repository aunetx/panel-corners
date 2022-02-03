'use strict';

const { St, GObject } = imports.gi;
const Main = imports.ui.main;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const { PanelCorner } = Me.imports.panel_corner;


class Extension {
    constructor() {
    }

    enable() {
        this._log("starting up...");

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

        Main.panel._leftCorner = new PanelCorner(St.Side.LEFT);
        Main.panel.bind_property('style', Main.panel._leftCorner, 'style', GObject.BindingFlags.SYNC_CREATE);
        Main.panel.add_child(Main.panel._leftCorner);

        Main.panel._rightCorner = new PanelCorner(St.Side.RIGHT);
        Main.panel.bind_property('style', Main.panel._rightCorner, 'style', GObject.BindingFlags.SYNC_CREATE);
        Main.panel.add_child(Main.panel._rightCorner);
    }

    disable() {
        if (this.startup_complete_id)
            Main.layoutManager.disconnect(this.startup_complete_id);
    }

    _log(str) {
        log(`[Topbar corners] ${str}`);
    }
}

function init() {
    return new Extension();
}
