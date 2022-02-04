'use strict';

const { Clutter, St, GObject } = imports.gi;
const Main = imports.ui.main;
const Cairo = imports.cairo;

const Me = imports.misc.extensionUtils.getCurrentExtension();

const ValueType = {
    Lenght: 'Lenght',
    Color: 'Color',
    Double: 'Double'
};

var PanelCorner = GObject.registerClass(
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

        _lookup_for(node, prop, kind) {
            const use_extension_values = this._prefs.FORCE_EXTENSION_VALUES.get();

            if (!use_extension_values) {
                let lookup;
                switch (kind) {
                    case ValueType.Lenght:
                        lookup = node.lookup_length(prop, false);
                        break;
                    case ValueType.Color:
                        lookup = node.lookup_color(prop, false);
                        break;
                    case ValueType.Double:
                        lookup = node.lookup_double(prop, false);
                        break;
                }

                if (lookup[0]) {
                    return lookup[1];
                } else {
                    this._log(`prop ${prop} not found in theme node`);
                }
            }

            if (kind == ValueType.Color) {
                let color = this._prefs.get_prop(prop).get();
                return this._parse_color_from(color);
            } else {
                return this._prefs.get_prop(prop).get();
            }
        }

        _parse_color_from(color) {
            let color_parsed = Clutter.color_from_string(color);
            if (color_parsed[0]) {
                return color_parsed[1];
            } else {
                this._log(`could not parse color ${color_string}, defaulting to black`);
                this._prefs.get_prop(prop).set('#000000ff');
                return Clutter.color_from_string('#000000ff')[1];
            }
        }

        vfunc_repaint() {
            let node = this.get_theme_node();

            let cornerRadius = this._lookup_for(node, '-panel-corner-radius', ValueType.Lenght);
            let borderWidth = this._lookup_for(node, '-panel-corner-border-width', ValueType.Lenght);

            let backgroundColor = this._lookup_for(node, '-panel-corner-background-color', ValueType.Color);

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

            let cornerRadius = this._lookup_for(node, '-panel-corner-radius', ValueType.Lenght);
            let borderWidth = this._lookup_for(node, '-panel-corner-border-width', ValueType.Lenght);

            const transitionDuration =
                node.get_transition_duration() / St.Settings.get().slow_down_factor;

            // TODO smoothly remove corner in overview if using extension opacity
            const opacity = this._lookup_for(node, '-panel-corner-opacity', ValueType.Double);

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
