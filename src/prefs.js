'use strict';

const { Adw, Gdk, GLib, Gtk, GObject, Gio } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const { Prefs, Type } = Me.imports.conveniences.settings;

const Keys = [
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
];

const Preferences = new Prefs(Keys);


var MainPage = GObject.registerClass({
    GTypeName: 'MainPage',
    Template: `file://${GLib.build_filenamev([Me.path, 'ui', 'main_page.ui'])}`,
    InternalChildren: [
        'panel_corners',
        'panel_corner_radius',
        'panel_corner_color',
        'panel_corner_opacity',
        'panel_radius_adjustment',
        'panel_opacity_adjustment',

        'screen_corners',
        'screen_corner_radius',
        'screen_corner_color',
        'screen_corner_opacity',
        'screen_opacity_adjustment',
        'screen_opacity_adjustment',

        'force_extension_values',
        'debug',
    ],
}, class MainPage extends Adw.PreferencesPage {
    constructor(props = {}) {
        super(props);

        // Panel corners
        Preferences.settings.bind('panel-corners', this._panel_corners, 'state', Gio.SettingsBindFlags.DEFAULT);
        Preferences.settings.bind('panel-corner-radius', this._panel_radius_adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
        Preferences.settings.bind('panel-corner-opacity', this._panel_opacity_adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);

        // Screen corners
        Preferences.settings.bind('screen-corners', this._screen_corners, 'state', Gio.SettingsBindFlags.DEFAULT);
        Preferences.settings.bind('screen-corner-radius', this._screen_radius_adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
        Preferences.settings.bind('screen-corner-opacity', this._screen_opacity_adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);

        // Advanced
        Preferences.settings.bind('force-extension-values', this._force_extension_values, 'state', Gio.SettingsBindFlags.DEFAULT);
        Preferences.settings.bind('debug', this._debug, 'state', Gio.SettingsBindFlags.DEFAULT);
    }
});


function init() { }

function fillPreferencesWindow(window) {
    let main_page = new MainPage();
    window.add(main_page);
    window.search_enabled = true;
    window.set_default_size(720, 580);
}
