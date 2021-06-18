import { List, ListItem } from '@material-ui/core';
import { Database } from '../lib/SMuFLMetadata';
import {
  GlyphsWithAlternates,
  GlyphsWithAlternateItem,
  GlyphsWithAlternateAlternateItem,
} from '../lib/SMuFLTypes';
import { createGlyphname, createCodepoint } from '../lib/RenderUtils';

function createAlternatesInfo(
  sMuFLMetadata: Database,
  alternates: GlyphsWithAlternateItem,
  baseGlyphname: string,
  glyphname?: string,
) {
  let ret = <></>;
  if (alternates && alternates.alternates) {
    ret = (
      <>
        {'alternates: '}
        {createGlyphname(sMuFLMetadata, baseGlyphname, glyphname, undefined, true).jsxDom}
        {'\n'}
        {alternates.alternates.map(function (v: GlyphsWithAlternateAlternateItem) {
          return (
            <span key={`${baseGlyphname}_${v.codepoint}`}>
              {'codepoint: '}
              {createCodepoint(v.codepoint)}
              {`, name: `}
              {createGlyphname(sMuFLMetadata, v.name, glyphname).jsxDom}
              {`\n`}
            </span>
          );
        })}
      </>
    );
  }
  return ret;
}

function GlyphsWithAlternatesList(
  sMuFLMetadata: Database,
  gwAlternates: GlyphsWithAlternates = {},
): JSX.Element {
  const ret: Array<JSX.Element> = [];
  try {
    Object.keys(gwAlternates).forEach(function (akey: string) {
      const alternates = gwAlternates[akey];
      ret.push(
        <ListItem className="anyListContainer" key={`GlyphsWithAlternates_${akey}`}>
          <div className="gwalternatesContainer glyphContainer">
            {createAlternatesInfo(sMuFLMetadata, alternates, akey)}
          </div>
        </ListItem>,
      );
    });
  } catch (e) {
    console.log(e);
  }
  return <List>{ret}</List>;
}

export { GlyphsWithAlternatesList };
