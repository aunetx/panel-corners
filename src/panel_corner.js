import Clutter from 'gi://Clutter';
import St from 'gi://St';
import GObject from 'gi://GObject';
import Cairo from 'cairo';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Utils from './utils.js';

const SYNC_CREATE = GObject.BindingFlags.SYNC_CREATE;


export class PanelCorners {
    #settings;
    #connections;

    constructor(settings, connections) {
        this.#settings = settings;
        this.#connections = connections;
    }

    /**
     * Updates the corners.
     *
     * This removes already existing corners (previously created by the
     * extension, or from the shell itself), and create new ones.
     */
    update() {
        this.#log("updating panel corners...");

        // remove already existing corners
        this.remove();

        // create each corner
        Main.panel._leftCorner = new PanelCorner(
            St.Side.LEFT, this.#settings
        );
        Main.panel._rightCorner = new PanelCorner(
            St.Side.RIGHT, this.#settings
        );

        // update each of them
        this.update_corner(Main.panel._leftCorner);
        this.update_corner(Main.panel._rightCorner);

        this.#log("corners updated.");
    }

    /**
     * Updates the given corner.
     */
    update_corner(corner) {
        // bind corner style to the panel style
        Main.panel.bind_property('style', corner, 'style', SYNC_CREATE);

        // add corner to the panel
        Main.panel.add_child(corner);

        // update its style, showing it
        corner.vfunc_style_changed();

        const actor = (this.#settings.settings);

        // connect to each preference change from the extension, allowing the
        // corner to be updated when the user changes preferences
        this.#settings.keys.forEach(key => {
            this.#connections.connect(
                actor,
                'changed::' + key.name,
                corner.vfunc_style_changed.bind(corner)
            );
        });
    }

    /**
     * Removes existing corners.
     *
     * It is meant to destroy entirely old corners, except if they were saved
     * by the extension on load; in which case it keep them intact to restore
     * them on extension disable.
     */
    remove() {
        // disconnect every signal created by the extension
        this.#connections.disconnect_all();

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

    /**
     * Removes the given corner.
     */
    remove_corner(corner) {
        // remove connections
        corner.remove_connections();

        // remove from panel
        Main.panel.remove_child(corner);

        // destroy the corner
        corner.destroy();
    }

    #log(str) {
        if (this.#settings.DEBUG.get())
            console.log(`[Panel corners] ${str}`);
    }
}


export class PanelCorner extends St.DrawingArea {
    static {
        GObject.registerClass(this);
    }

    #side;
    #settings;

    #position_changed_id = Main.panel.connect(
        'notify::position',
        this.#update_allocation.bind(this)
    );

    #size_changed_id = Main.panel.connect(
        'notify::size',
        this.#update_allocation.bind(this)
    );


    constructor(side, settings) {
        super({ style_class: 'panel-corner' });

        this.#side = side;
        this.#settings = settings;

        this.#update_allocation();
    }

    remove_connections() {
        if (this.#position_changed_id) {
            Main.panel.disconnect(this.#position_changed_id);
            this.#position_changed_id = null;
        }
        if (this.#size_changed_id) {
            Main.panel.disconnect(this.#size_changed_id);
            this.#size_changed_id = null;
        }
    }

    #update_allocation() {
        let childBox = new Clutter.ActorBox();

        let cornerWidth, cornerHeight;
        [, cornerWidth] = this.get_preferred_width(-1);
        [, cornerHeight] = this.get_preferred_height(-1);

        let allocWidth = Main.panel.width;
        let allocHeight = Main.panel.height;

        switch (this.#side) {
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

        let cornerRadius = Utils.lookup_for_length(node, '-panel-corner-radius', this.#settings);
        let borderWidth = Utils.lookup_for_length(node, '-panel-corner-border-width', this.#settings);

        let backgroundColor = Utils.lookup_for_color(node, '-panel-corner-background-color', this.#settings);

        let cr = this.get_context();
        cr.setOperator(Cairo.Operator.SOURCE);

        cr.moveTo(0, 0);
        if (this.#side == St.Side.LEFT) {
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

        let cornerRadius = Utils.lookup_for_length(node, '-panel-corner-radius', this.#settings);
        let borderWidth = Utils.lookup_for_length(node, '-panel-corner-border-width', this.#settings);

        const transitionDuration =
            node.get_transition_duration() / St.Settings.get().slow_down_factor;

        let opacity = Utils.lookup_for_double(node, '-panel-corner-opacity', this.#settings);

        // if using extension values and in overview, set transparent
        if (
            this.#settings.FORCE_EXTENSION_VALUES.get() &&
            Main.panel.get_style_pseudo_class() &&
            Main.panel.get_style_pseudo_class().includes('overview')
        )
            opacity = 0.;

        this.#update_allocation();
        this.set_size(cornerRadius, borderWidth + cornerRadius);
        this.translation_y = -borderWidth;

        this.remove_transition('opacity');
        this.ease({
            opacity: opacity * 255,
            duration: transitionDuration,
            mode: Clutter.AnimationMode.EASE_IN_OUT_QUAD,
        });
    }

    #log(str) {
        if (this.#settings.DEBUG.get())
            console.log(`[Panel corners] ${str}`);
    }
}
