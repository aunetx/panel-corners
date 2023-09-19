declare const enum Type {
  B = 'Boolean',
  I = 'Integer',
  D = 'Double',
  S = 'String',
}

export type KeyType = {
  type: Type.B;
  name: 'panel-corners' | 'screen-corners' | 'debug' | 'force-extension-values';
} | {
  type: Type.I|Type.D
  name: 'panel-corner-radius' | 'panel-corner-border-width' | 'panel-corner-opacity' | 'screen-corner-radius' | 'screen-corner-opacity';
} | {
  type: Type.S;
  name: `${'panel'|'screen'}-corner-background-color`
};

export type PrefsKey =
  | 'PANEL_CORNERS'
  | 'SCREEN_CORNERS'
  | 'DEBUG'
  | 'FORCE_EXTENSION_VALUES'
  | 'PANEL_CORNER_RADIUS'
  | 'PANEL_CORNER_BORDER_WIDTH'
  | 'PANEL_CORNER_BACKGROUND_COLOR'
  | 'PANEL_CORNER_OPACITY'
  | 'SCREEN_CORNER_RADIUS'
  | 'SCREEN_CORNER_BACKGROUND_COLOR'
  | 'SCREEN_CORNER_OPACITY'

