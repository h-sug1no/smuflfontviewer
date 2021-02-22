/**
 * Copyright (c) 2021 h-sug1no
 */
// import { Props } from 'react';

import { Database, SearchOptions } from '../lib/SMuFLMetadata';
import { UCodePoint } from '../lib/UCodePoint';
import { List, ListItem } from '@material-ui/core';
import clsx from 'clsx';

function appendGlyphname(
  sMuFLMetadata: Database,
  glyphname: string,
  currentGlyphName?: string,
  uCodepoint?: string,
  showUCodepoint?: boolean,
) {
  const option: SearchOptions = { searchOptional: true };
  let tUCodepoint = sMuFLMetadata.glyphname2uCodepoint(glyphname, option);
  if ((uCodepoint || tUCodepoint) !== tUCodepoint) {
    //console.error(`fixme: ${(uCodepoint || tUCodepoint)} !== ${tUCodepoint}`);
    if (uCodepoint) {
      tUCodepoint = uCodepoint;
    }
  }
  uCodepoint = tUCodepoint;
  let charStr;
  if (uCodepoint) {
    charStr = UCodePoint.fromUString(uCodepoint).toCharString();
  }
  /*
  const $uCodepoint = showUCodepoint ? (
    <span className="uCodepoint">(${uCodepoint})</span>
  ) : undefined;
  const $t = $(
    `${$uCodepoint}<span class="smuflGlyphname">${
      glyphname || '?'
    }:<span class="smufl">${charStr}</span></span>`,
  );
  if (option.isOptionalGlyph) {
    $t.addClass('optionalGlyph');
  }
  if (currentGlyphName === glyphname) {
    $t.addClass('currentGlyph');
  }

  $t.prop('uCodepoint', uCodepoint);
  // $c.append($t);
  */
  const jsxDom = (
    <span
      className={clsx(
        !!(currentGlyphName === glyphname) && 'currentGlyph',
        !!option.isOptionalGlyph && 'optionalGlyph',
      )}
      ref={(elm: any) => {
        if (elm) {
          elm.uCodepoint = uCodepoint;
        }
      }}
    >
      {!!showUCodepoint && <span className="uCodepoint">(${uCodepoint})</span>}
      <span className="smuflGlyphname">
        {glyphname || '?'}:<span className="smufl">{charStr}</span>
      </span>
    </span>
  );

  return {
    jsxDom: jsxDom,
    uCodepoint: uCodepoint,
  };
}

function addGlyphnameInfo(sMuFLMetadata: Database, ginfo: any, glyphname: string) {
  /*
  _$c_appendText($contentContainer, `${ginfo.codepoint}: `);
  appendGlyphname($contentContainer, glyphname); // here, no current glyph.
  _$c_appendText($contentContainer, `, ${ginfo.description || ''}: `);
  if (ginfo.alternateCodepoint) {
    _$c_appendText($contentContainer, `, alternateCodepoint: ${ginfo.alternateCodepoint}: `);
  }
  $contentContainer.append($('<br>'));
  */
  return (
    <ListItem key={glyphname}>
      {ginfo.codepoint}: {appendGlyphname(sMuFLMetadata, glyphname).jsxDom}
      {', '}
      {ginfo.description || ''}:{' '}
      {!!ginfo.alternateCodepoint && `, alternateCodepoint: ${ginfo.alternateCodepoint}: `}
      <br></br>
    </ListItem>
  );
}

type Props = {
  glyphnames: any;
  sMuFLMetadata: Database;
};
function GlyphnamesList({ glyphnames, sMuFLMetadata }: Props) {
  const keys = Object.keys(glyphnames);
  const ret = keys.map((key) => {
    return addGlyphnameInfo(sMuFLMetadata, glyphnames[key], key);
  });
  return <List>{ret}</List>;
}
export { GlyphnamesList, addGlyphnameInfo, Props };
