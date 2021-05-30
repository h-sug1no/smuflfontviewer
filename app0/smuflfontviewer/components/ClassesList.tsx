import { Classes } from '../lib/SMuFLTypes';
import { Database } from '../lib/SMuFLMetadata';
import { createGlyphname, _createAnyListPage } from '../lib/RenderUtils';

function ClassesList(sMuFLMetadata: Database, classes: Classes | undefined): JSX.Element {
  return _createAnyListPage(
    'classes',
    classes || {},
    //addItemFunc
    (/* item: any */) => {
      return <></>;
    },
    // getGlyphsFunc
    (item) => {
      return item;
    },
    // addGlyphFunc
    (glyphName: string) => {
      return createGlyphname(sMuFLMetadata, glyphName, undefined, undefined, true).jsxDom;
    },
  );
}

export { ClassesList };
