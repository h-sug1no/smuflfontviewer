// import { Link } from '@mui/material';
// import { SyntheticEvent } from 'react';
import { Database } from '../lib/SMuFLMetadata';
import { Sets, SetItem, SetGlyphItem } from '../lib/SMuFLTypes';
import { createGlyphname, _createAnyListPage, createCodepointOrText } from '../lib/RenderUtils';

function SetsList(sMuFLMetadata: Database, sets: Sets = {}): JSX.Element {
  return _createAnyListPage<SetItem, SetGlyphItem>(
    'sets',
    sets,
    //addItemFunc
    (item: SetItem) => {
      return (
        <>
          {`description: ${item.description}: \n`}
          {`type: ${item.type}: \n`}
        </>
      );
    },
    // getGlyphsFunc
    (item: SetItem) => {
      return item.glyphs;
    },
    // addGlyphFunc
    (glyph: SetGlyphItem) => {
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
