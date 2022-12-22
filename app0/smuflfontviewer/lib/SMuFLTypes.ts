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
  [key: string]: string | undefined;
};

/**
 * SMuFL glyphnames dict. key is UCodepointStr.
 */
export type Glyphnames = Dict<GlyphnameItem>;

/**
 * SMuFL class item:  array of GlyphnameStr.
 */
export type ClassItem = Array<GlyphnameStr>;

/**
 * SMuFL classes dict. key is ClassnameStr.
 */
export type Classes = Dict<ClassItem>;

export type RangeItem = {
  description?: string;
  glyphs?: Array<GlyphnameStr>;
  range_end?: UCodepointStr;
  range_start?: UCodepointStr;
};

export type SFVRangeItem = RangeItem & {
  nStart?: number;
  nEnd?: number;
  noSpecLink?: boolean;
};

/**
 * SMuFL ranges dict. key is RangenameStr.
 */
export type Ranges = Dict<SFVRangeItem>;

///////////////////////////////////////////////////////////
// font specific metadata

/**
 * @see https://w3c.github.io/smufl/latest/specification/glyphswithanchors.html
 */

export type GlyphsWithAnchorItem = Dict<number[] | number>;

export const AnchorNames: string[] = [
  'splitStemUpSE',
  'splitStemUpSW',
  'splitStemDownNE',
  'splitStemDownNW',
  'stemUpSE',
  'stemDownNW',
  'stemUpNW',
  'stemDownSW',
  'nominalWidth',
  'numeralTop',
  'numeralBottom',
  'cutOutNE',
  'cutOutSE',
  'cutOutSW',
  'cutOutNW',
  'graceNoteSlashSW',
  'graceNoteSlashNE',
  'graceNoteSlashNW',
  'graceNoteSlashSE',
  'repeatOffset',
  'noteheadOrigin',
  'opticalCenter',
];

export const AnchorDefs: Dict<string[]> = (() => {
  const ret: Dict<string[]> = {};
  AnchorNames.forEach((akey) => {
    let anchorDef;
    if (akey.endsWith('SE')) {
      anchorDef = ['S', 'E'];
    } else if (akey.endsWith('SW')) {
      anchorDef = ['S', 'W'];
    } else if (akey.endsWith('NE')) {
      anchorDef = ['N', 'E'];
    } else if (akey.endsWith('NW')) {
      anchorDef = ['N', 'W'];
    } else if (akey.endsWith('Width')) {
      anchorDef = ['Width'];
    } else if (akey.endsWith('Top')) {
      anchorDef = ['Top'];
    } else if (akey.endsWith('Bottom')) {
      anchorDef = ['Bottom'];
    } else if (akey.endsWith('Offset')) {
      anchorDef = ['Offset'];
    } else if (akey.endsWith('Origin')) {
      anchorDef = ['Origin'];
    } else if (akey.endsWith('Center')) {
      anchorDef = ['Center'];
    }
    if (anchorDef) {
      ret[akey] = anchorDef;
    }
  });
  return ret;
})();

/**
 * @see https://w3c.github.io/smufl/latest/specification/glyphswithalternates.html
 */
export type GlyphsWithAlternateAlternateItem = {
  codepoint?: UCodepointStr;
  name?: GlyphnameStr;
};
export type GlyphsWithAlternateItem = {
  alternates?: Array<GlyphsWithAlternateAlternateItem>;
};

/**
 * @see https://w3c.github.io/smufl/latest/specification/glyphbboxes.html
 */
export type GlyphBBoxItem = {
  bBoxNE?: Array<number>;
  bBoxSW?: Array<number>;
};
/**
 * @see https://w3c.github.io/smufl/latest/specification/ligatures.html
 */

export type LigatureItem = {
  codepoint?: UCodepointStr;
  componentGlyphs?: Array<GlyphnameStr>;
  description?: string;
};

/**
 * SMuFL sets name
 */
export type SetnameStr = string;

/**
 * SMuFL sets type
 */
export type SetTypeStr = string;

export type SetGlyphItem = {
  /**
   * @type UCodepointStr
   */
  codepoint: UCodepointStr;
  /**
   * @type GlyphnameStr
   */
  name: GlyphnameStr;
  /**
   * @type GlyphnameStr
   */
  alternateFor: GlyphnameStr;

  description: string;
};

export type SetItem = {
  /**
   "opticalVariantsSmall" 	Glyphs designed for use on smaller staff sizes.
   "flagsShort" 	Alternate shorter flags for notes with augmentation dots.
   "flagsStraight" 	Alternate flags that are straight rather than curved.
   "timeSigsLarge" 	Alternate time signature digits for use outside the staff.
   "noteheadsLarge" 	Alternate oversized noteheads.
   @type SetTypeStr
   */
  type?: SetTypeStr;
  description?: string;
  glyphs?: Array<SetGlyphItem>;
};

/**
 * @see https://w3c.github.io/smufl/latest/specification/optionalglyphs.html
 */
export type OptionalGlyphItem = GlyphnameItem & {
  classes?: Array<ClassnameStr>;
};

/////////////////////////////////////////////////////////////////////

/**
 *  @see https://w3c.github.io/smufl/latest/specification/engravingdefaults.html
 */
export type EngravingDefaults = Dict<unknown> & {
  textFontFamily?: Array<string>;
  staffLineThickness?: number;
  stemThickness?: number;
  beamThickness?: number;
  beamSpacing?: number;
  legerLineThickness?: number;
  legerLineExtension?: number;
  slurEndpointThickness?: number;
  slurMidpointThickness?: number;
  tieEndpointThickness?: number;
  tieMidpointThickness?: number;
  thinBarlineThickness?: number;
  thickBarlineThickness?: number;
  dashedBarlineThickness?: number;
  dashedBarlineDashLength?: number;
  dashedBarlineGapLength?: number;
  barlineSeparation?: number;
  thinThickBarlineSeparation?: number;
  repeatBarlineDotSeparation?: number;
  bracketThickness?: number;
  subBracketThickness?: number;
  hairpinThickness?: number;
  octaveLineThickness?: number;
  pedalLineThickness?: number;
  repeatEndingLineThickness?: number;
  arrowShaftThickness?: number;
  lyricLineThickness?: number;
  textEnclosureThickness?: number;
  tupletBracketThickness?: number;
  hBarThickness?: number;
};

/**
 * @see https://w3c.github.io/smufl/latest/specification/glyphadvancewidths.html
 SMuFL GlyphAdvanceWidth dict. key is GlyphnameStr.
*/
export type GlyphAdvanceWidth = Dict<number>;

/**
 * SMuFL glyphsWithAnchors dict. key is GlyphnameStr.
 */
export type GlyphsWithAnchors = Dict<GlyphsWithAnchorItem>;

/**
 * SMuFL glyphsWithAlternates dict. key is GlyphnameStr.
 */
export type GlyphsWithAlternates = Dict<GlyphsWithAlternateItem>;

/**
 * SMuFL glyphBBoxes dict. key is GlyphnameStr.
 */
export type GlyphBBoxes = Dict<GlyphBBoxItem>;

/**
 * SMuFL ligatures dict. key is GlyphnameStr.
 */
export type Ligatures = Dict<LigatureItem>;

/**
 * SMuFL sets dict. key is SetnameStr.
 */
export type Sets = Dict<SetItem>;

/**
 * SMuFL optionalGlyphs dict. key is GlyphnameStr;
 */
export type OptionalGlyphs = Dict<OptionalGlyphItem>;
