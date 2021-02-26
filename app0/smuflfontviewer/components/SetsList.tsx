import { Link } from '@material-ui/core';
import { SyntheticEvent } from 'react';
import { Database, Dict } from '../lib/SMuFLMetadata';
import { createGlyphname, _createAnyListPage, createCodepointOrText } from '../lib/RenderUtils';

function SetsList(sMuFLMetadata: Database, sets: any) {
  return _createAnyListPage(
    'sets',
    sets,
    //addItemFunc
    (item: any) => {
      return (
        <>
          {`description: ${item.description}: \n`}
          {`type: ${item.type}: \n`}
        </>
      );
    },
    // getGlyphsFunc
    (item: any) => {
      return item.glyphs;
    },
    // addGlyphFunc
    (glyph: any) => {
      return (
        <>
          {`description: ${glyph.description}\n`}
          {createCodepointOrText(glyph.codepoint)}
          {', '}
          {createGlyphname(sMuFLMetadata, glyph.name).jsxDom}
          {', alternateFor: '}
          {createGlyphname(sMuFLMetadata, glyph.alternateFor, undefined, undefined, true).jsxDom}
        </>
      );
    },
  );
}

export { SetsList };
