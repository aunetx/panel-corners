'use strict';

const { Adw, Gdk, GLib, Gtk, GObject } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();


var MainPage = GObject.registerClass({
    GTypeName: 'MainPage',
    Template: `file://${GLib.build_filenamev([Me.path, 'ui', 'main_page.ui'])}`,
    InternalChildren: [
        'force_extension_values'
    ],
}, class MainPage extends Adw.PreferencesPage {
    constructor(props = {}) {
        super(props);
        const settings = new Gio.Settings({ schema: 'org.gnome.shell.extensions.panel-corners' });

        settings.bind('force-extension-values', this._force_extension_values, 'uri', Gio.SettingsBindFlags.DEFAULT);
    }
});


/**
 * Initialize the preferences.
 */
function init() { }

/**
 * Fill the PreferencesWindow.
 *
 * @param {Adw.PreferencesWindow} window The PreferencesWindow to fill.
 */
function fillPreferencesWindow(window) {
    let main_page = new MainPage();
    window.add(main_page);
    window.search_enabled = true;
    window.set_default_size(720, 490);
}

/**
 * prefs widget
 *
 * @returns {Gtk.Widget}
 */
function buildPrefsWidget() {
    return getPrefs().getMainPrefs(UIFolderPath, binFolderPath, gettextDomain);
}
