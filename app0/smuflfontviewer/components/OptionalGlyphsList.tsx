/**
 * Copyright (c) 2021 h-sug1no
 */
// import { Props } from 'react';

import { List } from '@material-ui/core';
import { Database } from '../lib/SMuFLMetadata';
import { createGlyphnameInfo } from '../lib/RenderUtils';

function OptionalGlyphsList(sMuFLMetadata: Database, optionalGlyphs: any): JSX.Element {
  const keys = Object.keys(optionalGlyphs);
  const ret = keys.map((key) => {
    return createGlyphnameInfo(sMuFLMetadata, optionalGlyphs[key], key);
  });
  return <List>{ret}</List>;
}
export { OptionalGlyphsList };