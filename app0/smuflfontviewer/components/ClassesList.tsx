import { Link } from '@material-ui/core';
import { SyntheticEvent } from 'react';
import { Database, Dict } from '../lib/SMuFLMetadata';
import { appendGlyphname } from './GlyphnamesList';

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

function ClassesList(sMuFLMetadata: Database, classes: any) {
  return _createAnyListPage(
    'classes',
    classes,
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
      return appendGlyphname(sMuFLMetadata, glyphName, undefined, undefined, true).jsxDom;
    },
  );
}

export { ClassesList };
