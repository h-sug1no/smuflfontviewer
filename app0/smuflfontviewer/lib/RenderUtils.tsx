import { Link } from '@material-ui/core';
import { ListItem } from '@material-ui/core';
import { SyntheticEvent } from 'react';
import { Database, SearchOptions, Dict } from '../lib/SMuFLMetadata';
import { UCodePoint } from '../lib/UCodePoint';
import clsx from 'clsx';

function createGlyphname(
  sMuFLMetadata: Database,
  glyphname: string,
  currentGlyphName?: string,
  uCodepoint?: string,
  showUCodepoint?: boolean,
) {
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
      ref={(elm: any) => {
        if (elm) {
          elm.uCodepoint = uCodepoint;
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

function createGlyphnameInfo(sMuFLMetadata: Database, ginfo: any, glyphname: string) {
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

type addItemFuncType = (item: any) => JSX.Element;
type getGlyphsFuncType = (item: any) => Array<any>;
type addGlyphFuncType = (glyphName: string) => JSX.Element;

function _createAnyListPage(
  listName: string,
  dict: Dict<any>,
  addItemFunc: addItemFuncType,
  getGlyphsFunc: getGlyphsFuncType,
  addGlyphFunc: addGlyphFuncType,
) {
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

  const _createGlyphInfos = (item: any) => {
    const glyphs = getGlyphsFunc(item);
    return glyphs.map(function (glyphName: string) {
      return (
        <div className="glyphContainer" key={`${listName}_${glyphName}`}>
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
  return ret;
}

export { createGlyphname, createGlyphnameInfo };
