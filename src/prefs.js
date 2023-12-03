import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { Settings, Type } from './conveniences/settings.js';

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

function parse_color_from_setting(setting, widget) {
    let color_string = setting.get();
    let color_parsed = new Gdk.RGBA;
    let is_parsed = color_parsed.parse(color_string);

    if (is_parsed) {
        widget.set_rgba(color_parsed);
    } else {
        // could not parse color, defaulting to black
        setting.set('#000000ff');
    }
};

class MainPage extends (Adw.PreferencesPage) {
    static {
        GObject.registerClass({
            GTypeName: 'MainPage',
            Template: GLib.uri_resolve_relative(import.meta.url, './ui/main_page.ui', GLib.UriFlags.NONE),
            InternalChildren: [
                'panel_corners',
                'panel_corner_color',
                'panel_radius_adjustment',
                'panel_opacity_adjustment',

                'screen_corners',
                'screen_corner_color',
                'screen_radius_adjustment',
                'screen_opacity_adjustment',

                'force_extension_values',
                'debug',
            ],
        }, this);
    }

    static fromPreferences(preferences) {
        const page = new this();
        page.#initPreferences(preferences);
        return page;
    }

    #initPreferences(preferences) {
        this.preferences = preferences;

        // Panel corners
        this.preferences.settings.bind('panel-corners', this._panel_corners, 'state', Gio.SettingsBindFlags.DEFAULT);
        this.preferences.settings.bind('panel-corner-radius', this._panel_radius_adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
        this.preferences.settings.bind(
            'panel-corner-opacity',
            this._panel_opacity_adjustment,
            'value',
            Gio.SettingsBindFlags.DEFAULT,
        );
        this.preferences.PANEL_CORNER_BACKGROUND_COLOR.changed(_ => {
            parse_color_from_setting(this.preferences.PANEL_CORNER_BACKGROUND_COLOR, this._panel_corner_color);
        });
        this._panel_corner_color.connect('color-set', _ => {
            let color = this._panel_corner_color.rgba.to_string();
            this.preferences.PANEL_CORNER_BACKGROUND_COLOR.set(color);
        });
        parse_color_from_setting(this.preferences.PANEL_CORNER_BACKGROUND_COLOR, this._panel_corner_color);

        // Screen corners
        this.preferences.settings.bind('screen-corners', this._screen_corners, 'state', Gio.SettingsBindFlags.DEFAULT);
        this.preferences.settings.bind('screen-corner-radius', this._screen_radius_adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
        this.preferences.settings.bind('screen-corner-opacity', this._screen_opacity_adjustment, 'value', Gio.SettingsBindFlags.DEFAULT);
        this.preferences.SCREEN_CORNER_BACKGROUND_COLOR.changed(_ => {
            parse_color_from_setting(this.preferences.SCREEN_CORNER_BACKGROUND_COLOR, this._screen_corner_color);
        });
        this._screen_corner_color.connect('color-set', _ => {
            let color = this._screen_corner_color.rgba.to_string();
            this.preferences.SCREEN_CORNER_BACKGROUND_COLOR.set(color);
        });
        parse_color_from_setting(this.preferences.SCREEN_CORNER_BACKGROUND_COLOR, this._screen_corner_color);

        // Advanced
        this.preferences.settings.bind('force-extension-values', this._force_extension_values, 'state', Gio.SettingsBindFlags.DEFAULT);
        this.preferences.settings.bind('debug', this._debug, 'state', Gio.SettingsBindFlags.DEFAULT);
    }
}

export default class ForgeExtentionPreferences extends ExtensionPreferences {
    init() { }

    /**
     * Fill the preferences window with preferences.
     *
     * The default implementation adds the widget
     * returned by getPreferencesWidget().
     */
    fillPreferencesWindow(window) {
        this.preferences = new Settings(Keys, this.getSettings());
        window.add(MainPage.fromPreferences(this.preferences, this.path));
        window.search_enabled = true;
        window.set_default_size(720, 530);
    }
}
