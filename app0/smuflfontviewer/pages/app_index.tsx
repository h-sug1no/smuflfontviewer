import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { NextRouter, useRouter } from 'next/router'
import { route } from 'next/dist/next-server/server/router';

import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { Select, MenuItem, CircularProgress } from '@material-ui/core';
import { useState, useRef, useEffect, MutableRefObject } from 'react';
/*
import ProTip from '../src/ProTip';
import Link from '../src/Link';
import Copyright from '../src/Copyright';
*/

function _createDemolistOptions(name: string, value: number,
  lFontBasePath: string, lMetadataBasePath: string,
  optFontPath: string, optFontMetadataPath: string, settings?: object) {
  return {
    name: name,
    value: value,
    fontUrl: lFontBasePath + optFontPath,
    fontMetadataUrl: lFontBasePath + optFontMetadataPath,
    glyphnamesUrl: lMetadataBasePath + '/glyphnames.json',
    classesUrl: lMetadataBasePath + '/classes.json',
    rangesUrl: lMetadataBasePath + '/ranges.json',
    settings: settings
  };
}

const oldFontSettings = {
  cutOutOrigin_BBL: true
};

const devPresetValue = 1000;

const presets = [
  _createDemolistOptions('local Bravura(debug)', devPresetValue + 0,
    '/packages/bravura/redist',
    './packages/smufl/metadata',
    '/woff/Bravura.woff2', '/bravura_metadata.json'
  ),
  _createDemolistOptions('local Petaluma(debug)', devPresetValue + 1,
  './packages/petaluma/redist',
  './packages/smufl/metadata',
  '/woff/Petaluma.woff2', '/petaluma_metadata.json',
  oldFontSettings),
  _createDemolistOptions('steinbergmedia/bravura/master + w3c/smufl', 0,
    'https://raw.githubusercontent.com/steinbergmedia/bravura/master/redist',
    'https://raw.githubusercontent.com/w3c/smufl/gh-pages/metadata',
    '/woff/Bravura.woff2', '/bravura_metadata.json'
    ),
  _createDemolistOptions('steinbergmedia/petaluma/master + w3c/smufl', 1,
    'https://raw.githubusercontent.com/steinbergmedia/petaluma/master/redist',
    'https://raw.githubusercontent.com/w3c/smufl/gh-pages/metadata',
    '/woff/Petaluma.woff2', '/petaluma_metadata.json',
    oldFontSettings
    ),
];

const createOptions = (isDevMode: boolean) => {
  const ret: Array<object> = [];
  presets.forEach((v) => {
    if (v.value >= devPresetValue && !isDevMode) {
      return;
    }
    ret.push(<MenuItem value={v.value} key={v.value}>{v.name}</MenuItem>);
  });
  return ret;
}

export default function AppIndex() {

  const [presetValue, setPresetValue] = useState<number>(0);
  const [isDevMode, setIsDevMode] = useState<boolean>(false);;

  const { query, asPath } = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // console.log('isLoading:' + isLoading);
    const hasQueryParamsButWaitForUpdate =
      (asPath.includes("?") && Object.keys(query).length === 0) || !isLoading;
    if (hasQueryParamsButWaitForUpdate) {
      return;
    }
    if (isLoading) {
      setIsLoading(false);
      if (query.hasOwnProperty('dev')) {
        const tIsDevMode = (query.dev || 'true') === 'true';
        setIsDevMode(tIsDevMode);
        setPresetValue(tIsDevMode ? devPresetValue : 0);
      }
    }
  }, [query]);

  if(isLoading){
    return <>Loading...</>
  }

  if (isDevMode) {
    // mkdir /public/packages
    // and clone followings in packages/.
    //   https://github.com/w3c/smufl.git
    //   https://github.com/steinbergmedia/bravura
    //   https://github.com/steinbergmedia/petaluma
    //
  }

  // console.log(presetValue, isDevMode);

  return (
    <>
      <Head>
        <title>smuflfontviewer</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container maxWidth="sm">
        <Box my={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Next.js example
          </Typography>
          <Select id="presetSelect"
            value={presetValue}
            onChange={(e) => {setPresetValue(Number(e.target.value))}}
          >
            {createOptions(isDevMode)}
          </Select>
          {/*
          <Button variant="contained" color="primary" component={Link} naked href="/">
            Go to the main page
          </Button>
          <ProTip />
          <Copyright />
          */}
        </Box>
      </Container>
    </>
  )
}
