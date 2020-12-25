import Head from 'next/head';
// import styles from '../styles/Home.module.css';
import { /* NextRouter, Router, */ useRouter } from 'next/router';
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
} from '@material-ui/core';
import React, { useState, useEffect, ReactElement } from 'react';
/*
import ProTip from '../src/ProTip';
import Link from '../src/Link';
import Copyright from '../src/Copyright';
*/

class Settings {
  cutOutOrigin_BBL: boolean;
  constructor(cutOutOrigin_BBL = false) {
    this.cutOutOrigin_BBL = cutOutOrigin_BBL;
  }
}

class Preset {
  name: string;
  value: number;
  fontUrl: string;
  fontMetadataUrl: string;
  glyphnamesUrl: string;
  classesUrl: string;
  rangesUrl: string;
  settings: Settings;

  constructor(
    name: string,
    value: number,
    fontUrl: string,
    fontMetadataUrl: string,
    glyphnamesUrl: string,
    classesUrl: string,
    rangesUrl: string,
    settings: Settings,
  ) {
    this.name = name;
    this.value = value;
    this.fontUrl = fontUrl;
    this.fontMetadataUrl = fontMetadataUrl;
    this.glyphnamesUrl = glyphnamesUrl;
    this.classesUrl = classesUrl;
    this.rangesUrl = rangesUrl;
    this.settings = settings;
  }
}

function _createDemolistOptions(
  name: string,
  value: number,
  lFontBasePath: string,
  lMetadataBasePath: string,
  optFontPath: string,
  optFontMetadataPath: string,
  settings: Settings = new Settings(),
) {
  return new Preset(
    name,
    value,
    lFontBasePath + optFontPath,
    lFontBasePath + optFontMetadataPath,
    lMetadataBasePath + '/glyphnames.json',
    lMetadataBasePath + '/classes.json',
    lMetadataBasePath + '/ranges.json',
    settings,
  );
}

const oldFontSettings = new Settings(true);

const devPresetValue = 1000;

const presets: Array<Preset> = [
  _createDemolistOptions(
    'local Bravura(debug)',
    devPresetValue + 0,
    '/packages/bravura/redist',
    './packages/smufl/metadata',
    '/woff/Bravura.woff2',
    '/bravura_metadata.json',
  ),
  _createDemolistOptions(
    'local Petaluma(debug)',
    devPresetValue + 1,
    './packages/petaluma/redist',
    './packages/smufl/metadata',
    '/woff/Petaluma.woff2',
    '/petaluma_metadata.json',
    oldFontSettings,
  ),
  _createDemolistOptions(
    'steinbergmedia/bravura/master + w3c/smufl',
    0,
    'https://raw.githubusercontent.com/steinbergmedia/bravura/master/redist',
    'https://raw.githubusercontent.com/w3c/smufl/gh-pages/metadata',
    '/woff/Bravura.woff2',
    '/bravura_metadata.json',
  ),
  _createDemolistOptions(
    'steinbergmedia/petaluma/master + w3c/smufl',
    1,
    'https://raw.githubusercontent.com/steinbergmedia/petaluma/master/redist',
    'https://raw.githubusercontent.com/w3c/smufl/gh-pages/metadata',
    '/woff/Petaluma.woff2',
    '/petaluma_metadata.json',
    oldFontSettings,
  ),
];
const presetMap: { [key: number]: Preset } = {};
presets.forEach((v) => {
  presetMap[v.value] = v;
});

const createOptions = (isDevMode: boolean) => {
  const ret: Array<ReactElement> = [];
  presets.forEach((v) => {
    if (v.value >= devPresetValue && !isDevMode) {
      return;
    }
    ret.push(
      <MenuItem value={v.value} key={v.value}>
        {v.name}
      </MenuItem>,
    );
  });
  return ret;
};

export default function AppIndex(): ReactElement {
  const [presetValue, setPresetValue] = useState<number>(0);
  const [isDevMode, setIsDevMode] = useState<boolean>(false);

  const [fontUrl, setFontUrl] = useState<string>('');
  const [fontMetadataUrl, setFontMetadataUrl] = useState<string>('');
  const [glyphnamesUrl, setGlyphnamesUrl] = useState<string>('');
  const [classesUrl, setClassesUrl] = useState<string>('');
  const [rangesUrl, setRangesUrl] = useState<string>('');
  const [glyph, setGlyph] = useState<string>('');
  const [cutOutOrigin_BBL, setCutOutOrigin_BBL] = useState<boolean>(false);

  const { query, asPath } = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const setPreset = (val: number) => {
    const preset: Preset = presetMap[val];
    setFontUrl(preset.fontUrl);
    setFontMetadataUrl(preset.fontMetadataUrl);
    setGlyphnamesUrl(preset.glyphnamesUrl);
    setClassesUrl(preset.classesUrl);
    setRangesUrl(preset.rangesUrl);
    // setGlyph();
    setCutOutOrigin_BBL(preset.settings.cutOutOrigin_BBL);
  };

  useEffect(() => {
    // console.log('isLoading:' + isLoading);
    const hasQueryParamsButWaitForUpdate =
      (asPath.includes('?') && Object.keys(query).length === 0) || !isLoading;
    if (hasQueryParamsButWaitForUpdate) {
      return;
    }
    if (isLoading) {
      setIsLoading(false);
      if (query.hasOwnProperty.call(query, 'dev')) {
        const tIsDevMode = (query.dev || 'true') === 'true';
        setIsDevMode(tIsDevMode);
        setPresetValue(tIsDevMode ? devPresetValue : 0);
      }
      setPreset(presetValue);
    }
  }, [asPath, isLoading, presetValue, query]);

  if (isLoading) {
    return <>Loading...</>;
  }

  if (isDevMode) {
    // mkdir /public/packages
    // and clone followings in packages/.
    //   https://github.com/w3c/smufl.git
    //   https://github.com/steinbergmedia/bravura
    //   https://github.com/steinbergmedia/petaluma
    //
  }

  const openViewer = () => {
    const searchParams = new URLSearchParams();
    searchParams.set('fontUrl', fontUrl);
    searchParams.set('fontMetadataUrl', fontMetadataUrl);
    searchParams.set('classesUrl', glyphnamesUrl);
    searchParams.set('classesUrl', classesUrl);
    searchParams.set('rangesUrl', rangesUrl);
    const tGlyph = glyph.trim();
    if (tGlyph.length) {
      searchParams.set('glyph', tGlyph);
    }
    if (cutOutOrigin_BBL) {
      searchParams.set('cutOutOrigin_BBL', 'true');
    }
    console.log(searchParams.toString());
  };
  // console.log(presetValue, isDevMode);

  return (
    <>
      <Head>
        <title>smuflfontviewer</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container maxWidth="xl">
        <Box my={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Presets:
          </Typography>
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
        </Box>
      </Container>
    </>
  );
}
