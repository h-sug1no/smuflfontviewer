/**
 * Copyright (c) 2020 h-sug1no
 */

import {
  Dict,
  Glyphnames,
  Classes,
  Ranges,
  Sets,
  GlyphsWithAlternates,
  OptionalGlyphs,
  OptionalGlyphItem,
} from './SMuFLTypes';
import { UCodePoint } from './UCodePoint';

export interface SearchOptions {
  isOptionalGlyph?: boolean;
  searchOptional?: boolean;
  fontName?: string;
}

export class FontMetadata {
  fontName?: string;
  fontVersion?: string;
  sets?: Sets;
  glyphsWithAlternates?: GlyphsWithAlternates;
  optionalGlyphs?: OptionalGlyphs;
}

export class FontInfo {
  fontMetadata_: FontMetadata;
  setsByAlternateFor?: Dict<any>;
  setsByName?: Dict<any>;
  alternateFors?: Dict<any>;
  alternateCodepointFors?: Dict<any>;
  glyphsByUCodepoint?: Dict<any>;
  optClasses?: Dict<Array<any>>;
  optRange?: {
    description: string;
    noSpecLink: boolean;
    nEnd: number;
    nStart: number;
    range_end: any;
    range_start: any;
  };
  computedClasses?: { smuflClasses: any; optClasses: Dict<Array<any>>; classes: Dict<Array<any>> };
  constructor(fontMetadata: FontMetadata) {
    this.fontMetadata_ = fontMetadata;
  }
}

export class Data {
  [key: string]: any;
  fontMetadata_?: FontMetadata;
  glyphnames?: Glyphnames;
  classes?: Classes;
  ranges?: Ranges;
}

export class Database {
  data_: Data;
  urls_?: Dict<string>;
  initErrors_?: Array<string>;
  fontInfos_?: Dict<FontInfo>;

  constructor() {
    this.data_ = new Data();
  }

  init(options: { get(key: string): string }): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    const urlKeys: Array<string> = ['fontMetadata', 'glyphnames', 'classes', 'ranges'];
    const urls: Dict<string> = (this.urls_ = {});

    urlKeys.forEach((key) => {
      const tKey = key + 'Url';
      urls[key] = options.get(tKey);
    });

    this.initErrors_ = [];
    Object.keys(urls).forEach((key) => {
      fetch(urls[key])
        .then((response) => {
          if (response.status !== 200) {
            this.initErrors_?.push(
              'Looks like there was a problem. Status Code: ' + response.status + ': ' + urls[key],
            );
            return;
          }

          // Examine the text in the response
          response.json().then((d) => {
            const dataKey = `${key}${key === 'fontMetadata' ? '_' : ''}`;
            this.data_[dataKey] = d;
          });
        })
        .catch((err) => {
          this.initErrors_?.push('Fetch Error :' + err);
        });
    });

    const resolveData = () => {
      this.fontInfos_ = this.fontInfos_ || {};
      const fontMetadata = this.data_.fontMetadata_;
      delete this.data_.fontMetadata_;

      if (!fontMetadata) {
        return;
      }

      const fontInfoKey = `${fontMetadata.fontName}/${fontMetadata.fontVersion}`;
      const fontInfo = (this.fontInfos_[fontInfoKey] = new FontInfo(fontMetadata));
      fontInfo.setsByAlternateFor = {};
      const setsByAlternateFor = fontInfo.setsByAlternateFor;
      fontInfo.setsByName = {};
      const setsByName = fontInfo.setsByName;

      const sets: Record<string, any> = fontMetadata.sets || {};
      if (sets) {
        Object.keys(sets).forEach((key) => {
          const set = sets[key];
          set.glyphs.forEach((glyph: any) => {
            const mapItem = {
              setName: key,
              set: set,
              glyph: glyph,
            };
            const gAlternateFor: string = glyph.alternateFor;

            const sbafItem = (setsByAlternateFor[gAlternateFor] =
              setsByAlternateFor[gAlternateFor] || []);
            sbafItem.push(mapItem);

            const sbnItem = (setsByName[glyph.name] = setsByName[glyph.name] || []);
            sbnItem.push(mapItem);
          });
        });
      }

      fontInfo.alternateFors = {};
      const alternateFors = fontInfo.alternateFors;
      const glyphsWithAlternates: Record<string, any> = fontMetadata.glyphsWithAlternates || {};
      if (glyphsWithAlternates) {
        Object.keys(glyphsWithAlternates).forEach(function (key) {
          const tAlternates = glyphsWithAlternates[key].alternates;
          tAlternates.forEach(function (v: any) {
            const tAlternateFors = (alternateFors[v.name] = alternateFors[v.name] || []);
            tAlternateFors.push(key);
          });
        });
      }

      fontInfo.alternateCodepointFors = {};
      const alternateCodepointFors = fontInfo.alternateCodepointFors;
      fontInfo.glyphsByUCodepoint = {};
      const glyphsByUCodepoint = fontInfo.glyphsByUCodepoint;

      fontInfo.optClasses = {};
      const optClasses = fontInfo.optClasses;
      fontInfo.optRange = {
        description: `optionalGlyphs: ${fontInfoKey}`,
        noSpecLink: true,
        nEnd: -Infinity,
        nStart: Infinity,
        range_end: undefined,
        range_start: undefined,
      };
      const optRange = fontInfo.optRange;

      [
        { names: this.data_.glyphnames, isOptionalGlyph: false },
        { names: fontMetadata.optionalGlyphs, isOptionalGlyph: true },
      ].forEach(function (namesDef) {
        const names = namesDef.names || {};
        Object.keys(names).forEach(function (key) {
          const name = names[key];
          const cp = name.codepoint;
          if (cp) {
            if (glyphsByUCodepoint[cp]) {
              console.error(
                `duplicate codepoint: ${cp}: ${key}, ${glyphsByUCodepoint[cp].glyphname}`,
              );
            }
            const glyphItem = {
              glyphname: key,
              isOptionalGlyph: namesDef.isOptionalGlyph,
            };
            glyphsByUCodepoint[cp] = glyphItem;

            // alternateCodepoint: ...the Unicode Musical Symbols range code point
            // (if applicable) provided as the value for the "alternateCodepoint" key.
            const alternateCodepoint = name.alternateCodepoint;
            if (alternateCodepoint) {
              const glyphs = (alternateCodepointFors[alternateCodepoint] =
                alternateCodepointFors[alternateCodepoint] || []);
              glyphs.push(glyphItem);
            }
          }

          if (!namesDef.isOptionalGlyph) {
            return;
          }

          const optName: OptionalGlyphItem = name;
          // compute some data from optionalGlyphs.
          if (optName.classes) {
            optName.classes.forEach(function (clazz: string) {
              optClasses[clazz] = optClasses[clazz] || [];
              optClasses[clazz].push(key);
            });
          }

          if (cp) {
            const nCp: number = UCodePoint.fromUString(cp).toNumber();
            if (nCp < optRange.nStart) {
              optRange.nStart = nCp;
              optRange.range_start = cp;
            }
            if (nCp > optRange.nEnd) {
              optRange.nEnd = nCp;
              optRange.range_end = cp;
            }
          }
        });
      });

      // resolve optionalGlyphs classes.
      fontInfo.computedClasses = {
        smuflClasses: this.data_.classes,
        optClasses: optClasses,
        classes: {},
      };
      const computedClasses = fontInfo.computedClasses;
      Object.keys(computedClasses.classes)
        .concat(Object.keys(computedClasses.optClasses))
        .forEach(function (className: string) {
          const classes: Dict<Array<any>> = computedClasses.classes;
          if (!classes[className]) {
            classes[className] = (computedClasses.smuflClasses[className] || []).concat(
              computedClasses.optClasses[className] || [],
            );
          }
        });
    };

    return new Promise(function (resolve) {
      function t() {
        if (
          that.data_.fontMetadata_ &&
          that.data_.classes &&
          that.data_.glyphnames &&
          that.data_.ranges
        ) {
          resolveData();
          resolve(that);
        } else if (that.initErrors_?.length) {
          resolve(that);
        } else {
          window.setTimeout(t, 300);
        }
      }
      window.setTimeout(t, 300);
    });
  }

  getFontInfo(fontName?: string): any {
    const fontInfos = this.fontInfos_ || {};
    fontName = fontName || Object.keys(fontInfos)[0];
    return fontInfos[fontName];
  }

  fontMetadata(fontName?: string): any {
    const fontInfo = this.getFontInfo(fontName);
    return fontInfo ? fontInfo.fontMetadata_ : undefined;
  }

  ensureUCodepoint(uCodepoint: string): string {
    return UCodePoint.fromUString(uCodepoint).toUString();
  }

  uCodepoint2Glyphname(uCodepoint: string, options: SearchOptions = {}): string | undefined {
    const fontInfo = this.getFontInfo(options.fontName);
    let ret: string | undefined;
    if (!fontInfo || !fontInfo.glyphsByUCodepoint) {
      return ret;
    }
    uCodepoint = this.ensureUCodepoint(uCodepoint);
    const glyph = fontInfo.glyphsByUCodepoint[uCodepoint];
    if (glyph) {
      ret = glyph.glyphname;
      if (glyph.isOptionalGlyph && !options.searchOptional) {
        ret = undefined;
      }
      if (ret && glyph.isOptionalGlyph) {
        options.isOptionalGlyph = true;
      }
    }
    return ret;
  }

  glyphname2uCodepoint(glyphname: string, options: SearchOptions = {}): string | undefined {
    let item = (this.data_.glyphnames || {})[glyphname];
    const fontMetadata = this.fontMetadata();
    if (!item && options.searchOptional && fontMetadata) {
      const optionalGlyphs: any = fontMetadata.optionalGlyphs;
      item = optionalGlyphs[glyphname];
      options.isOptionalGlyph = item !== undefined;
    }
    // fixme: type of
    return (item || { codepoint: undefined }).codepoint;
  }

  glyphname2string(glyphname: string): any {
    return this.glyphname2uCodepoint(glyphname);
  }
}
