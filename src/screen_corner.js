'use strict';

const { Clutter, GObject, Meta, St } = imports.gi;
const Cairo = imports.cairo;
const Main = imports.ui.main;
const Layout = imports.ui.layout;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

const CornersList = [
    Meta.DisplayCorner.TOPLEFT, Meta.DisplayCorner.TOPRIGHT,
    Meta.DisplayCorner.BOTTOMLEFT, Meta.DisplayCorner.BOTTOMRIGHT
];


var ScreenCorners = class ScreenCorners {
    constructor(prefs, connections) {
        this._prefs = prefs;
        this._connections = connections;
    }

    /// Updates the corners.
    ///
    /// This removes already existing screen corners, and create new ones.
    update() {
        this._log("updating screen corners...");

        let layoutManager = Main.layoutManager;

        // remove old corners if they exist
        this.remove();

        // build new corners
        for (let monitor of layoutManager.monitors) {
            for (let corner of CornersList) {
                // create the new corner actor
                var actor = new ScreenCorner(corner, monitor, this._prefs);

                // insert it, shows the corner
                layoutManager.addTopChrome(actor, { trackFullscreen: true });

                // store it in a buffer
                layoutManager._screenCorners.push(actor);

                // connect to each preference change from the extension,
                // allowing the corner to be updated when the user changes
                // preferences
                this._prefs.keys.forEach(key => {
                    this._connections.connect(
                        this._prefs.settings,
                        'changed::' + key.name,
                        actor.vfunc_style_changed.bind(actor)
                    );
                });
            }
        }
        this._log("corners updated.");
    }

    /// Removes existing corners.
    remove() {
        // disconnect every signal created by the extension
        this._connections.disconnect_all();

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

    _log(str) {
        if (this._prefs.DEBUG.get())
            log(`[Panel corners] ${str}`);
    }
};


let ScreenCorner = GObject.registerClass(
    class ScreenCorner extends St.DrawingArea {
        _init(corner, monitor, prefs) {
            super._init({ style_class: 'screen-corner' });

            this._corner = corner;
            this._prefs = prefs;
            this._monitor = monitor;

            this._update_allocation();
        }

        _update_allocation() {
            let cornerRadius = Utils.lookup_for_length(null, '-screen-corner-radius', this._prefs);

            switch (this._corner) {
                case Meta.DisplayCorner.TOPLEFT:
                    this.set_position(
                        this._monitor.x,
                        this._monitor.y
                    );
                    break;

                case Meta.DisplayCorner.TOPRIGHT:
                    this.set_position(
                        this._monitor.x + this._monitor.width - cornerRadius,
                        this._monitor.y
                    );
                    break;

                case Meta.DisplayCorner.BOTTOMLEFT:
                    this.set_position(
                        this._monitor.x,
                        this._monitor.y + this._monitor.height - cornerRadius
                    );
                    break;

                case Meta.DisplayCorner.BOTTOMRIGHT:
                    this.set_position(
                        this._monitor.x + this._monitor.width - cornerRadius,
                        this._monitor.y + this._monitor.height - cornerRadius
                    );
                    break;
            }
        }

        vfunc_repaint() {
            let cornerRadius = Utils.lookup_for_length(null, '-screen-corner-radius', this._prefs);
            let backgroundColor = Utils.lookup_for_color(null, '-screen-corner-background-color', this._prefs);

            let cr = this.get_context();
            cr.setOperator(Cairo.Operator.SOURCE);

            switch (this._corner) {
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

            Clutter.cairo_set_source_color(cr, backgroundColor);
            cr.fill();

            cr.$dispose();
        }

        vfunc_style_changed() {
            super.vfunc_style_changed();

            let cornerRadius = Utils.lookup_for_length(null, '-screen-corner-radius', this._prefs);
            let opacity = Utils.lookup_for_double(null, '-screen-corner-opacity', this._prefs);

            this.set_opacity(opacity * 255);
            this.set_size(cornerRadius, cornerRadius);
            this._update_allocation();
        }
    }
);
