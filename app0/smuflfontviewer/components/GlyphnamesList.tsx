/**
 * Copyright (c) 2021 h-sug1no
 */

import { Database } from '../lib/SMuFLMetadata';
import { List } from '@material-ui/core';
import { createGlyphnameInfo } from '../lib/RenderUtils';

type Props = {
  glyphnames: any;
  sMuFLMetadata: Database;
};

function GlyphnamesList({ glyphnames, sMuFLMetadata }: Props) {
  const keys = Object.keys(glyphnames);
  const ret = keys.map((key) => {
    return createGlyphnameInfo(sMuFLMetadata, glyphnames[key], key);
  });
  return <List>{ret}</List>;
}
export { GlyphnamesList };
