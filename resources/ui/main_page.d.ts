import Adw from "gi://Adw";
import Gtk from "gi://Gtk?version=4.0";
import GObject from "gi://GObject";

export declare class Controls extends Adw.PreferencesPage {
  _panel_corners: Gtk.Switch;
  _panel_corner_color: Gtk.ColorDialogButton;
  _panel_radius_adjustment: GObject.Object;
  _panel_opacity_adjustment: GObject.Object;
  _screen_corners: GObject.Object;
  _screen_corner_color: Gtk.ColorDialogButton;
  _screen_radius_adjustment: GObject.Object;
  _screen_opacity_adjustment: GObject.Object;
  _force_extension_values: GObject.Object;
  _debug: GObject.Object;
}
