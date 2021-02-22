/**
 * Copyright (c) 2021 h-sug1no
 */
// import { Props } from 'react';

import { List } from '@material-ui/core';
import { addGlyphnameInfo, Props } from './GlyphnamesList';

function OptionalGlyphsList({ optionalGlyphs, sMuFLMetadata }: Props) {
  const keys = Object.keys(optionalGlyphs);
  const ret = keys.map((key) => {
    return addGlyphnameInfo(sMuFLMetadata, optionalGlyphs[key], key);
  });
  return <List>{ret}</List>;
}
export { OptionalGlyphsList };
