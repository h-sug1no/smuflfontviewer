/**
 * Copyright (c) 2019 h-sug1no
 */

/* eslint-disable no-console */

// eslint-disable-next-line no-unused-vars
class SMuFLMetadata {

  constructor() {
    this.data = {};
  }

  init(options) {
    let uris = {
      fontMetadata: undefined,
      glyphnames: undefined,
      classes: undefined,
      ranges: undefined
    };

    Object.keys(uris).forEach(function(key) {
      const tKey = key + 'Url';
      uris[key] = options.get(tKey);
    });

    const that = this;
    that.initErrors = [];
    Object.keys(uris).forEach(function(key) {
      fetch(uris[key])
        .then(function(response) {
          if (response.status !== 200) {
            that.initErrors.push(
              'Looks like there was a problem. Status Code: ' +
              response.status + ': ' + uris[key]);
            return;
          }

          // Examine the text in the response
          response.json().then(function(d) {
            that.data[key] = d;
          });
        }
        )
        .catch(function(err) {
          that.initErrors.push('Fetch Error :' + err);
        });
    });

    function resolveData() {
      that.fontInfos = that.fontInfos || {};
      const fontMetadata = that.data.fontMetadata;
      delete that.data.fontMetadata;

      const fontInfo = that.fontInfos[`${fontMetadata.fontName}/${fontMetadata.fontVersion}`] = {
        fontMetadata: fontMetadata
      };
      const setsByAlternateFor = fontInfo.setsByAlternateFor = {};
      const setsByName = fontInfo.setsByName = {};

      const sets = fontMetadata.sets;
      if (sets) {
        Object.keys(sets).forEach(function(key) {
          const set = sets[key];
          set.glyphs.forEach(function(glyph) {
            const mapItem = {
              setName: key,
              set: set,
              glyph: glyph
            };

            const sbafItem = setsByAlternateFor[glyph.alternateFor] = setsByAlternateFor[glyph.alternateFor] || [];
            sbafItem.push(mapItem);

            const sbnItem = setsByName[glyph.name] = setsByName[glyph.name] || [];
            sbnItem.push(mapItem);
          });
        });
      }

      const alternateForsByUCodepoint = fontInfo.alternateForsByUCodepoint = {};
      const glyphsWithAlternates = fontMetadata.glyphsWithAlternates;
      if (glyphsWithAlternates) {
        Object.keys(glyphsWithAlternates).forEach(function(key) {
          const tAlternates = glyphsWithAlternates[key].alternates;
          tAlternates.forEach(function(v) {
            const tAlternateFors = alternateForsByUCodepoint[v.codepoint] =
              alternateForsByUCodepoint[v.codepoint] || [];
            tAlternateFors.push(key);
          });
        });
      }

      const glyphsByUCodepoint = fontInfo.glyphsByUCodepoint = {};

      [{names: that.data.glyphnames, isOptionalGlyph: false},
       {names: fontMetadata.optionalGlyphs, isOptionalGlyph: false}].forEach(function(namesDef) {
        const names = namesDef.names;
        Object.keys(namesDef.names).forEach(function(key) {
          const name = names[key];
          const cp = name.codepoint;
          if (glyphsByUCodepoint[cp]) {
            console.error(`duplicate codepoint: ${cp}: ${key}, ${glyphsByUCodepoint[cp].glyphname}`);
          }
          glyphsByUCodepoint[cp] = {
            glyphname: key,
            isOptionalGlyph: namesDef.isOptionalGlyph
          };
        });
       });
    }

    return new Promise(function(resolve) {
      function t() {
        if (that.data.fontMetadata && 
          that.data.classes && 
          that.data.glyphnames && 
          that.data.ranges) {
          resolveData();
          resolve(that);
        }
        else if (that.initErrors.length) {
          resolve(that);
        }
        else {
          window.setTimeout(t, 300);
        }
      }
      window.setTimeout(t, 300);
    });
  }

  getFontInfo(fontName) {
    const fontInfos = this.fontInfos;
    fontName = fontName || Object.keys(fontInfos)[0];
    return fontInfos[fontName];
  }

  fontMetadata(fontName) {
    const fontInfo = this.getFontInfo(fontName);
    return fontInfo ? fontInfo.fontMetadata : undefined;
  }

  ensureUCodepoint(uCodepoint) {
    uCodepoint = uCodepoint.toUpperCase();
    if (!uCodepoint.startsWith('U+')) {
      uCodepoint = 'U+' + uCodepoint;
    }
    return uCodepoint;
  }

  uCodepoint2Glyphname(uCodepoint, options = {}) {
    const glyphnames = this.data.glyphnames;
    uCodepoint = this.ensureUCodepoint(uCodepoint);
    for (const key in glyphnames) {
      if (glyphnames[key].codepoint === uCodepoint) {
        return key;
      }
      if (options.searchAlternateCodepoint) {
        if (glyphnames[key].alternateCodepoint === uCodepoint) {
          return key;
        }
      }
    }
    if (options.searchOptional) {
      const optionalGlyphs = this.fontMetadata().optionalGlyphs;
      for (const key in optionalGlyphs) {
        if (optionalGlyphs[key].codepoint === uCodepoint) {
          options.isOptionalGlyph = true;
          return key;
        }
      }
    }
    return undefined;
  }

  uCodepoint2Codepoint(uCodepoint) {
    const codepoint = Number.parseInt(uCodepoint.replace('U+',''), 16);
    return codepoint;
  }

  uCodepoint2CharString(uCodepoint) {
    const codepoint = this.uCodepoint2Codepoint(uCodepoint);
    return isNaN(codepoint) ? '?' : String.fromCodePoint(codepoint);
  }

  glyphname2uCodepoint(glyphname, options = {}) {
    let item =  this.data.glyphnames[glyphname];
    if (!item && options.searchOptional) {
      item = this.fontMetadata().optionalGlyphs[glyphname];
      options.isOptionalGlyph = item !== undefined;
    }
    return ((item || {}).codepoint);
  }

  glyphname2string(glyphname) {
    return this.glyphname2uCodepoint(glyphname);
  }
}
