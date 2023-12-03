NAME = panel-corners
UUID = $(NAME)@aunetx


.PHONY: build install pot test-shell test-prefs remove clean


build: clean
	mkdir -p build/
	cd src && gnome-extensions pack -f \
			--extra-source=../metadata.json \
			--extra-source=../resources/ui \
			--extra-source=./conveniences \
			--extra-source=./utils.js \
			--extra-source=./panel_corner.js \
			--extra-source=./screen_corner.js \
			--schema=../schemas/org.gnome.shell.extensions.$(NAME).gschema.xml \
			-o ../build


install: build remove
	gnome-extensions install -f build/$(UUID).shell-extension.zip


test-prefs: install
	gnome-extensions prefs $(UUID)


test-shell: install
	env GNOME_SHELL_SLOWDOWN_FACTOR=2 \
		MUTTER_DEBUG_DUMMY_MODE_SPECS=1500x1000 \
	 	MUTTER_DEBUG_DUMMY_MONITOR_SCALES=1 \
		dbus-run-session -- gnome-shell --nested --wayland


remove:
	rm -rf $(HOME)/.local/share/gnome-shell/extensions/$(UUID)


clean:
	rm -rf build/ po/*.mo