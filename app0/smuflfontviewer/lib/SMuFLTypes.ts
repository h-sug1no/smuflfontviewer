/**
 * Copyright (c) 2021 h-sug1no
 */
export type Dict<T> = { [key: string]: T };

/**
 * SMuFL codepoint string. ex...: 'U+E06E'.
 */
export type UCodepointStr = string;

/**
 * SMuFL glyphname string. ex...: '4stringTabClef'.
 */
export type GlyphnameStr = string;

/**
 * SMuFL class name string. ex...: 'accidentals'.
 */
export type ClassnameStr = string;

/**
 * SMuFL range name string. ex...: 'accordion'.
 */
export type RangenameStr = string;

///////////////////////////////////////////////////////////

export type GlyphnameItem = {
  /**
   * @type UCodepointStr
   */
  codepoint?: UCodepointStr;

  /**
   * @type UCodepointStr
   */
  alternateCodepoint?: UCodepointStr;
  description?: string;
};

/**
 * SMuFL glyphnames dict. key is UCodepointStr.
 */
export type Glyphnames = Dict<GlyphnameItem>;

/**
 * SMuFL class item:  array of GlyphnameStr.
 */
export type ClassItem = Array<string>;

/**
 * SMuFL classes dict. key is ClassnameStr.
 */
export type Classes = Dict<ClassItem>;

export type RangeItem = {
  description?: string;
  glyphs: Array<GlyphnameStr>;
  range_end: UCodepointStr;
  range_start: UCodepointStr;
};

export type SFVRangeItem = RangeItem & {
  nStart?: number;
  nEnd?: number;
};

/**
 * SMuFL ranges dict. key is RangenameStr.
 */
export type Ranges = Dict<SFVRangeItem>;
