UUID = panel-corners@aunetx
EXT_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)/

.PHONY: build pkg install remove clean


build: clean
	mkdir -p build/
	cp -r src/* build/
	glib-compile-schemas schemas
	cp -r schemas build/schemas


pkg: build
	mkdir -p pkg/
	cd build/ && zip -r ../pkg/$(UUID).zip .


install: build remove
	mkdir -p $(EXT_DIR)
	cp -r build/* $(EXT_DIR)


remove:
	rm -rf $(EXT_DIR)


clean:
	rm -rf pkg/ build/
