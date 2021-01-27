import Head from 'next/head';
// import styles from '../styles/Home.module.css';
import { /* NextRouter, Router, */ useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
// import { route } from 'next/dist/next-server/server/router';

import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import {
  Select,
  MenuItem,
  Divider,
  TextField,
  FormControlLabel,
  Checkbox,
  Tooltip,
  StepIconClasskey,
  CircularProgress,
  Menu,
  Link,
  Toolbar,
  makeStyles,
  IconButton,
  Drawer,
  AppBar,
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import React, { useState, useEffect, ReactElement } from 'react';

/*
import ProTip from '../src/ProTip';
import Link from '../src/Link';
import Copyright from '../src/Copyright';
*/

export class Settings {
  static keys = ['cutOutOrigin_BBL'];
  static prefKey(idx: number): string {
    return `settings.${Settings.keys[idx]}`;
  }

  cutOutOrigin_BBL: boolean;

  constructor(cutOutOrigin_BBL = false) {
    this.cutOutOrigin_BBL = cutOutOrigin_BBL;
  }

  toQuery(ret: URLSearchParams): void {
    ret.set(Settings.prefKey(0), this.cutOutOrigin_BBL.toString());
  }

  static fromQuery(query: ParsedUrlQuery): Settings {
    let cutOutOrigin_BBL = false;
    const key0 = this.prefKey(0);
    if (key0 in query) {
      cutOutOrigin_BBL = (query[key0] || 'false') === 'true';
    }
    return new Settings(cutOutOrigin_BBL);
  }
}

export class Options {
  static keys = ['fontUrl', 'fontMetadataUrl', 'glyphnamesUrl', 'classesUrl', 'rangesUrl', 'glyph'];
  params: Record<string, string>;
  settings: Settings;

  constructor(params = {}, settings: Settings = new Settings()) {
    this.params = params;
    this.settings = settings;
  }

  toURLSearchParams(): URLSearchParams {
    const ret = new URLSearchParams(this.params);
    this.settings.toQuery(ret);
    return ret;
  }

  static fromValues(
    fontUrl: string,
    fontMetadataUrl: string,
    glyphnamesUrl: string,
    classesUrl: string,
    rangesUrl: string,
    settings: Settings = new Settings(),
    glyph?: string,
  ): Options {
    const params: Record<string, string> = {};
    params.fontUrl = fontUrl;
    params.fontMetadataUrl = fontMetadataUrl;
    params.glyphnamesUrl = glyphnamesUrl;
    params.classesUrl = classesUrl;
    params.rangesUrl = rangesUrl;
    if (glyph) {
      params.glyph = glyph;
    }

    return new Options(params, settings);
  }

  static fromQuery(query: ParsedUrlQuery): Options {
    const settings = Settings.fromQuery(query);
    return new Options(query, settings);
  }
}

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

    const getDrawerChoices = () => {
      return headersData.map(({ label, href = '' }, idx) => {
        return (
          <Link
            href={href}
            component="span"
            color={'inherit'}
            style={{ textDecoration: 'none' }}
            key={`${idx}_href`}
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
      return headersData.map(({ label, href }, idx) => {
        return (
          // eslint-disable-next-line react/jsx-key
          <Button
            {...{
              key: `${idx}_href`,
              color: 'inherit',
              to: href,
              component: 'span',
              className: menuButton,
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
      </header>
    );
  }
  return Header();
}

export default function Viewer(): ReactElement {
  const { query, asPath } = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // console.log('isLoading:' + isLoading);
    const hasQueryParamsButWaitForUpdate =
      (asPath.includes('?') && Object.keys(query).length === 0) || !isLoading;
    if (hasQueryParamsButWaitForUpdate) {
      return;
    }
    if (isLoading) {
      setIsLoading(false);
      Options.fromQuery(query);
    }
  }, [asPath, isLoading, query]);

  if (isLoading) {
    return (
      <>
        <CircularProgress />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>smuflfontviewer</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container maxWidth="xl">
        <Box my={4}>
          <HeaderMenu />
          <Typography variant="h4" component="h1" gutterBottom></Typography>
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
