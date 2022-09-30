import { Box } from '@mui/system';
import clsx from 'clsx';
import React from 'react';
import { Database, GlyphItem } from '../lib/SMuFLMetadata';
import { GlyphsWithAlternateAlternateItem, GlyphsWithAlternateItem } from '../lib/SMuFLTypes';
import { codepoint2UString } from '../lib/UCodePoint';
import { IUCSelectOption } from './UCodepointSelect';

export type IGlyphInfoPanelParams = {
  selectOption: IUCSelectOption;
  sMuFLMetadata: Database;
};

function resolveCurrentClazz(isCurrentGlyph = false): string {
  return isCurrentGlyph ? 'current' : '';
}

function GlyphAndName(props: {
  name: string;
  cpStr: string;
  isCurrentGlyph?: boolean;
}): JSX.Element {
  const { name, cpStr, isCurrentGlyph = false } = props;
  return (
    <span className={clsx('glyphAndName', resolveCurrentClazz(isCurrentGlyph))}>
      {name}:&nbsp;<span className="cpStr">{cpStr}</span>
    </span>
  );
}

function UCodePoint(props: { uPlusCodepoint: string; isCurrentGlyph?: boolean }): JSX.Element {
  return (
    <span className={clsx('uPlusCodepoint', resolveCurrentClazz(props.isCurrentGlyph))}>
      {props.uPlusCodepoint}
    </span>
  );
}

function BasicInfo(props: IGlyphInfoPanelParams): JSX.Element {
  const { selectOption, sMuFLMetadata } = props;
  const glyphsWithAlternates = sMuFLMetadata.fontMetadata()?.glyphsWithAlternates;

  let gis: GlyphsWithAlternateItem | undefined = undefined;
  let alternatesDom: JSX.Element | undefined;

  // FIXME: what is alternateCodepoint?
  if (glyphsWithAlternates) {
    gis = glyphsWithAlternates[selectOption.glyphname || ''] || [];
    if (gis && gis.alternates) {
      alternatesDom = (
        <div>
          alternateCodepoint:{' '}
          {gis.alternates.map((gi: GlyphsWithAlternateAlternateItem) => {
            return <UCodePoint key={gi.codepoint} uPlusCodepoint={gi.codepoint || ''} />;
          })}
        </div>
      );
    }
  }

  return (
    <div className="basic">
      <GlyphAndName
        name={selectOption.glyphname || ''}
        cpStr={selectOption.cpStr}
        isCurrentGlyph={true}
      />
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
