'use strict';

const { Clutter, St, GObject } = imports.gi;
const Main = imports.ui.main;
const Cairo = imports.cairo;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

const SYNC_CREATE = GObject.BindingFlags.SYNC_CREATE;


var PanelCorners = class PanelCorners {
    constructor(prefs, connections) {
        this._prefs = prefs;
        this._connections = connections;
    }

    /// Updates the corners.
    ///
    /// This removes already existing corners (previously created by the
    /// extension, or from the shell itself), and create new ones.
    update() {
        this._log("updating panel corners...");

        // remove already existing corners
        this.remove();

        // create each corner
        Main.panel._leftCorner = new PanelCorner(
            St.Side.LEFT, this._prefs
        );
        Main.panel._rightCorner = new PanelCorner(
            St.Side.RIGHT, this._prefs
        );

        // update each of them
        this.update_corner(Main.panel._leftCorner);
        this.update_corner(Main.panel._rightCorner);

        this._log("corners updated.");
    }

    /// Updates the given corner.
    update_corner(corner) {
        // bind corner style to the panel style
        Main.panel.bind_property('style', corner, 'style', SYNC_CREATE);

        // add corner to the panel
        Main.panel.add_child(corner);

        // update its style, showing it
        corner.vfunc_style_changed();

        // connect to each preference change from the extension, allowing the
        // corner to be updated when the user changes preferences
        this._prefs.keys.forEach(key => {
            this._connections.connect(
                this._prefs.settings,
                'changed::' + key.name,
                corner.vfunc_style_changed.bind(corner)
            );
        });
    }

    /// Removes existing corners.
    ///
    /// It is meant to destroy entirely old corners, except if they were saved
    /// by the extension on load; in which case it keep them intact to restore
    /// them on extension disable.
    remove() {
        // disconnect every signal created by the extension
        this._connections.disconnect_all();

        let panel = Main.panel;

        // disable each corner

        if (panel._leftCorner) {
            this.remove_corner(panel._leftCorner);
            delete panel._leftCorner;
        }

        if (panel._rightCorner) {
            this.remove_corner(panel._rightCorner);
            delete panel._rightCorner;
        }
    }

    /// Removes the given corner.
    remove_corner(corner) {
        // remove connections
        corner._remove_connections();

        // remove from panel
        Main.panel.remove_child(corner);

        // destroy the corner
        corner.destroy();
    }

    _log(str) {
        if (this._prefs.DEBUG.get())
            log(`[Panel corners] ${str}`);
    }
};


const PanelCorner = GObject.registerClass(
    class PanelCorner extends St.DrawingArea {
        _init(side, prefs) {
            super._init({ style_class: 'panel-corner' });

            this._side = side;
            this._prefs = prefs;

            this._position_changed_id = Main.panel.connect(
                'notify::position',
                this._update_allocation.bind(this)
            );

            this._size_changed_id = Main.panel.connect(
                'notify::size',
                this._update_allocation.bind(this)
            );

            this._update_allocation();
        }

        _remove_connections() {
            if (this._position_changed_id) {
                Main.panel.disconnect(this._position_changed_id);
                this._position_changed_id = null;
            }
            if (this._size_changed_id) {
                Main.panel.disconnect(this._size_changed_id);
                this._size_changed_id = null;
            }
        }

        _update_allocation() {
            let childBox = new Clutter.ActorBox();

            let cornerWidth, cornerHeight;
            [, cornerWidth] = this.get_preferred_width(-1);
            [, cornerHeight] = this.get_preferred_height(-1);

            let allocWidth = Main.panel.width;
            let allocHeight = Main.panel.height;

            switch (this._side) {
                case St.Side.LEFT:
                    childBox.x1 = 0;
                    childBox.x2 = cornerWidth;
                    childBox.y1 = allocHeight;
                    childBox.y2 = allocHeight + cornerHeight;
                    break;

                case St.Side.RIGHT:
                    childBox.x1 = allocWidth - cornerWidth;
                    childBox.x2 = allocWidth;
                    childBox.y1 = allocHeight;
                    childBox.y2 = allocHeight + cornerHeight;
                    break;
            }

            this.allocate(childBox);
        }

        vfunc_repaint() {
            let node = this.get_theme_node();

            let cornerRadius = Utils.lookup_for_length(node, '-panel-corner-radius', this._prefs);
            let borderWidth = Utils.lookup_for_length(node, '-panel-corner-border-width', this._prefs);

            let backgroundColor = Utils.lookup_for_color(node, '-panel-corner-background-color', this._prefs);

            let cr = this.get_context();
            cr.setOperator(Cairo.Operator.SOURCE);

            cr.moveTo(0, 0);
            if (this._side == St.Side.LEFT) {
                cr.arc(cornerRadius,
                    borderWidth + cornerRadius,
                    cornerRadius, Math.PI, 3 * Math.PI / 2);
            } else {
                cr.arc(0,
                    borderWidth + cornerRadius,
                    cornerRadius, 3 * Math.PI / 2, 2 * Math.PI);
            }
            cr.lineTo(cornerRadius, 0);
            cr.closePath();

            Clutter.cairo_set_source_color(cr, backgroundColor);
            cr.fill();

            cr.$dispose();
        }

        vfunc_style_changed() {
            super.vfunc_style_changed();
            let node = this.get_theme_node();

            let cornerRadius = Utils.lookup_for_length(node, '-panel-corner-radius', this._prefs);
            let borderWidth = Utils.lookup_for_length(node, '-panel-corner-border-width', this._prefs);

            const transitionDuration =
                node.get_transition_duration() / St.Settings.get().slow_down_factor;

            let opacity = Utils.lookup_for_double(node, '-panel-corner-opacity', this._prefs);

            // if using extension values and in overview, set transparent
            if (
                this._prefs.FORCE_EXTENSION_VALUES.get() &&
                Main.panel.get_style_pseudo_class() &&
                Main.panel.get_style_pseudo_class().includes('overview')
            )
                opacity = 0.;

            this._update_allocation();
            this.set_size(cornerRadius, borderWidth + cornerRadius);
            this.translation_y = -borderWidth;

            this.remove_transition('opacity');
            this.ease({
                opacity: opacity * 255,
                duration: transitionDuration,
                mode: Clutter.AnimationMode.EASE_IN_OUT_QUAD,
            });
        }

        _log(str) {
            if (this._prefs.DEBUG.get())
                log(`[Panel corners] ${str}`);
        }
    }
);
