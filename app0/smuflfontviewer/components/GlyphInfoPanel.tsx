import { isOptionGroup } from '@mui/base';
import { Box } from '@mui/system';
import clsx from 'clsx';
import React from 'react';
import { Database, GlyphItem } from '../lib/SMuFLMetadata';
import {
  GlyphnameItem,
  GlyphsWithAlternateAlternateItem,
  GlyphsWithAlternateItem,
} from '../lib/SMuFLTypes';
import { codepoint2UString, UCodePoint } from '../lib/UCodePoint';
import { IUCSelectOption } from './UCodepointSelect';

export type IGlyphInfoPanelParams = {
  selectOption: IUCSelectOption;
  sMuFLMetadata: Database;
};

function resolveCurrentClazz(isCurrentGlyph = false): string {
  return isCurrentGlyph ? 'current' : '';
}

function resolveOptionalGlyphClazz(isOptionalGlyph = false): string {
  return isOptionalGlyph ? 'optionalGlyph' : '';
}

function GlyphAndName(props: {
  name: string;
  cpStr: string;
  isCurrentGlyph?: boolean;
  isOptionalGlyph?: boolean;
}): JSX.Element {
  const { name, cpStr, isCurrentGlyph = false, isOptionalGlyph = false } = props;
  return (
    <span
      className={clsx(
        'glyphAndName',
        resolveCurrentClazz(isCurrentGlyph),
        resolveOptionalGlyphClazz(isOptionalGlyph),
      )}
    >
      {name}:&nbsp;<span className="cpStr">{cpStr}</span>
    </span>
  );
}

function CUCodePoint(props: { uPlusCodepoint: string; isCurrentGlyph?: boolean }): JSX.Element {
  return (
    <span className={clsx('uPlusCodepoint', resolveCurrentClazz(props.isCurrentGlyph))}>
      {props.uPlusCodepoint}
    </span>
  );
}

function BasicInfo(props: IGlyphInfoPanelParams): JSX.Element {
  const { selectOption, sMuFLMetadata } = props;
  const fontMetaData = sMuFLMetadata.fontMetadata();
  const fontInfo = sMuFLMetadata.getFontInfo();
  let glyphnameDom: JSX.Element[] | undefined;
  let alternatesDom: JSX.Element | undefined;

  let isOptionalGlyph = false;
  const glyphname = selectOption.glyphname || '';
  if (fontMetaData) {
    const { glyphnames } = sMuFLMetadata.data_;
    const glyphsWithAlternates = fontMetaData.glyphsWithAlternates;
    if (glyphnames) {
      const { optionalGlyphs } = fontMetaData;
      let glyphnameItem: GlyphnameItem = glyphnames[glyphname];
      if (!glyphnameItem && optionalGlyphs) {
        glyphnameItem = optionalGlyphs[glyphname];
        isOptionalGlyph = !!glyphnameItem;
      }
      if (!glyphnameItem && fontInfo) {
        const { alternateCodepointFors } = fontInfo;
        if (alternateCodepointFors) {
          const uCodePoint = UCodePoint.fromUString(selectOption.value);
          const uPlusCodepoint = uCodePoint.toUString();
          const glyphItems = alternateCodepointFors[uPlusCodepoint];
          if (glyphItems) {
            glyphnameDom = [
              <>
                codepoint: <CUCodePoint uPlusCodepoint={uPlusCodepoint} isCurrentGlyph={true} /> is
                alternateCodepoint for:
                {glyphItems.map((gi: GlyphItem) => {
                  return (
                    <>
                      codepoint: <CUCodePoint uPlusCodepoint={gi.codepoint || ''} />
                      name:{' '}
                      <GlyphAndName
                        name={gi.glyphname}
                        isOptionalGlyph={gi.isOptionalGlyph}
                        cpStr={uCodePoint.toCharString()}
                      />
                    </>
                  );
                })}
              </>,
            ];
          }
        }
      }
      if (glyphnameItem) {
        glyphnameDom = Object.keys(glyphnameItem).map((key: keyof GlyphnameItem) => {
          let value: string | JSX.Element = glyphnameItem[key] || '';
          if (key !== 'description') {
            value = <CUCodePoint uPlusCodepoint={value} isCurrentGlyph={key === 'codepoint'} />;
          }
          if (key === 'classes') {
            value = JSON.stringify(value);
          }
          return (
            <div key={key}>
              <span>{key}</span>
              <span>{value}</span>
            </div>
          );
        });
      }
    }
    // FIXME: what is alternateCodepoint?
    if (glyphsWithAlternates) {
      const gis: GlyphsWithAlternateItem | undefined = glyphsWithAlternates[glyphname || ''] || [];
      if (gis && gis.alternates) {
        alternatesDom = (
          <div>
            alternateCodepoint:{' '}
            {gis.alternates.map((gi: GlyphsWithAlternateAlternateItem) => {
              return <CUCodePoint key={gi.codepoint} uPlusCodepoint={gi.codepoint || ''} />;
            })}
          </div>
        );
      }
    }
  }

  return (
    <div className="basic">
      <GlyphAndName
        name={glyphname}
        cpStr={selectOption.cpStr}
        isCurrentGlyph={true}
        isOptionalGlyph={isOptionalGlyph}
      />
      {glyphnameDom}
      {alternatesDom}
    </div>
  );
}

export default function GlyphInfoPanel(props: IGlyphInfoPanelParams): JSX.Element {
  const { selectOption, sMuFLMetadata } = props;
  return (
    <Box
      sx={{
        display: 'flex',
        backgroundColor: '#eeeeee',
      }}
    >
      <BasicInfo {...props} />
    </Box>
  );
}
