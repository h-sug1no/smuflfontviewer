import { Ranges, SFVRangeItem } from '../lib/SMuFLTypes';
import { Database } from '../lib/SMuFLMetadata';
import { createGlyphname, _createAnyListPage } from '../lib/RenderUtils';

function RangesList(sMuFLMetadata: Database, ranges: Ranges | undefined): JSX.Element {
  return _createAnyListPage<SFVRangeItem, string>(
    'range',
    ranges || {},
    //addItemFunc
    (item: SFVRangeItem) => {
      return (
        <>
          {`range_start: ${item.range_start}, `}
          {`range_end: ${item.range_end}: \n`}
          {`description: ${item.description}: \n`}
        </>
      );
    },
    // getGlyphsFunc
    (item: SFVRangeItem) => {
      return item.glyphs;
    },
    // addGlyphFunc
    (glyphName: string) => {
      return createGlyphname(sMuFLMetadata, glyphName, undefined, undefined, true).jsxDom;
    },
  );
}

export { RangesList };
