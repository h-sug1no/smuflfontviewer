import { List, ListItem } from '@material-ui/core';
import { Database } from '../lib/SMuFLMetadata';
import { GlyphsWithAnchors } from '../lib/SMuFLTypes';
import { createGlyphname } from '../lib/RenderUtils';

function GlyphsWithAnchorsList(
  sMuFLMetadata: Database,
  gwAnchors: GlyphsWithAnchors | undefined = {},
): JSX.Element {
  const ret: Array<JSX.Element> = [];
  try {
    Object.keys(gwAnchors).forEach(function (glyphname: string) {
      const glyph = gwAnchors[glyphname];
      ret.push(
        <ListItem className="anyListContainer" key={`GlyphsWithAnchors_${glyphname}`}>
          <div className="gwanchorsContainer">
            <div className="glyphContainer">
              {createGlyphname(sMuFLMetadata, glyphname, undefined, undefined, true).jsxDom}
              {'\u00A0'}
              {Object.keys(glyph).join(', ')}
            </div>
          </div>
        </ListItem>,
      );
    });
  } catch (e) {
    console.log(e);
  }
  return <List>{ret}</List>;
}

export { GlyphsWithAnchorsList };
