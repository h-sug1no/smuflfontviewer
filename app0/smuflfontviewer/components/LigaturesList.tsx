import { List, ListItem } from '@material-ui/core';
import { Database } from '../lib/SMuFLMetadata';
import { createGlyphname } from '../lib/RenderUtils';

function addLigatureInfo(
  sMuFLMetadata: Database,
  label: string | undefined,
  ligature: any,
  glyphname: string,
): JSX.Element {
  let ret = <></>;
  if (!ligature) {
    return ret;
  }

  const createComponentGlyphs = (componentGlyphs: any, glyphname: string): JSX.Element => {
    if (!componentGlyphs) {
      return <></>;
    }
    return (
      <>
        {'componentGlyphs:\n'}
        <div className="glyphsContainer">
          {ligature.componentGlyphs.map(function (tGlyphname: string, idx: number) {
            return (
              <span key={`${glyphname}_componentGlyph_${tGlyphname}_${idx}`}>
                {createGlyphname(sMuFLMetadata, tGlyphname, glyphname, undefined, true).jsxDom}
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

function LigaturesList(sMuFLMetadata: Database, ligatures: any): JSX.Element {
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
