'use strict';

const { Clutter, St, GObject } = imports.gi;
const Main = imports.ui.main;
const Cairo = imports.cairo;

const Me = imports.misc.extensionUtils.getCurrentExtension();

var PanelCorner = GObject.registerClass(
    class PanelCorner extends St.DrawingArea {
        _init(side) {
            this._side = side;

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

            let cornerRadius = node.get_length("-panel-corner-radius");
            let borderWidth = node.get_length('-panel-corner-border-width');

            let backgroundColor = node.get_color('-panel-corner-background-color');

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

            let cornerRadius = node.get_length("-panel-corner-radius");
            let borderWidth = node.get_length('-panel-corner-border-width');

            const transitionDuration =
                node.get_transition_duration() / St.Settings.get().slow_down_factor;
            const opacity = node.get_double('-panel-corner-opacity');

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
            log(`[Topbar corners] ${str}`);
        }
    }
);
