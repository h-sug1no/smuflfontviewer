import { Link } from '@material-ui/core';
import { ListItem } from '@material-ui/core';
import { SyntheticEvent, ReactNode } from 'react';
import { Dict, GlyphnameItem } from '../lib/SMuFLTypes';
import { Database, SearchOptions } from '../lib/SMuFLMetadata';
import { UCodePoint } from '../lib/UCodePoint';
import clsx from 'clsx';

function createCodepoint(uCodepointStr: string): ReactNode {
  return <span className="smuflCodepoint">{uCodepointStr}</span>;
}

function createCodepointOrText(uCodepointStr: string): ReactNode {
  if (uCodepointStr.startsWith && uCodepointStr.startsWith('U+')) {
    return createCodepoint(uCodepointStr);
  }
  return <>{uCodepointStr}</>;
}

type IGylphnameDomInfo = {
  jsxDom: JSX.Element;
  uCodepoint: string | undefined;
};

function createGlyphname(
  sMuFLMetadata: Database,
  glyphname: string,
  currentGlyphName?: string,
  uCodepoint?: string,
  showUCodepoint?: boolean,
): IGylphnameDomInfo {
  const option: SearchOptions = { searchOptional: true };
  let tUCodepoint = sMuFLMetadata.glyphname2uCodepoint(glyphname, option);
  if ((uCodepoint || tUCodepoint) !== tUCodepoint) {
    //console.error(`fixme: ${(uCodepoint || tUCodepoint)} !== ${tUCodepoint}`);
    if (uCodepoint) {
      tUCodepoint = uCodepoint;
    }
  }
  uCodepoint = tUCodepoint;
  let charStr;
  if (uCodepoint) {
    charStr = UCodePoint.fromUString(uCodepoint).toCharString();
  }
  /*
  const $uCodepoint = showUCodepoint ? (
    <span className="uCodepoint">(${uCodepoint})</span>
  ) : undefined;
  const $t = $(
    `${$uCodepoint}<span class="smuflGlyphname">${
      glyphname || '?'
    }:<span class="smufl">${charStr}</span></span>`,
  );
  if (option.isOptionalGlyph) {
    $t.addClass('optionalGlyph');
  }
  if (currentGlyphName === glyphname) {
    $t.addClass('currentGlyph');
  }

  $t.prop('uCodepoint', uCodepoint);
  // $c.append($t);
  */
  const jsxDom = (
    <span
      className={clsx(
        !!(currentGlyphName === glyphname) && 'currentGlyph',
        !!option.isOptionalGlyph && 'optionalGlyph',
      )}
      // use dom.dataset(https://developer.mozilla.org/ja/docs/Learn/HTML/Howto/Use_data_attributes)
      // to avoid {any} type.
      ref={(elm: HTMLElement) => {
        if (elm) {
          elm.dataset.uCodepoint = uCodepoint;
        }
      }}
    >
      {!!showUCodepoint && <span className="uCodepoint">{`(${uCodepoint}) `}</span>}
      <span className="smuflGlyphname">
        {glyphname || '?'}:<span className="smufl">{charStr}</span>
      </span>
    </span>
  );

  return {
    jsxDom: jsxDom,
    uCodepoint: uCodepoint,
  };
}

function createGlyphnameInfo(
  sMuFLMetadata: Database,
  ginfo: GlyphnameItem,
  glyphname: string,
): ReactNode {
  /*
  _$c_appendText($contentContainer, `${ginfo.codepoint}: `);
  appendGlyphname($contentContainer, glyphname); // here, no current glyph.
  _$c_appendText($contentContainer, `, ${ginfo.description || ''}: `);
  if (ginfo.alternateCodepoint) {
    _$c_appendText($contentContainer, `, alternateCodepoint: ${ginfo.alternateCodepoint}: `);
  }
  $contentContainer.append($('<br>'));
  */
  return (
    <ListItem key={glyphname}>
      {ginfo.codepoint}: {createGlyphname(sMuFLMetadata, glyphname).jsxDom}
      {', '}
      {ginfo.description || ''}:{' '}
      {!!ginfo.alternateCodepoint && `, alternateCodepoint: ${ginfo.alternateCodepoint}: `}
      <br></br>
    </ListItem>
  );
}

type addItemFuncType<T> = (item: T) => JSX.Element;
type getGlyphsFuncType<T, GT> = (item: T) => Array<GT> | undefined;
type addGlyphFuncType<GT> = (glyph: GT) => JSX.Element;

function _createAnyListPage<T, GT>(
  listName: string,
  dict: Dict<T>,
  addItemFunc: addItemFuncType<T>,
  getGlyphsFunc: getGlyphsFuncType<T, GT>,
  addGlyphFunc: addGlyphFuncType<GT>,
): JSX.Element {
  function _hrefId(hrefName: string) {
    return listName + 'Container_' + hrefName;
  }

  function _createLink(hrefName: string, clazz: string) {
    const disabled = hrefName ? false : true;
    if (disabled) {
      hrefName = '....';
    }
    let ret: JSX.Element;
    const hrefId = _hrefId(hrefName);
    if (disabled) {
      ret = <span className={clazz}>{hrefName}</span>;
    } else {
      ret = (
        <Link
          className={clazz}
          href={`#${hrefId}`}
          onClick={(e: SyntheticEvent) => {
            const targetElm = document.getElementById(hrefId);
            if (targetElm) {
              targetElm.scrollIntoView();
              e.preventDefault();
            }
          }}
        >
          {hrefName}
        </Link>
      );
    }
    return ret;
  }

  const _createGlyphInfos = (item: T) => {
    const glyphs = getGlyphsFunc(item) || [];
    return glyphs.map((glyphName: GT, idx: number) => {
      // FIXME: glyphName may string or object. simplify key string but how to?
      const key = `${listName}_${idx}_${JSON.stringify(glyphName)}`;
      // console.log(key);
      return (
        <div className="glyphContainer" key={key}>
          {addGlyphFunc(glyphName)}
        </div>
      );
    });
  };

  let ret: JSX.Element | undefined;

  try {
    const dictKeys = Object.keys(dict);
    if (!dictKeys.length) {
      ret = <>{`no ${listName} items`}</>;
      return ret;
    }
    const doms = dictKeys.map(function (itemName, idx, items) {
      const item = dict[itemName];
      const id = _hrefId(itemName);
      return (
        <div className={`${listName}Container`} id={id} key={id}>
          {`${itemName}: `}
          {_createLink(items[idx - 1], 'linkToPrev')}
          {_createLink(items[idx + 1], 'linkToNext')}
          {'\n'}
          {addItemFunc(item)}
          {_createGlyphInfos(item)}
        </div>
      );
    });
    ret = <>{doms}</>;
  } catch (e) {
    console.log(e);
  }
  return ret || <></>;
}

export {
  createGlyphname,
  createGlyphnameInfo,
  _createAnyListPage,
  createCodepointOrText,
  createCodepoint,
};
