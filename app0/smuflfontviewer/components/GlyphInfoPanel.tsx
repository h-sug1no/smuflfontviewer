import { Link } from '@mui/material';
import { Box } from '@mui/system';
import clsx from 'clsx';
import React from 'react';
import { Database, GlyphItem, SearchOptions } from '../lib/SMuFLMetadata';
import {
  Classes,
  Dict,
  GlyphnameItem,
  GlyphsWithAlternateAlternateItem,
  GlyphsWithAlternateItem,
  GlyphsWithAlternates,
  Ligatures,
  Ranges,
  SFVRangeItem,
} from '../lib/SMuFLTypes';
import { UCodePoint } from '../lib/UCodePoint';
import { addLigatureInfo } from './LigaturesList';
import { IUCSelectOption } from './UCodepointSelect';
export type IGlyphInfoPanelParams = {
  selectOption: IUCSelectOption;
  sMuFLMetadata: Database;
  uCodePoint: UCodePoint;
};

function resolveCurrentClazz(isCurrentGlyph = false): string {
  return isCurrentGlyph ? 'current' : '';
}

function resolveOptionalGlyphClazz(isOptionalGlyph = false): string {
  return isOptionalGlyph ? 'optionalGlyph' : '';
}

function GlyphAndName(props: {
  name: string;
  cpStr?: string;
  isCurrentGlyph?: boolean;
  isOptionalGlyph?: boolean;
}): JSX.Element {
  const { name, cpStr, isCurrentGlyph = false, isOptionalGlyph } = props;

  return (
    <span
      className={clsx(
        'glyphAndName',
        resolveCurrentClazz(isCurrentGlyph),
        resolveOptionalGlyphClazz(isOptionalGlyph),
      )}
    >
      {name || '?'}:&nbsp;<span className="cpStr">{cpStr}</span>
    </span>
  );
}

function CUCodePoint(props: { uPlusCodepoint: string; isCurrentGlyph?: boolean }): JSX.Element {
  return (
    <span className={clsx('uPlusCodepoint', resolveCurrentClazz(props.isCurrentGlyph))}>
      {props.uPlusCodepoint || '?'}
    </span>
  );
}

function BasicInfo(props: IGlyphInfoPanelParams): JSX.Element {
  const { selectOption, sMuFLMetadata } = props;
  const fontMetaData = sMuFLMetadata.fontMetadata();
  const fontInfo = sMuFLMetadata.getFontInfo();
  let glyphnameDom: JSX.Element | JSX.Element[] | undefined;

  let isOptionalGlyph = false;
  const glyphname = selectOption.glyphname || '';
  if (fontMetaData) {
    const { glyphnames } = sMuFLMetadata.data_;
    if (glyphnames) {
      const { optionalGlyphs } = fontMetaData;
      let glyphnameItem: GlyphnameItem = glyphnames[glyphname];
      if (!glyphnameItem && optionalGlyphs) {
        glyphnameItem = optionalGlyphs[glyphname];
        isOptionalGlyph = !!glyphnameItem;
      }
      if (!glyphnameItem && fontInfo) {
        const { alternateCodepointFors } = fontInfo;
        if (alternateCodepointFors) {
          const uCodePoint = UCodePoint.fromUString(selectOption.value);
          const uPlusCodepoint = uCodePoint.toUString();
          const glyphItems = alternateCodepointFors[uPlusCodepoint];
          if (glyphItems) {
            glyphnameDom = (
              <>
                codepoint: <CUCodePoint uPlusCodepoint={uPlusCodepoint} isCurrentGlyph={true} /> is
                alternateCodepoint for:
                {glyphItems.map((gi: GlyphItem, idx) => {
                  return (
                    <div key={`${idx}_${gi.codepoint}`}>
                      codepoint: <CUCodePoint uPlusCodepoint={gi.codepoint || ''} />
                      name:{' '}
                      <GlyphAndName
                        name={gi.glyphname}
                        isOptionalGlyph={gi.isOptionalGlyph}
                        cpStr={uCodePoint.toCharString()}
                      />
                    </div>
                  );
                })}
              </>
            );
          }
        }
      }
      if (glyphnameItem) {
        glyphnameDom = Object.keys(glyphnameItem).map((key: keyof GlyphnameItem) => {
          let value: string | JSX.Element = glyphnameItem[key] || '';
          if (key !== 'description') {
            value = <CUCodePoint uPlusCodepoint={value} isCurrentGlyph={key === 'codepoint'} />;
          }
          if (key === 'classes') {
            // FIXME: don't stringify JSX.Element.
            // value = JSON.stringify(value);
          }
          return (
            <div key={key}>
              <span>{key}</span>
              <span>{value}</span>
            </div>
          );
        });
      }
    }
  }

  return (
    <div className="basic infoPanel">
      <GlyphAndName
        name={glyphname}
        cpStr={selectOption.cpStr}
        isCurrentGlyph={true}
        isOptionalGlyph={isOptionalGlyph}
      />
      {glyphnameDom}
    </div>
  );
}

function AlternatesInfo(props: {
  sMuFLMetadata: Database;
  glyphsWithAlternates?: GlyphsWithAlternates;
  selectOption: IUCSelectOption;
}): JSX.Element {
  const { glyphsWithAlternates } = props;
  const { glyphname } = props.selectOption;
  let alternatesDom;

  if (glyphsWithAlternates) {
    const gis: GlyphsWithAlternateItem | undefined = glyphsWithAlternates[glyphname || ''] || [];
    if (gis && gis.alternates) {
      alternatesDom = (
        <div>
          alternates:{' '}
          {gis.alternates.map((gi: GlyphsWithAlternateAlternateItem) => {
            const options: SearchOptions = {
              searchOptional: true,
            };
            const uCodePoint = props.sMuFLMetadata.glyphname2UCodePointObj(gi.name, options);
            return (
              <div key={gi.name}>
                codepoint:
                <CUCodePoint key={gi.codepoint} uPlusCodepoint={gi.codepoint || ''} /> name:
                <GlyphAndName
                  name={gi.name || ''}
                  cpStr={uCodePoint?.toCharString()}
                  isCurrentGlyph={false}
                  isOptionalGlyph={options.isOptionalGlyph}
                />
              </div>
            );
          })}
        </div>
      );
    }
  }
  const ret = <div className="alternates infoPanel">{alternatesDom}</div>;
  return ret;
}

const _toRaneSpecFilename = (() => {
  const table: Dict<string> = {
    gouldArrowQuartertoneAccidentals24Edo: 'gould-arrow-quartertone-accidentals-24-edo',
    kodályHandSigns: 'kodaly-hand-signs',
    organGerman: 'german-organ-tablature',
    simsAccidentals72Edo: 'sims-accidentals-72-edo',
    standardAccidentals12Edo: 'standard-accidentals-12-edo',
    steinZimmermannAccidentals24Edo: 'stein-zimmermann-accidentals-24-edo',
    stockhausenAccidentals: 'stockhausen-accidentals-24-edo',
    timeSignaturesReversed: 'reversed-time-signatures',
    timeSignaturesTurned: 'turned-time-signatures',
    trojanSagittalExtension12EdoRelativeAccidentals:
      'trojan-sagittal-extension-12-edo-relative-accidentals',
    wyschnegradskyAccidentals72Edo: 'wyschnegradsky-accidentals-72-edo',
  };

  const rangeSpecFilenames: Dict<string> = {};
  return (rangeName: string) => {
    rangeSpecFilenames[rangeName] =
      table[rangeName] ||
      rangeSpecFilenames[rangeName] ||
      rangeName.replace(/[A-Z]/g, function (s) {
        return '-' + s.charAt(0).toLowerCase();
      });
    return rangeSpecFilenames[rangeName];
  };
})();

function appendGlyphname(
  sMuFLMetadata: Database,
  glyphname: string,
  currentGlyphName?: string,
  uCodepointStr?: string,
  showUCodepoint?: boolean,
) {
  const option: SearchOptions = { searchOptional: true };
  let tUCodepointStr = sMuFLMetadata.glyphname2uCodepoint(glyphname, option);
  if ((uCodepointStr || tUCodepointStr) !== tUCodepointStr) {
    //console.error(`fixme: ${(uCodepoint || tUCodepoint)} !== ${tUCodepoint}`);
    if (uCodepointStr) {
      tUCodepointStr = uCodepointStr;
    }
  }
  if (tUCodepointStr) {
    uCodepointStr = tUCodepointStr;
  }
  const uCodePoint = UCodePoint.fromUString(uCodepointStr || '');
  const charStr = uCodePoint.toCharString();
  const nCodepoint = uCodePoint.toNumber();
  const tGlyphname = glyphname || uCodepointStr;
  let currentGlyphClazz = '';
  if (tGlyphname && currentGlyphName === tGlyphname) {
    currentGlyphClazz = 'currentGlyph';
  }

  const $uCodepoint = showUCodepoint ? (
    <span
      className={clsx(
        option.isOptionalGlyph ? 'optionalGlyph' : '',
        option.isUnknownOptionalGlyph && 0xf400 <= nCodepoint && nCodepoint <= 0xffff
          ? 'unknownOptionalGlyph'
          : '',
        currentGlyphClazz,
        'uCodepoint',
      )}
      data-uCodepoint={uCodepointStr}
    >
      ({uCodepointStr})
    </span>
  ) : (
    ''
  );
  const $t = (
    <>
      {$uCodepoint}
      <span className="smuflGlyphname">
        {glyphname || '?'}:<span className="smufl">{charStr}</span>
      </span>
    </>
  );

  return {
    jsxDom: $t,
    uCodepointStr: uCodepointStr,
  };
}

function appendCodepoint(uCodepointStr: string, currentUCodepoint?: string) {
  let currentGlyph = '';
  if (uCodepointStr && uCodepointStr === currentUCodepoint) {
    currentGlyph = ' currentGlyph';
  }
  return <span className={`smuflCodepoint${currentGlyph}`}>{uCodepointStr}</span>;
}

function appendCodepointOrText(uCodepointStr: string, currentUCodepoint?: string) {
  if (uCodepointStr.startsWith && uCodepointStr.startsWith('U+')) {
    return appendCodepoint(uCodepointStr, currentUCodepoint);
  } else {
    return <>{uCodepointStr}</>;
  }
}

function RangeInfo(props: {
  uCodePoint: UCodePoint;
  sMuFLMetadata: Database;
  ranges?: Ranges;
  selectOption: IUCSelectOption;
}) {
  const { uCodePoint, sMuFLMetadata, ranges, selectOption } = props;
  const { glyphname } = selectOption;
  const cpNumber = uCodePoint.toNumber();

  let tRange:
    | undefined
    | {
        key: string;
        r: SFVRangeItem;
      } = undefined;

  for (const key in ranges) {
    const range = ranges[key];
    if (range.nStart === undefined) {
      if (range.range_start) {
        range.nStart = UCodePoint.fromUStringToNumber(range.range_start);
      }
      if (range.range_end) {
        range.nEnd = UCodePoint.fromUStringToNumber(range.range_end);
      }
    }

    if (range.nStart && range.nEnd) {
      if (cpNumber >= range.nStart && cpNumber <= range.nEnd) {
        tRange = {
          key: key,
          r: range,
        };
        break;
      }
    }
  }

  if (!tRange) {
    const uCpStr = uCodePoint.toUString();
    const glyphsByUCodepoint = sMuFLMetadata.getFontInfo()?.glyphsByUCodepoint;
    const tGlyph = glyphsByUCodepoint ? glyphsByUCodepoint[uCpStr] : undefined;
    const fontInfo = sMuFLMetadata.getFontInfo();
    if (tGlyph && tGlyph.isOptionalGlyph && fontInfo.optRange) {
      tRange = {
        key: fontInfo.optRange.description || '',
        r: fontInfo.optRange,
      };
    }
  }

  if (!tRange) {
    tRange = {
      key: 'unicode',
      r: {
        description: 'unicode',
        noSpecLink: true,
      },
    };
  }

  let jsx = <div />;
  if (tRange) {
    const filename = _toRaneSpecFilename(tRange.key);

    jsx = (
      <div>
        range:&nbsp;
        {tRange.r.noSpecLink ? (
          tRange.key
        ) : (
          <Link
            href={`https://w3c.github.io/smufl/latest/tables/${filename}.html`}
            title={`${tRange.key} range spec`}
          >
            {tRange.key}
          </Link>
        )}
        <br />
        {(Object.keys(tRange.r) as (keyof SFVRangeItem)[]).map(function (key) {
          let item = undefined;
          if (key === 'nStart' || key === 'nEnd') {
            // skip them
            return <span key={key}></span>;
          } else {
            const tRanges: SFVRangeItem | undefined = tRange?.r;
            if (tRanges) {
              if (key === 'glyphs') {
                item = (
                  <div className="glyphsContainer">
                    {tRanges.glyphs?.map(function (v) {
                      return (
                        <span key={v}>{appendGlyphname(sMuFLMetadata, v, glyphname).jsxDom}, </span>
                      );
                    })}
                  </div>
                );
              } else if (tRanges) {
                item = appendCodepointOrText((tRanges[key] || '').toString());
              }
            }
          }
          const ret = (
            <span key={key}>
              {key}: {item},
            </span>
          );
          return ret;
        })}
      </div>
    );
  }
  return <div className="ranges infoPanel">{jsx}</div>;
}

const ClassesInfo = (props: {
  uCodePoint: UCodePoint;
  sMuFLMetadata: Database;
  classes?: Classes;
  selectOption: IUCSelectOption;
}) => {
  const { sMuFLMetadata, classes, selectOption } = props;
  const { glyphname = '' } = selectOption;

  const tClasses = [];
  for (const key in classes) {
    const c = classes[key];
    if (c.indexOf(glyphname) !== -1) {
      tClasses.push({
        key: key,
        class: c,
      });
    }
  }

  let jsx;

  if (tClasses.length) {
    jsx = tClasses.map(function (kc) {
      return (
        <div className="classInfo" key={kc.key}>
          {kc.key}:
          <div className="glyphsContainer">
            {kc.class.map(function (tGglyphname) {
              return (
                <span key={tGglyphname}>
                  {appendGlyphname(sMuFLMetadata, tGglyphname, glyphname).jsxDom},{' '}
                </span>
              );
            })}
          </div>
        </div>
      );
    });
  }

  return (
    <div className="classes infoPanel">
      {jsx ? 'classes:' : ''}
      {jsx}
    </div>
  );
};

const LigaturesInfo = (props: {
  uCodePoint: UCodePoint;
  sMuFLMetadata: Database;
  ligatures: Ligatures | undefined;
  selectOption: IUCSelectOption;
}) => {
  const { sMuFLMetadata, ligatures, selectOption } = props;
  const { glyphname = '' } = selectOption;
  const ligature = ligatures ? ligatures[glyphname] : undefined;

  return (
    <div className="ligatures infoPanel">
      {ligature && addLigatureInfo(sMuFLMetadata, 'ligatures: ', ligature, glyphname, glyphname)}
    </div>
  );
};

const SetsInfo = (props: {
  uCodePoint: UCodePoint;
  sMuFLMetadata: Database;
  selectOption: IUCSelectOption;
}) => {
  const { sMuFLMetadata, selectOption, uCodePoint } = props;
  const { glyphname = '' } = selectOption;
  const fontInfo = sMuFLMetadata.getFontInfo();
  const setsByAlternateFor = fontInfo?.setsByAlternateFor;
  const setsByName = fontInfo?.setsByName;

  const setsByAlternateForItem = setsByAlternateFor ? setsByAlternateFor[glyphname] : undefined;
  const setsByNameItem = setsByName ? setsByName[glyphname] : undefined;

  const ret = null;
  if (!setsByAlternateForItem && !setsByNameItem) {
    return ret;
  }

  const setInfosContainerContent: JSX.Element[] = [];
  const setNamesContent: JSX.Element[] = [];
  [setsByAlternateForItem, setsByNameItem].forEach(function (items) {
    if (!items) {
      return;
    }
    const setInfoContainerContent: JSX.Element[] = [];
    items.forEach(function (item) {
      setNamesContent.push(<span key={item.setName}>{item.setName}, </span>);
      // $setInfosContainer.append(`${item.setName}: `);
      // $setNames.append(`${item.setName}, `);
      const setInfo = (
        <div className="setInfo">
          description: {item.set.description}, type: {item.set.type}, alternateFor:
          {appendGlyphname(sMuFLMetadata, item.glyph.alternateFor, glyphname).jsxDom}, codepoint:
          {appendCodepointOrText(item.glyph.codepoint, uCodePoint.toUString())}, description:{' '}
          {item.glyph.description}, name:
          {appendGlyphname(sMuFLMetadata, item.glyph.name, glyphname).jsxDom}
        </div>
      );

      const setInfoContainer = (
        <div className="setInfoContainer" key={item.setName}>
          {item.setName}:{setInfoContainerContent}
          {setInfo}
        </div>
      );

      setInfosContainerContent.push(setInfoContainer);

      // const $setInfo = $('<div class="setInfo"></div>');
      //_$c_appendText($setInfo, `description: ${item.set.description}, type: ${item.set.type}`);
      //_$c_appendText($setInfo, `, alternateFor: `);
      //appendGlyphname($setInfo, item.glyph.alternateFor, glyphname);
      //_$c_appendText($setInfo, `, codepoint: `);
      //appendCodepointOrText($setInfo, item.glyph.codepoint, uCodepoint);
      //_$c_appendText($setInfo, `, description: ${item.glyph.description}`);
      //_$c_appendText($setInfo, `, name: `);
      //appendGlyphname($setInfo, item.glyph.name, glyphname);
      //$setInfoContainer.append($setInfo);
      //$setInfosContainer.append($setInfoContainer);
    });
  });

  return (
    <div className="sets infoPanel">
      sets:
      <span className="setNames">{setNamesContent}</span>
      <div className="setInfosContainer">{setInfosContainerContent}</div>
    </div>
  );
};

export default function GlyphInfoPanel(props: IGlyphInfoPanelParams): JSX.Element {
  const { selectOption, sMuFLMetadata, uCodePoint } = props;

  const fontMetaData = sMuFLMetadata?.fontMetadata();
  const glyphsWithAlternates = fontMetaData?.glyphsWithAlternates;
  const ranges = sMuFLMetadata?.data_.ranges;
  const classes = sMuFLMetadata.data_.classes;
  const ligatures = fontMetaData?.ligatures;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1em',
        '.infoPanel': {
          backgroundColor: '#eeeeee',
          borderRadius: '1em',
          padding: '0.5em',
        },
      }}
    >
      <BasicInfo {...props} />
      <AlternatesInfo
        sMuFLMetadata={sMuFLMetadata}
        selectOption={selectOption}
        glyphsWithAlternates={glyphsWithAlternates}
      />
      <RangeInfo
        uCodePoint={uCodePoint}
        sMuFLMetadata={sMuFLMetadata}
        selectOption={selectOption}
        ranges={ranges}
      />
      <ClassesInfo
        uCodePoint={uCodePoint}
        sMuFLMetadata={sMuFLMetadata}
        selectOption={selectOption}
        classes={classes}
      />
      <LigaturesInfo
        uCodePoint={uCodePoint}
        sMuFLMetadata={sMuFLMetadata}
        selectOption={selectOption}
        ligatures={ligatures}
      />
      <SetsInfo uCodePoint={uCodePoint} sMuFLMetadata={sMuFLMetadata} selectOption={selectOption} />
    </Box>
  );
}
