'use strict';

const { Adw, Gdk, GLib, Gtk, GObject, Gio } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const { Prefs, Type } = Me.imports.conveniences.settings;

const Keys = [
    { type: Type.B, name: "force-extension-values" },
    { type: Type.B, name: "screen-corners" },
    { type: Type.B, name: "panel-corners" },
    { type: Type.I, name: "panel-corner-radius" },
    { type: Type.I, name: "panel-corner-border-width" },
    { type: Type.S, name: "panel-corner-background-color" },
    { type: Type.D, name: "panel-corner-opacity" },
    { type: Type.B, name: "debug" },
];

const Preferences = new Prefs(Keys);


var MainPage = GObject.registerClass({
    GTypeName: 'MainPage',
    Template: `file://${GLib.build_filenamev([Me.path, 'ui', 'main_page.ui'])}`,
    InternalChildren: [
        'radius_adjustment',
        'opacity_adjustment',
        'panel_corners',
        'force_extension_values',
        'panel_corner_radius',
        'panel_corner_color',
        'panel_corner_opacity',
        'screen_corners',
        'debug',
    ],
}, class MainPage extends Adw.PreferencesPage {
    constructor(props = {}) {
        super(props);

        this._radius_adjustment.value = 16;

        //Preferences.settings.bind('panel-corner-radius', this._radius_adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
    }
});


function init() { }

function fillPreferencesWindow(window) {
    let main_page = new MainPage();
    window.add(main_page);
    window.search_enabled = true;
    window.set_default_size(720, 490);
}
