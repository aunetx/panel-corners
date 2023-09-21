import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

import { Connections } from './conveniences/connections.js';
import { Settings, Type } from './conveniences/settings.js';

import { PanelCorners } from './panel_corner.js';
import { ScreenCorners } from './screen_corner.js';

const Keys = ([
    { type: Type.B, name: "panel-corners" },
    { type: Type.I, name: "panel-corner-radius" },
    { type: Type.I, name: "panel-corner-border-width" },
    { type: Type.S, name: "panel-corner-background-color" },
    { type: Type.D, name: "panel-corner-opacity" },

    { type: Type.B, name: "screen-corners" },
    { type: Type.I, name: "screen-corner-radius" },
    { type: Type.S, name: "screen-corner-background-color" },
    { type: Type.D, name: "screen-corner-opacity" },

    { type: Type.B, name: "force-extension-values" },
    { type: Type.B, name: "debug" },
]);


export default class PanelCornersExtension extends Extension {
    #settings;
    #connections;
    #panel_corners;
    #screen_corners;

    /** Called on extension enable. */
    enable() {
        this.#settings = new Settings(Keys, this.getSettings());
        this.#connections = new Connections;

        this.#log("starting up...");

        this.#connections.connect(
            Main.layoutManager,
            'monitors-changed',
            () => this.update()
        );

        this.#connections.connect(
            global.display,
            'workareas-changed',
            () => this.update()
        );

        // load the extension when the shell has finished starting up
        if (Main.layoutManager._startingUp)
            this.#connections.connect(
                Main.layoutManager,
                'startup-complete',
                this.load.bind(this)
            );
        else
            this.load();
    }

    /**
     * Called when the shell has finished starting up.
     *
     * It create our new corners.
     */
    load() {
        // create the panel corners manager
        this.create_panel_corners();

        // create the screen corners manager if needed
        this.create_screen_corners();

        // create and update the panel corners manager if the preference is
        // changed
        this.#settings.PANEL_CORNERS.changed(() => {
            this.create_panel_corners();
            this.update();
        });

        // create and update the screen corners manager if the preference is
        // changed
        this.#settings.SCREEN_CORNERS.changed(() => {
            this.create_screen_corners();
            this.update();
        });

        // finally update our corners
        this.update();
    }

    /**
     * Creates the panel corners manager if needed.
     *
     * If panel corners are deactivated, the existing corners are destroyed.
     */
    create_panel_corners() {
        this.#panel_corners?.remove();
        this.#panel_corners &&= null;
        if (this.#settings.PANEL_CORNERS.get()) {
            this.#panel_corners = new PanelCorners(
                this.#settings, new Connections
            );
        }
    }

    /**
     * Creates the screen corners manager if needed.
     *
     * If screen corners are deactivated, the existing corners are destroyed.
     */
    create_screen_corners() {
        this.#screen_corners?.remove();
        this.#screen_corners &&= null;
        if (this.#settings.SCREEN_CORNERS.get()) {
            this.#screen_corners = new ScreenCorners(
                this.#settings, new Connections
            );
        }
    }

    /** Updates the corners. */
    update() {
        this.#log("updating corners...");
        this.#panel_corners?.update();
        this.#screen_corners?.update();
        this.#log("corners updated.");
    }

    /**
     * Removes existing corners.
     *
     * It is meant to destroy entirely old corners, except if they were saved
     * by the extension on load; in which case it keep them intact to restore
     * them on extension disable.
     */
    remove() {
        this.#panel_corners?.remove();
        this.#screen_corners?.remove();
    }

    /** Disables the extension. */
    disable() {
        this.remove();
        this.#connections.disconnect_all();
        this.#log("extension disabled.");
        this.#panel_corners = null;
        this.#screen_corners = null;
        this.#connections = null;
        this.#settings = null;
    }

    #log(str) {
        if (this.#settings.DEBUG.get())
            console.log(`[Panel corners] ${str}`);
    }
}
