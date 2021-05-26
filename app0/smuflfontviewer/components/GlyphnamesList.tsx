/**
 * Copyright (c) 2021 h-sug1no
 */
import { Glyphnames } from '../lib/SMuFLTypes';
import { Database } from '../lib/SMuFLMetadata';
import { List } from '@material-ui/core';
import { createGlyphnameInfo } from '../lib/RenderUtils';

function GlyphnamesList(sMuFLMetadata: Database, glyphnames?: Glyphnames): JSX.Element {
  const dic = glyphnames || {};
  const keys = Object.keys(dic);
  const ret = keys.map((key) => {
    return createGlyphnameInfo(sMuFLMetadata, dic[key], key);
  });
  return <List>{ret}</List>;
}
export { GlyphnamesList };
