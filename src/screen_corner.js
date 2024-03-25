import Clutter from 'gi://Clutter';
import St from 'gi://St';
import Meta from 'gi://Meta';
import GObject from 'gi://GObject';
import Cairo from 'cairo';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Utils from './utils.js';

const CornersList = [
    Meta.DisplayCorner.TOPLEFT, Meta.DisplayCorner.TOPRIGHT,
    Meta.DisplayCorner.BOTTOMLEFT, Meta.DisplayCorner.BOTTOMRIGHT
];


export class ScreenCorners {
    #settings;
    #connections;

    constructor(settings, connections) {
        this.#settings = settings;
        this.#connections = connections;
    }

    /**
     * Updates the corners.
     *
     * This removes already existing screen corners, and create new ones.
     */
    update() {
        this.#log("updating screen corners...");

        let layoutManager = Main.layoutManager;

        // remove old corners if they exist
        this.remove();

        // build new corners
        for (let monitor of layoutManager.monitors) {
            for (let corner of CornersList) {
                // create the new corner actor
                var actor = new ScreenCorner(corner, monitor, this.#settings);

                // insert it, shows the corner
                layoutManager.addTopChrome(actor, { trackFullscreen: true });

                // store it in a buffer
                layoutManager._screenCorners.push(actor);

                // connect to each preference change from the extension,
                // allowing the corner to be updated when the user changes
                // preferences
                this.#settings.keys.forEach(key => {
                    this.#connections.connect(
                        this.#settings.settings,
                        'changed::' + key.name,
                        actor.vfunc_style_changed.bind(actor)
                    );
                });
            }
        }
        this.#log("corners updated.");
    }

    /** Removes existing corners. */
    remove() {
        // disconnect every signal created by the extension
        this.#connections.disconnect_all();

        let layoutManager = Main.layoutManager;

        // destroy old corners if they exist
        if (layoutManager._screenCorners)
            layoutManager._screenCorners.forEach(corner => {
                if (corner) {
                    corner.destroy();
                }
            });

        // reset the corners buffer
        layoutManager._screenCorners = [];
    }

    #log(str) {
        if (this.#settings.DEBUG.get())
            console.log(`[Panel corners] ${str}`);
    }
};

export class ScreenCorner extends St.DrawingArea {
    static {
        GObject.registerClass(this);
    }

    #corner;
    #settings;
    #monitor;

    constructor(corner, monitor, settings) {
        super({ style_class: 'screen-corner' });

        this.#corner = corner;
        this.#settings = settings;
        this.#monitor = monitor;

        this.#update_allocation();
    }

    #update_allocation() {
        let cornerRadius = Utils.lookup_for_length(null, '-screen-corner-radius', this.#settings);

        switch (this.#corner) {
            case Meta.DisplayCorner.TOPLEFT:
                this.set_position(
                    this.#monitor.x,
                    this.#monitor.y
                );
                break;

            case Meta.DisplayCorner.TOPRIGHT:
                this.set_position(
                    this.#monitor.x + this.#monitor.width - cornerRadius,
                    this.#monitor.y
                );
                break;

            case Meta.DisplayCorner.BOTTOMLEFT:
                this.set_position(
                    this.#monitor.x,
                    this.#monitor.y + this.#monitor.height - cornerRadius
                );
                break;

            case Meta.DisplayCorner.BOTTOMRIGHT:
                this.set_position(
                    this.#monitor.x + this.#monitor.width - cornerRadius,
                    this.#monitor.y + this.#monitor.height - cornerRadius
                );
                break;
        }
    }

    vfunc_repaint() {
        let cornerRadius = Utils.lookup_for_length(null, '-screen-corner-radius', this.#settings);
        let backgroundColor = Utils.lookup_for_color(null, '-screen-corner-background-color', this.#settings);

        let cr = this.get_context();
        cr.setOperator(Cairo.Operator.SOURCE);

        switch (this.#corner) {
            case Meta.DisplayCorner.TOPLEFT:
                cr.arc(cornerRadius, cornerRadius,
                    cornerRadius, Math.PI, 3 * Math.PI / 2);
                cr.lineTo(0, 0);
                break;

            case Meta.DisplayCorner.TOPRIGHT:
                cr.arc(0, cornerRadius,
                    cornerRadius, 3 * Math.PI / 2, 2 * Math.PI);
                cr.lineTo(cornerRadius, 0);
                break;

            case Meta.DisplayCorner.BOTTOMLEFT:
                cr.arc(cornerRadius, 0,
                    cornerRadius, Math.PI / 2, Math.PI);
                cr.lineTo(0, cornerRadius);
                break;

            case Meta.DisplayCorner.BOTTOMRIGHT:
                cr.arc(0, 0,
                    cornerRadius, 0, Math.PI / 2);
                cr.lineTo(cornerRadius, cornerRadius);
                break;
        }

        cr.closePath();

        cr.setSourceColor(backgroundColor);
        cr.fill();

        cr.$dispose();
    }

    vfunc_style_changed() {
        super.vfunc_style_changed();

        let cornerRadius = Utils.lookup_for_length(null, '-screen-corner-radius', this.#settings);
        let opacity = Utils.lookup_for_double(null, '-screen-corner-opacity', this.#settings);

        this.set_opacity(opacity * 255);
        this.set_size(cornerRadius, cornerRadius);
        this.#update_allocation();
    }
}
