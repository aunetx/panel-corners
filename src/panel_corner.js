'use strict';

const { Clutter, St, GObject } = imports.gi;
const Main = imports.ui.main;
const Cairo = imports.cairo;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

const SYNC_CREATE = GObject.BindingFlags.SYNC_CREATE;


var PanelCorners = class PanelCorners {
    constructor(prefs, connections, old_corners) {
        this._prefs = prefs;
        this._connections = connections;
        this._old_corners = old_corners;
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
        Main.panel._leftCorner = new PanelCorner(St.Side.LEFT, this._prefs);
        Main.panel._rightCorner = new PanelCorner(St.Side.RIGHT, this._prefs);

        // update each of them
        this.update_corner(Main.panel._leftCorner);
        this.update_corner(Main.panel._rightCorner);

        this._log("corners updated.");
    }

    /// Updates the given corner.
    update_corner(corner) {
        // bind corner style to the panel style
        Main.panel.bind_property('style', corner, 'style', SYNC_CREATE);

        // add corner to the panel, showing it
        Main.panel.add_child(corner);

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
        // remove from panel
        Main.panel.remove_child(corner);

        // if not an original corner, destroy it
        if (
            !this._old_corners ||
            (this._old_corners && !this._old_corners.includes(corner))
        )
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
            this._side = side;
            this._prefs = prefs;

            super._init({ style_class: 'panel-corner' });
        }

        _findRightmostButton(container) {
            if (!container.get_children)
                return null;

            let children = container.get_children();

            if (!children || children.length == 0)
                return null;

            // Start at the back and work backward
            let index;
            for (index = children.length - 1; index >= 0; index--) {
                if (children[index].visible)
                    break;
            }
            if (index < 0)
                return null;

            if (!(children[index] instanceof St.Widget))
                return null;

            if (!children[index].has_style_class_name('panel-menu') &&
                !children[index].has_style_class_name('panel-button'))
                return this._findRightmostButton(children[index]);

            return children[index];
        }

        _findLeftmostButton(container) {
            if (!container.get_children)
                return null;

            let children = container.get_children();

            if (!children || children.length == 0)
                return null;

            // Start at the front and work forward
            let index;
            for (index = 0; index < children.length; index++) {
                if (children[index].visible)
                    break;
            }
            if (index == children.length)
                return null;

            if (!(children[index] instanceof St.Widget))
                return null;

            if (!children[index].has_style_class_name('panel-menu') &&
                !children[index].has_style_class_name('panel-button'))
                return this._findLeftmostButton(children[index]);

            return children[index];
        }

        setStyleParent(box) {
            let side = this._side;

            let rtlAwareContainer = box instanceof St.BoxLayout;
            if (rtlAwareContainer &&
                box.get_text_direction() == Clutter.TextDirection.RTL) {
                if (this._side == St.Side.LEFT)
                    side = St.Side.RIGHT;
                else if (this._side == St.Side.RIGHT)
                    side = St.Side.LEFT;
            }

            let button;
            if (side == St.Side.LEFT)
                button = this._findLeftmostButton(box);
            else if (side == St.Side.RIGHT)
                button = this._findRightmostButton(box);

            if (button) {
                if (this._button) {
                    if (this._buttonStyleChangedSignalId) {
                        this._button.disconnect(this._buttonStyleChangedSignalId);
                        this._button.style = null;
                    }

                    if (this._buttonDestroySignalId)
                        this._button.disconnect(this._buttonDestroySignalId);
                }

                this._button = button;

                this._buttonDestroySignalId = button.connect('destroy', () => {
                    if (this._button == button) {
                        this._button = null;
                        this._buttonStyleChangedSignalId = 0;
                    }
                });

                // Synchronize the locate button's pseudo classes with this corner
                this._buttonStyleChangedSignalId = button.connect('style-changed',
                    () => {
                        let pseudoClass = button.get_style_pseudo_class();
                        this.set_style_pseudo_class(pseudoClass);
                    });
            }
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
                Main.panel.get_style_pseudo_class().includes('overview')
            )
                opacity = 0.;

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
