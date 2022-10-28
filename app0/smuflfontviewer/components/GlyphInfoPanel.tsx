import { isOptionGroup } from '@mui/base';
import { Box } from '@mui/system';
import clsx from 'clsx';
import React from 'react';
import { Database, GlyphItem, FontMetadata, SearchOptions } from '../lib/SMuFLMetadata';
import {
  GlyphnameItem,
  GlyphsWithAlternateAlternateItem,
  GlyphsWithAlternateItem,
  GlyphsWithAlternates,
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
  cpStr?: string;
  isCurrentGlyph?: boolean;
  isOptionalGlyph?: boolean;
}): JSX.Element {
  const { name, cpStr, isCurrentGlyph = false, isOptionalGlyph } = props;

  return (
    <span
      className={clsx(
        'glyphAndName',
        resolveCurrentClazz(isCurrentGlyph),
        resolveOptionalGlyphClazz(isOptionalGlyph),
      )}
    >
      {name || '?'}:&nbsp;<span className="cpStr">{cpStr}</span>
    </span>
  );
}

function CUCodePoint(props: { uPlusCodepoint: string; isCurrentGlyph?: boolean }): JSX.Element {
  return (
    <span className={clsx('uPlusCodepoint', resolveCurrentClazz(props.isCurrentGlyph))}>
      {props.uPlusCodepoint || '?'}
    </span>
  );
}

function BasicInfo(props: IGlyphInfoPanelParams): JSX.Element {
  const { selectOption, sMuFLMetadata } = props;
  const fontMetaData = sMuFLMetadata.fontMetadata();
  const fontInfo = sMuFLMetadata.getFontInfo();
  let glyphnameDom: JSX.Element | JSX.Element[] | undefined;

  let isOptionalGlyph = false;
  const glyphname = selectOption.glyphname || '';
  if (fontMetaData) {
    const { glyphnames } = sMuFLMetadata.data_;
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
            glyphnameDom = (
              <>
                codepoint: <CUCodePoint uPlusCodepoint={uPlusCodepoint} isCurrentGlyph={true} /> is
                alternateCodepoint for:
                {glyphItems.map((gi: GlyphItem, idx) => {
                  return (
                    <div key={`${idx}_${gi.codepoint}`}>
                      codepoint: <CUCodePoint uPlusCodepoint={gi.codepoint || ''} />
                      name:{' '}
                      <GlyphAndName
                        name={gi.glyphname}
                        isOptionalGlyph={gi.isOptionalGlyph}
                        cpStr={uCodePoint.toCharString()}
                      />
                    </div>
                  );
                })}
              </>
            );
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
    </div>
  );
}

function AlternatesInfo(props: {
  sMuFLMetadata: Database;
  glyphsWithAlternates?: GlyphsWithAlternates;
  selectOption: IUCSelectOption;
}): JSX.Element {
  const { glyphsWithAlternates } = props;
  const { glyphname } = props.selectOption;
  let alternatesDom;

  if (glyphsWithAlternates) {
    const gis: GlyphsWithAlternateItem | undefined = glyphsWithAlternates[glyphname || ''] || [];
    if (gis && gis.alternates) {
      alternatesDom = (
        <div>
          alternates:{' '}
          {gis.alternates.map((gi: GlyphsWithAlternateAlternateItem) => {
            const options: SearchOptions = {
              searchOptional: true,
            };
            const uCodePoint = props.sMuFLMetadata.glyphname2UCodePointObj(gi.name, options);
            return (
              <div key={gi.name}>
                codepoint:
                <CUCodePoint key={gi.codepoint} uPlusCodepoint={gi.codepoint || ''} /> name:
                <GlyphAndName
                  name={gi.name || ''}
                  cpStr={uCodePoint?.toCharString()}
                  isCurrentGlyph={false}
                  isOptionalGlyph={options.isOptionalGlyph}
                />
              </div>
            );
          })}
        </div>
      );
    }
  }
  const ret = <div className="alternates">{alternatesDom}</div>;
  return ret;
}

function RangeInfo() {
  return <div>range: {}</div>;
}

export default function GlyphInfoPanel(props: IGlyphInfoPanelParams): JSX.Element {
  const { selectOption, sMuFLMetadata } = props;

  const fontMetaData = sMuFLMetadata?.fontMetadata();
  const glyphsWithAlternates = fontMetaData?.glyphsWithAlternates;

  return (
    <Box
      sx={{
        display: 'flex',
        backgroundColor: '#eeeeee',
      }}
    >
      <BasicInfo {...props} />
      <AlternatesInfo
        sMuFLMetadata={sMuFLMetadata}
        selectOption={selectOption}
        glyphsWithAlternates={glyphsWithAlternates}
      />
    </Box>
  );
}
