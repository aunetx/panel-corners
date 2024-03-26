# Panel corners

[<img src="https://github.com/aunetx/files_utils/raw/master/get_it_on_gnome_extensions.png" height="100" align="right">](https://extensions.gnome.org/extension/4805/panel-corners/)

A GNOME shell extension to keep the old topbar corners, which were removed for GNOME 42. It also allows you to customize the rounded corners, even if you use GNOME 40 or 41.

- if your GNOME shell theme still supports rounded corners (which is the case for Adwaita until GNOME 42), then this extension will provide them.
- else, this extension will provide them, and manage automatically the corners settings: the radius, background-color, ... which are normally set by the theme are then managed by the extension directly.

If your theme supports panel corners but you want to customize them anyway, you can set the setting `force-extension-values` to `true` (see [Customization](https://github.com/aunetx/panel-corners/edit/master/README.md#Customization)).


A very big part of the code is directly ported from the [official GNOME shell repository](https://gitlab.gnome.org/GNOME/gnome-shell), so the immense majority of the work was done by various gnome contributors. All this extension does is integrate the previous code as an extension, provide some configuration options and make all of this compatible for GNOME 42 and later.

The bottom corners code is directly ported from [this merge request by Alice Mikhaylenko](https://gitlab.gnome.org/GNOME/gnome-shell/-/merge_requests/1328) to have roundness on every corner of every screen.

## Installation

The extension is available on [extensions.gnome.org](https://extensions.gnome.org/extension/4805/panel-corners/).

Otherwise, you can install the extension locally with:

```sh
make install
```

You can build a pkg with

```sh
make pkg
```

Don't forget to reload the shell after installing, and to enable the extension.

## Customization

GUI preferences should come soon, you can use dconf/gsettings to change extension settings if you want to test them early:

```sh
# you first need to build
make build

# then change any preference
gsettings --schemadir=build/schemas set org.gnome.shell.extensions.panel-corners preference value
```

You can see available preferences in `schemas/org.gnome.shell.extensions.panel-corners.gschemas.xml`.

## Versions support

This extension was created for GNOME 42 and later, but was backward-compatible. Last versions are not, because they only are compatibility updates.

Supported GNOME shell versions are:

- GNOME shell 46 : up to version 10
- GNOME shell 45 : up to version 9 and version 11
- GNOME shell 42, 43, 44 : up to version 7
- GNOME shell 40, 41 : up to version 3

## License

This extensions is licensed under GPLv3.
