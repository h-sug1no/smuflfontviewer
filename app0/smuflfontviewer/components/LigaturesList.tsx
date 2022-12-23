import { List, ListItem } from '@mui/material';
import { Database } from '../lib/SMuFLMetadata';
import { Ligatures, LigatureItem, GlyphnameStr } from '../lib/SMuFLTypes';
import { createGlyphname } from '../lib/RenderUtils';

export function addLigatureInfo(
  sMuFLMetadata: Database,
  label: string | undefined,
  ligature: LigatureItem,
  glyphname: string,
  currentGlyphName?: string,
): JSX.Element {
  let ret = <></>;
  if (!ligature) {
    return ret;
  }

  const createComponentGlyphs = (
    componentGlyphs: Array<GlyphnameStr> | undefined,
    glyphname: string,
  ): JSX.Element => {
    if (!componentGlyphs) {
      return <></>;
    }
    return (
      <>
        {'componentGlyphs:\n'}
        <div className="glyphsContainer">
          {componentGlyphs.map((tGlyphname: string, idx: number) => {
            return (
              <span key={`${glyphname}_componentGlyph_${tGlyphname}_${idx}`}>
                {
                  createGlyphname(sMuFLMetadata, tGlyphname, glyphname, currentGlyphName, true)
                    .jsxDom
                }
                {', '}
              </span>
            );
          })}
        </div>
      </>
    );
  };

  ret = (
    <>
      {label && label}
      {createGlyphname(sMuFLMetadata, glyphname, undefined, undefined, true).jsxDom}
      {'\ndescription: '}
      {(ligature.description || '') + '\n'}
      {createComponentGlyphs(ligature.componentGlyphs, glyphname)}
    </>
  );
  return ret;
}

function LigaturesList(sMuFLMetadata: Database, ligatures: Ligatures = {}): JSX.Element {
  const ret: Array<JSX.Element> = [];
  try {
    Object.keys(ligatures).forEach(function (glyphname) {
      ret.push(
        <ListItem className="anyListContainer" key={`LigaturesList_${glyphname}`}>
          <div className="ligatureContainer glyphContainer">
            {addLigatureInfo(sMuFLMetadata, undefined, ligatures[glyphname], glyphname)}
          </div>
        </ListItem>,
      );
    });
  } catch (e) {
    console.log(e);
  }
  return <List>{ret}</List>;
}

export { LigaturesList };
