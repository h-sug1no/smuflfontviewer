import Head from 'next/head';
// import styles from '../styles/Home.module.css';
import { /* NextRouter, Router, */ useRouter } from 'next/router';
// import { route } from 'next/dist/next-server/server/router';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import NoteIcon from '@mui/icons-material/Note';
import {
  MenuItem,
  CircularProgress,
  Link,
  Toolbar,
  IconButton,
  Drawer,
  AppBar,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import MenuIcon from '@mui/icons-material/Menu';
import React, { useState, useEffect, ReactElement, useRef } from 'react';
import AnyListDialogRef, { IHandlers } from '../components/AnyListDialog';
import { Dict, GlyphnameItem, UCodepointStr } from '../lib/SMuFLTypes';
import { Database } from '../lib/SMuFLMetadata';
import { GlyphnamesList } from '../components/GlyphnamesList';
import { OptionalGlyphsList } from '../components/OptionalGlyphsList';
import { RangesList } from '../components/RangesList';
import { ClassesList } from '../components/ClassesList';
import { LigaturesList } from '../components/LigaturesList';
import { SetsList } from '../components/SetsList';
import { GlyphsWithAlternatesList } from '../components/GlyphsWithAlternatesList';
import { GlyphsWithAnchorsList } from '../components/GlyphsWithAnchorsList';
import UCodepointSelect, {
  initUCodepointSelectOptions,
  IUCSelectOption,
  getUCSelectOptionByValue,
  formatCodepointNumber,
} from '../components/UCodepointSelect';
import { UCodePoint } from '../lib/UCodePoint';
import RangeSelect, {
  registerRangeSelectOption,
  getRangeSelectOptionByValue,
  IRangeSelectOption,
  sortRangeSelectOptions,
} from '../components/RangeSelect';
import GlyphCanvas from '../components/GlyphCanvas';
import { Options } from '../lib/Viewer';
import { _initFontFace } from '../lib/JSDomFontFace';
/*
import ProTip from '../src/ProTip';
import Link from '../src/Link';
import Copyright from '../src/Copyright';
*/

const sMuFLMetadata: Database = new Database();
let options: Options;

const dialogContents: Dict<JSX.Element | undefined> = {};

function HeaderMenu() {
  const headersData = [
    { label: 'glyphnames', href: '' },
    { label: 'optionalGlyphs' },
    { label: 'ranges' },
    { label: 'classes' },
    { label: 'metadata' },
    { label: 'ligatures' },
    { label: 'sets' },
    { label: 'glyphsWithAlternates' },
    { label: 'glyphsWithAnchors' },
    {
      label: (
        <div id="staticLinkContainer" className="aLinkContainer">
          <Link id="AStaticLink" href="#" title="static link to the current glyph">
            static link
          </Link>
          <input
            id="BCCStaticLink"
            type="button"
            title="Copy the URL of the static link to the clipboard"
            value="cc"
          />
        </div>
      ),
      type: 'staticLink',
    },

    {
      label: (
        <div id="UULinkContainer" className="aLinkContainer">
          <Link
            id="AUULink"
            href="#"
            title="link to the current glyph in util.unicode.org: Character Properties"
          >
            Unicode Character Properties
          </Link>
        </div>
      ),
      type: 'uuLink',
    },
  ];

  const useStyles = makeStyles(() => ({
    header: {
      backgroundColor: '#400CCC',
      paddingRight: '79px',
      paddingLeft: '118px',
      '@media (max-width: 900px)': {
        paddingLeft: 0,
      },
      opacity: 0,
      height: '5px',
      overflow: 'hidden',
      '&:hover': {
        opacity: 1,
        height: 'auto',
      },
    },
    logo: {
      fontFamily: 'Work Sans, sans-serif',
      fontWeight: 600,
      color: '#FFFEFE',
      textAlign: 'left',
    },
    menuButton: {
      fontFamily: 'Open Sans, sans-serif',
      fontWeight: 700,
      size: '18px',
      marginLeft: '38px',
    },
    toolbar: {
      display: 'flex',
      justifyContent: 'space-between',
    },
    drawerContainer: {
      padding: '20px 30px',
    },
  }));

  function Header() {
    const cal = useRef<IHandlers | null>(null);

    const { header, logo, menuButton, toolbar, drawerContainer } = useStyles();

    const [state, setState] = useState({
      mobileView: false,
      drawerOpen: false,
    });

    const { mobileView, drawerOpen } = state;

    useEffect(() => {
      const setResponsiveness = () => {
        return window.innerWidth < 900
          ? setState((prevState) => ({ ...prevState, mobileView: true }))
          : setState((prevState) => ({ ...prevState, mobileView: false }));
      };

      setResponsiveness();

      window.addEventListener('resize', () => setResponsiveness());
    }, []);

    const onClick = (type: string, e: React.MouseEvent) => {
      console.log(type, e);
      if (cal && cal.current) {
        let listJsxDom = type ? dialogContents[type] : undefined;
        if (!listJsxDom) {
          const fontInfo = sMuFLMetadata.getFontInfo();

          switch (type) {
            case 'glyphnames':
              listJsxDom = GlyphnamesList(sMuFLMetadata, sMuFLMetadata.data_.glyphnames);
              break;
            case 'optionalGlyphs':
              listJsxDom = OptionalGlyphsList(sMuFLMetadata, fontInfo.fontMetadata_.optionalGlyphs);
              break;
            case 'ranges':
              listJsxDom = RangesList(sMuFLMetadata, sMuFLMetadata.data_.ranges);
              break;
            case 'classes':
              listJsxDom = ClassesList(sMuFLMetadata, sMuFLMetadata.data_.classes);
              break;
            case 'ligatures':
              listJsxDom = LigaturesList(sMuFLMetadata, fontInfo.fontMetadata_.ligatures);
              break;
            case 'sets':
              listJsxDom = SetsList(sMuFLMetadata, fontInfo.fontMetadata_.sets);
              break;
            case 'glyphsWithAlternates':
              listJsxDom = GlyphsWithAlternatesList(
                sMuFLMetadata,
                fontInfo.fontMetadata_.glyphsWithAlternates,
              );
              break;
            case 'glyphsWithAnchors':
              listJsxDom = GlyphsWithAnchorsList(
                sMuFLMetadata,
                fontInfo.fontMetadata_.glyphsWithAnchors,
              );
              break;
            default:
              break;
          }
          dialogContents[type] = listJsxDom;
        }
        cal?.current?.handleClickOpen(<div className="infoDialogContents">{listJsxDom}</div>);
      }
    };

    const displayDesktop = () => {
      return (
        <Toolbar className={toolbar}>
          {appLogo}
          <div>{getMenuButtons()}</div>
        </Toolbar>
      );
    };

    const displayMobile = () => {
      const handleDrawerOpen = () => setState((prevState) => ({ ...prevState, drawerOpen: true }));
      const handleDrawerClose = () =>
        setState((prevState) => ({ ...prevState, drawerOpen: false }));

      return (
        <Toolbar>
          <IconButton
            {...{
              edge: 'start',
              color: 'inherit',
              'aria-label': 'menu',
              'aria-haspopup': 'true',
              onClick: handleDrawerOpen,
            }}
            size="large"
          >
            <MenuIcon />
          </IconButton>

          <Drawer
            {...{
              anchor: 'left',
              open: drawerOpen,
              onClose: handleDrawerClose,
            }}
          >
            <div className={drawerContainer}>{getDrawerChoices()}</div>
          </Drawer>

          <div>{appLogo}</div>
        </Toolbar>
      );
    };

    const mapHeaderData = (
      func: (
        label: string | JSX.Element,
        href: string,
        type: string | undefined,
        eType: string,
        idx: number,
      ) => JSX.Element,
    ) => {
      return headersData.map(({ label, href = '#', type }, idx) => {
        let eType: string | undefined = type;
        if (typeof label === 'string') {
          eType = eType || label;
        }
        return func(label, href, type, eType || '', idx);
      });
    };

    const getDrawerChoices = () => {
      return mapHeaderData((label, href, type, eType, idx) => {
        return (
          <Link
            href={href || '#'}
            component="span"
            color={'inherit'}
            style={{ textDecoration: 'none' }}
            key={`${idx}_href`}
            onClick={(e: React.MouseEvent) => onClick(eType, e)}
          >
            <MenuItem>{label}</MenuItem>
          </Link>
        );
      });
    };

    const appLogo = (
      <Typography variant="h6" component="h1" className={logo}>
        smuflfontviewer
      </Typography>
    );

    const getMenuButtons = () => {
      return mapHeaderData((label, href, type, eType, idx) => {
        return (
          <Button
            {...{
              key: `${idx}_href`,
              color: 'inherit',
              to: href,
              component: 'span',
              className: menuButton,
              onClick: (e: React.MouseEvent) => onClick(eType, e),
            }}
          >
            {label}
          </Button>
        );
      });
    };

    return (
      <header>
        <AppBar className={header}>{mobileView ? displayMobile() : displayDesktop()}</AppBar>
        <AnyListDialogRef ref={cal} />
      </header>
    );
  }
  return Header();
}

const createUCodepointSelectOptions = (sMuFLMetadata: Database) => {
  const fontInfo = sMuFLMetadata.getFontInfo();
  const soptions: IUCSelectOption[] = [];
  const glyphnames = sMuFLMetadata.data_.glyphnames || {};

  Object.keys(glyphnames).forEach((gname) => {
    //{series: 'optionalGlyphs', value: 10, name: '1'},
    const glyphnameItem: GlyphnameItem = glyphnames[gname];
    if (glyphnameItem && glyphnameItem.codepoint) {
      const ucpStr: UCodepointStr = glyphnameItem.codepoint;
      if (ucpStr) {
        const cp = ucpStr.replace('U+', '');
        soptions.push({
          series: 'glyphnames',
          value: cp,
          name: cp + ': ' + gname,
          glyphname: gname,
          cpStr: String.fromCharCode(parseInt(`0x${cp}`)),
        });
      }
    }
  });
  const optionalGlyphs = fontInfo.fontMetadata_.optionalGlyphs || {};
  console.warn('no optionalGlyphs');
  Object.keys(optionalGlyphs || {}).forEach((gname) => {
    const { codepoint } = optionalGlyphs[gname] || {};
    if (codepoint) {
      const cp = codepoint.replace('U+', '');
      soptions.push({
        series: 'optionalGlyphs',
        value: cp,
        name: cp + ': ' + gname,
        glyphname: gname,
        cpStr: String.fromCharCode(parseInt(`0x${cp}`)),
      });
    }
  });
  initUCodepointSelectOptions(soptions);
};

const UNICODE_RANGE_NAME = 'unicode';
const createRangeSelectOptions = (sMuFLMetadata: Database) => {
  const ranges = sMuFLMetadata.data_.ranges;

  if (!ranges) {
    return;
  }

  Object.keys(ranges).forEach((key) => {
    const range = ranges[key];
    if (range.range_start) {
      registerRangeSelectOption(key, UCodePoint.fromUString(range.range_start).toNumber());
    }
  });
  registerRangeSelectOption(UNICODE_RANGE_NAME, 0x21, 'unicode range');
  const optRange = sMuFLMetadata.getFontInfo().optRange;
  if (optRange && optRange.range_start) {
    registerRangeSelectOption(
      optRange.description || '?',
      UCodePoint.fromUString(optRange.range_start).toNumber(),
    );
  }
  sortRangeSelectOptions();
};
const cpNumber2Range = (cpNumber: number) => {
  const ranges = sMuFLMetadata.data_.ranges;
  let tRange;
  for (const key in ranges) {
    const range = ranges[key];
    if (!range.nStart && range.range_start) {
      range.nStart = UCodePoint.fromUString(range.range_start).toNumber();
    }
    if (!range.nEnd && range.range_end) {
      range.nEnd = UCodePoint.fromUString(range.range_end).toNumber();
    }

    if (cpNumber >= Number(range.nStart) && cpNumber <= Number(range.nEnd)) {
      tRange = {
        key: key,
        r: range,
      };
      break;
    }
  }

  if (!tRange) {
    const fontInfo = sMuFLMetadata.getFontInfo();
    if (fontInfo && fontInfo.glyphsByUCodepoint) {
      const tGlyph = fontInfo.glyphsByUCodepoint[UCodePoint.fromCpNumber(cpNumber).toUString()];
      if (tGlyph && tGlyph.isOptionalGlyph) {
        const optRange = sMuFLMetadata.getFontInfo().optRange;
        tRange = {
          key: optRange?.description,
          r: optRange,
        };
      }
    }
  }

  if (!tRange) {
    tRange = {
      key: UNICODE_RANGE_NAME,
      r: {
        description: UNICODE_RANGE_NAME,
        noSpecLink: true,
      },
    };
  }
  return tRange;
};

const useStyles = makeStyles(() => ({
  button: {
    fontSize: '2rem',
  },
}));

export default function Viewer(): ReactElement {
  enum DBState {
    INITIAL,
    LOADING,
    FONTLOADING,
    ERROR,
    READY,
  }
  const classes = useStyles();
  const { query, asPath } = useRouter();
  const [dbState, setDBState] = useState(DBState.INITIAL);

  const [currentUCodepoint, _setCurrentUCodepoint] = useState<IUCSelectOption | null>(null);
  const currentUCodepointRef = React.useRef(currentUCodepoint);
  const setCurrentUCodepoint = React.useCallback((data: IUCSelectOption | null) => {
    currentUCodepointRef.current = data || null;
    _setCurrentUCodepoint(currentUCodepointRef.current);
    const tRange = cpNumber2Range(
      UCodePoint.fromUString((data || {}).value || 'NaN' /* FIXME */).toNumber(),
    );
    if (tRange && tRange.key) {
      setCurrentRange(getRangeSelectOptionByValue(tRange.key));
    }
  }, []);

  const [currentRange, _setCurrentRange] = useState<IRangeSelectOption | null>(null);
  const currentRangeRef = React.useRef(currentRange);
  const setCurrentRange = (data: IRangeSelectOption | null) => {
    currentRangeRef.current = data || null;
    _setCurrentRange(currentRangeRef.current);
  };

  useEffect(() => {
    // console.log('isLoading:' + isLoading);
    const hasQueryParamsButWaitForUpdate = asPath.includes('?') && Object.keys(query).length === 0;
    if (hasQueryParamsButWaitForUpdate) {
      return;
    }
    if (dbState === DBState.INITIAL) {
      setDBState(DBState.LOADING);
      options = Options.fromQuery(query);
      sMuFLMetadata.init(options).then((/* obj */) => {
        if (sMuFLMetadata.initErrors_?.length) {
          alert(
            sMuFLMetadata.initErrors_?.map(function (str) {
              return str + '\n';
            }),
          );
          setDBState(DBState.ERROR);
        } else {
          setDBState(DBState.FONTLOADING);
          createUCodepointSelectOptions(sMuFLMetadata);
          createRangeSelectOptions(sMuFLMetadata);
          _initFontFace(options, (type: string) => {
            if (type === 'smuflFontFace') {
              setDBState(DBState.READY);
              if (!currentUCodepointRef.current) {
                const tUCp = getUCSelectOptionByValue('E0A3');
                if (tUCp) {
                  setCurrentUCodepoint(tUCp);
                }
              }
            }
          });
        }
      });
    }
  }, [
    DBState.ERROR,
    DBState.FONTLOADING,
    DBState.INITIAL,
    DBState.LOADING,
    DBState.READY,
    asPath,
    dbState,
    query,
    setCurrentUCodepoint,
  ]);

  if (dbState <= DBState.LOADING) {
    return (
      <>
        <CircularProgress />
      </>
    );
  }

  const ucodepointSelectOnChange = (v: IUCSelectOption | null): boolean => {
    console.log(JSON.stringify(v));
    if (v) {
      setCurrentUCodepoint(v);
    } else {
      // how to inform repaint?
      // keep current ucodepoint on select.
    }
    return !!v;
  };

  const rangeSelectOnChange = (v: IRangeSelectOption) => {
    console.log(JSON.stringify(v));
    if (v) {
      setCurrentRange(v);
      selectCodepointByNumber(v.codepoint);
    } else {
      // how to inform repaint?
      // keep current ucodepoint on select.
    }
    return !!v;
  };

  function getCodepoint() {
    const tcp = currentUCodepointRef.current || { value: '0' };
    return tcp.value;
  }

  function getCodepointNumber() {
    return Number('0x' + getCodepoint());
  }

  function selectCodepointByString(cp: string) {
    setCurrentUCodepoint(getUCSelectOptionByValue(cp));
  }

  function selectCodepointByNumber(cpNumber: number) {
    selectCodepointByString(formatCodepointNumber(cpNumber));
  }

  function seekToCodepoint(cpNumber: number, d: number, checkHasGlyph: boolean) {
    const fontInfo = sMuFLMetadata.getFontInfo();
    let glyphsByUCodepoint;
    if (fontInfo) {
      glyphsByUCodepoint = fontInfo.glyphsByUCodepoint;
    }

    let codepointStr;
    while ((cpNumber += d) >= 0 && cpNumber < 0x10ffff && !codepointStr) {
      const tCodepointStr = formatCodepointNumber(cpNumber);
      if (checkHasGlyph && glyphsByUCodepoint) {
        if (glyphsByUCodepoint[sMuFLMetadata.ensureUCodepointUString(tCodepointStr)]) {
          codepointStr = tCodepointStr;
        }
      } else {
        codepointStr = tCodepointStr;
      }
    }
    if (codepointStr) {
      selectCodepointByString(codepointStr);
    }
  }

  const messages = {
    BPrev: 'show prev codepoint(h)',
    BNextGlyph: 'show next codepoint with glyph(j)',
    BPrevGlyph: 'show prev codepoint with glyph(k)',
    BNext: 'show next codepoint(l)',
    BShowPrev: 'show (p)rev glyph',
    BShowScratchpad: 'toggle Scratchpad',
  };

  return (
    <>
      <Head>
        <title>smuflfontviewer</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container maxWidth="xl">
        <Box my={4}>
          <HeaderMenu />
          <UCodepointSelect onChange={ucodepointSelectOnChange} value={currentUCodepoint} />
          <div>
            <Button
              title={messages.BPrev}
              className={classes.button}
              onClick={() => {
                seekToCodepoint(getCodepointNumber(), -1, false);
              }}
            >
              ←
            </Button>

            <Button
              title={messages.BNextGlyph}
              onClick={() => {
                seekToCodepoint(getCodepointNumber(), 1, false);
              }}
              className={classes.button}
            >
              ↓
            </Button>

            <Button
              title={messages.BPrevGlyph}
              className={classes.button}
              onClick={() => {
                seekToCodepoint(getCodepointNumber(), -1, true);
              }}
            >
              ↑
            </Button>

            <Button
              title={messages.BNextGlyph}
              className={classes.button}
              onClick={() => {
                seekToCodepoint(getCodepointNumber(), 1, true);
              }}
            >
              →
            </Button>

            <IconButton title={messages.BShowScratchpad} className={classes.button} size="large">
              <NoteIcon />
            </IconButton>
          </div>
          <div>
            <RangeSelect onChange={rangeSelectOnChange} value={currentRange} />
          </div>
          <div>
            {options && (
              <GlyphCanvas
                value={currentUCodepoint}
                sMuFLMetadata={sMuFLMetadata ?? new Database()}
                options={options}
              />
            )}
          </div>
          {/*
        <Select
          id="presetSelect"
          value={presetValue}
          onChange={(e) => {
            const val = Number(e.target.value);
            setPresetValue(val);
            setPreset(val);
          }}
        >
          {createOptions(isDevMode)}
        </Select>
        <Divider />
        <Typography variant="h4" component="h1" gutterBottom>
          font:
        </Typography>
        <TextField
          fullWidth
          id="fontUrl"
          label="fontUrl"
          value={fontUrl}
          onChange={(e) => {
            setFontUrl(e.target.value);
          }}
        />
        <TextField
          fullWidth
          id="fontMetadataUrl"
          label="fontMetadataUrl"
          value={fontMetadataUrl}
          onChange={(e) => {
            setFontMetadataUrl(e.target.value);
          }}
        />
        <Divider />
        <Typography variant="h4" component="h1" gutterBottom>
          SMuFL metadata:
        </Typography>
        <TextField
          fullWidth
          id="glyphnamesUrl"
          label="glyphnamesUrl"
          value={glyphnamesUrl}
          onChange={(e) => {
            setGlyphnamesUrl(e.target.value);
          }}
        />
        <TextField
          fullWidth
          id="classesUrl"
          label="classesUrl"
          value={classesUrl}
          onChange={(e) => {
            setClassesUrl(e.target.value);
          }}
        />
        <TextField
          fullWidth
          id="rangesUrl"
          label="rangesUrl"
          value={rangesUrl}
          onChange={(e) => {
            setRangesUrl(e.target.value);
          }}
        />
        <Divider />
        <TextField
          fullWidth
          id="glyph"
          label="glyph"
          value={glyph}
          onChange={(e) => {
            setGlyph(e.target.value);
          }}
          placeholder="codepoint(ex..:E0A3) or glyphname(ex...:noteheadHalf)"
        />
        <Divider />
        <Tooltip
          title="cutOut anchor points are relative to the:
  unchecked: glyph origin.
  checked: bottom left-hand corner of the glyph bounding box(old spec)."
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={cutOutOrigin_BBL}
                onChange={(e) => {
                  setCutOutOrigin_BBL(e.target.checked);
                }}
                name="cutOutOrigin_BBL"
              />
            }
            label="cutOutOrigin_BBL"
          />
        </Tooltip>
        <Divider />
        <Button fullWidth onClick={openViewer}>
          open
        </Button>
        */}
        </Box>
      </Container>
    </>
  );
}
