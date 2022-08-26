/* eslint-disable no-use-before-define */
import React, { MutableRefObject, useCallback, useEffect, useState } from 'react';
import { IUCSelectOption, IUCSelectOption_value2Number } from './UCodepointSelect';
import { Typography, Box, Slider, Checkbox, FormControlLabel, Button } from '@mui/material';
import TriStateCheckbox, { useTriState, ITriState, TriValues } from '../lib/TriStateCheckbox';
import { Database, FontMetadata } from '../lib/SMuFLMetadata';
import { UCodePoint } from '../lib/UCodePoint';
import { Dict, GlyphsWithAnchorItem } from '../lib/SMuFLTypes';
import { EngravingDefaults, AnchorDefs } from '../lib/SMuFLTypes';
import { Options } from '../lib/Viewer';
import clsx from 'clsx';

type IScaledBBox = {
  W: number;
  N: number;
  E: number;
  S: number;
  w: number;
  h: number;
  x: number;
  y: number;
  sbl: number;
};

const initMouseHandlers = (
  elm: HTMLElement,
  scrollElm: HTMLElement,
  setSize: (val: number) => void,
) => {
  let isActive = false;
  let startPos: { clientX: number; clientY: number; scrollLeft: number; scrollTop: number };

  function _setIsActive(v: boolean) {
    isActive = v;
    elm.style.cursor = isActive ? 'move' : '';
  }

  _setIsActive(false);

  const handlers: { [key: string]: EventListenerOrEventListenerObject } = {
    wheel(ev: Event) {
      ev.preventDefault();
      const wev: WheelEvent = ev as WheelEvent;
      setSize(wev.deltaY > 0 ? -1 : 1);
    },
    mousedown(ev: Event) {
      const mev: MouseEvent = ev as MouseEvent;
      if (mev.button !== 0) {
        return;
      }
      _setIsActive(true);
      startPos = {
        clientX: mev.clientX,
        clientY: mev.clientY,
        scrollLeft: scrollElm.scrollLeft,
        scrollTop: scrollElm.scrollTop,
      };
    },
    mousemove(ev: Event) {
      const mev: MouseEvent = ev as MouseEvent;
      if (isActive) {
        scrollElm.scrollTop = startPos.scrollTop - (mev.clientY - startPos.clientY);
        scrollElm.scrollLeft = startPos.scrollLeft - (mev.clientX - startPos.clientX);
      }
    },
    mouseup(ev: Event) {
      const mev: MouseEvent = ev as MouseEvent;
      if (mev.button !== 0) {
        return;
      }
      _setIsActive(false);
    },
    mouseleave(/*ev*/) {
      _setIsActive(false);
    },
  };

  Object.keys(handlers).forEach((key) => {
    elm.addEventListener(key, handlers[key]);
  });

  return {
    off: () => {
      Object.keys(handlers).forEach((key) => {
        elm.removeEventListener(key, handlers[key]);
      });
    },
  };
};

function useCanvas(
  draw: (canvasElm: HTMLCanvasElement, ctx: RenderingContext) => void,
  value: IUCSelectOption | null,
  context = '2d',
) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(
    () => {
      if (!canvasRef.current) {
        return;
      }
      const ctx: RenderingContext | null = canvasRef.current.getContext(context);
      if (ctx) {
        draw(canvasRef.current, ctx);
      }
    },
    [draw, value, context], // fires on these props changed.
  );

  return canvasRef;
}

type IGlyphData = {
  codepoint: number;
  glyphname?: string;
  anchors?: GlyphsWithAnchorItem;
  uCodePoint?: UCodePoint;
};

function resolveGlyphdataByGlyphname(
  fontMetadata: FontMetadata,
  glyphname: string,
  ret: IGlyphData,
): IGlyphData {
  const { glyphsWithAnchors } = fontMetadata;
  if (glyphsWithAnchors) {
    ret.anchors = glyphsWithAnchors[glyphname];
  }
  return ret;
}

function resolveGlyphdata(
  sMuFLMetadata: Database,
  fontMetadata: FontMetadata,
  cpStr: string,
): IGlyphData {
  const ret: IGlyphData = {
    codepoint: IUCSelectOption_value2Number(cpStr),
  };
  ret.uCodePoint = UCodePoint.fromCpNumber(ret.codepoint);
  const searchOptions = {
    searchOptional: true,
  };
  ret.glyphname = sMuFLMetadata.uCodepoint2Glyphname(ret.uCodePoint, searchOptions);
  const { glyphname } = ret;
  if (glyphname) {
    resolveGlyphdataByGlyphname(fontMetadata, glyphname, ret);
  }

  return ret;
}

class GDCtx {
  ctx: CanvasRenderingContext2D;
  c: HTMLCanvasElement;
  fontSize: number;
  sbl: number;
  sMuFLMetadata: Database;
  fontMetadata: FontMetadata;
  cutOutOrigin_BBL: boolean;

  constructor(
    ctx: CanvasRenderingContext2D,
    sMuFLMetadata: Database,
    fontSize: number,
    cutOutOrigin_BBL: boolean,
  ) {
    this.ctx = ctx;
    this.c = ctx.canvas;
    this.fontSize = fontSize;
    this.sbl = fontSize * 0.25;
    this.sMuFLMetadata = sMuFLMetadata;
    this.fontMetadata = sMuFLMetadata?.fontMetadata() || {};
    this.cutOutOrigin_BBL = cutOutOrigin_BBL;
  }

  getFontSizeInfo(): IFontSizeInfo {
    return {
      fontSize: this.fontSize,
      sbl: this.sbl,
    };
  }

  aCsToSCsY(val: number): number {
    return GDCtx.anchorCsToScreenCsY(val, this.sbl);
  }

  aCsToSCsX(val: number): number {
    return GDCtx.anchorCsToScreenCsX(val, this.sbl);
  }

  static anchorCsToScreenCsY(val: number, sbl: number): number {
    return val * sbl * -1;
  }

  static anchorCsToScreenCsX(val: number, sbl: number): number {
    return val * sbl;
  }

  static anchorCsToScreenCs(
    scaledBBox: IScaledBBox,
    anchor: number[] | number,
    sbl: number,
    relativeToBBL = false,
  ) {
    const ret = Array.isArray(anchor)
      ? {
          x:
            (relativeToBBL ? scaledBBox.W : scaledBBox.x) +
            GDCtx.anchorCsToScreenCsX(Number(anchor[0]), sbl),
          y:
            (relativeToBBL ? scaledBBox.S : scaledBBox.y) +
            GDCtx.anchorCsToScreenCsY(Number(anchor[1]), sbl),
        }
      : {
          0: GDCtx.anchorCsToScreenCsY(Number(anchor), sbl),
        };
    return ret;
  }
  measureGlyph(glyphData: IGlyphData, x: number, y: number, sbl: number) {
    const glyphname = glyphData.glyphname;
    let scaledBBox;
    if (!glyphname) {
      return {};
    }
    const bbox = (this.fontMetadata?.glyphBBoxes || {})[glyphname];
    if (bbox) {
      if (bbox.bBoxNE && bbox.bBoxSW) {
        const E = GDCtx.anchorCsToScreenCsX(bbox.bBoxNE[0], sbl);
        const N = GDCtx.anchorCsToScreenCsY(bbox.bBoxNE[1], sbl);
        const W = GDCtx.anchorCsToScreenCsX(bbox.bBoxSW[0], sbl);
        const S = GDCtx.anchorCsToScreenCsY(bbox.bBoxSW[1], sbl);

        scaledBBox = {
          W: x + W,
          N: y + N,
          E: 0,
          S: 0,
          w: E - W,
          h: S - N,
          x: x,
          y: y,
          sbl: sbl,
        };
        scaledBBox.E = scaledBBox.W + scaledBBox.w;
        scaledBBox.S = scaledBBox.N + scaledBBox.h;
      }
    }
    return {
      bbox: bbox,
      scaledBBox: scaledBBox,
    };
  }

  getGlyphData(glyphname: string): IGlyphData {
    const { sMuFLMetadata, fontMetadata } = this;
    const option0 = { searchOptional: true };
    const uCp = sMuFLMetadata.glyphname2uCodepoint(glyphname, option0);
    let codepoint = NaN;
    let uCodePoint: UCodePoint | undefined;
    if (uCp) {
      uCodePoint = UCodePoint.fromUString(uCp);
      codepoint = uCodePoint.toNumber();
    }
    const ret = {
      uCodePoint,
      codepoint,
      glyphname,
    };
    resolveGlyphdataByGlyphname(fontMetadata, glyphname, ret);
    return ret;
  }
}

function _renderCross(gdc: GDCtx, x: number, y: number, crossSize = 10) {
  const { ctx } = gdc;
  ctx.fillRect(x - crossSize * 0.5, y - 0.5, crossSize, 1);
  ctx.fillRect(x - 0.5, y - crossSize * 0.5, 1, crossSize);
}

function _renderNumeral(gdc: GDCtx, x: number, y: number, sbl: number, bb: IBb) {
  const { ctx } = gdc;
  const glyphData = gdc.getGlyphData('tuplet5');
  const m = gdc.measureGlyph(glyphData, x, y, sbl);
  const { scaledBBox } = m;
  if (scaledBBox) {
    const ox = x - scaledBBox.W;
    const hw = scaledBBox.w * 0.5;
    const oy = 0; // no y offset for baseline.

    ctx.fillStyle = '#aaaaaacc';
    _renderGlyph(ctx, glyphData, x + ox - hw, y + oy, bb.fontSizeInfo.fontSize);

    // hori: center of bbox.
    // vert: baseline
    ctx.fillStyle = '#0000ffff';
    _renderCross(gdc, scaledBBox.W + ox - hw + hw, y + oy);
  }
}

function _renderSampleNoteheadAlignToOpticalCenter(
  gdc: GDCtx,
  ocX: number,
  ocY: number,
  ocScaledBBox: IScaledBBox,
  engravingDefaults: EngravingDefaults,
  bb: IBb,
) {
  const { ctx } = gdc;
  const glyphData = gdc.getGlyphData('noteheadWhole');
  const m = gdc.measureGlyph(glyphData, 0, 0, ocScaledBBox.sbl);

  if (!m.scaledBBox) {
    return;
  }

  ctx.save();
  ctx.fillStyle = '#aaaaaaaa';
  const nhY = ocScaledBBox.y - ocScaledBBox.sbl * 3.5;
  _renderGlyph(ctx, glyphData, ocX - m.scaledBBox.w * 0.5, nhY, bb.fontSizeInfo.fontSize);
  ctx.lineWidth = 1;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(ocX, nhY);
  ctx.lineTo(ocX, ocY);
  ctx.stroke();
  ctx.restore();
}

function _renderSampleNoteheadAlignToNoteheadOrigin(
  gdc: GDCtx,
  noX: number,
  noY: number,
  noScaledBBox: IScaledBBox,
  engravingDefaults: EngravingDefaults,
  bb: IBb,
) {
  const glyphData = gdc.getGlyphData('noteheadWhole');
  const { ctx } = gdc;
  // const m = _measureGlyph(glyphData, 0, 0, noScaledBBox.sbl);

  ctx.save();
  ctx.fillStyle = '#aaaaaaaa';
  const nhY = noScaledBBox.y - noScaledBBox.sbl * 2;
  _renderGlyph(ctx, glyphData, noX, nhY, bb.fontSizeInfo.fontSize);
  ctx.lineWidth = 1;
  ctx.strokeStyle = ctx.fillStyle;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(noX, nhY);
  ctx.lineTo(noX, noY);
  ctx.stroke();
  ctx.restore();
}

function _renderGlyph(
  ctx: CanvasRenderingContext2D,
  glyphData: IGlyphData,
  x: number,
  y: number,
  fontSize: string | number,
) {
  const { codepoint = NaN } = glyphData;
  if (isNaN(codepoint)) {
    return;
  }

  ctx.font = fontSize + 'px SMuFLFont';

  const str = String.fromCodePoint(codepoint);
  ctx.fillText(str, x, y);
}

const drawSL = (gdc: GDCtx, x: number, y: number, slValue: number) => {
  const { ctx, c, sbl, fontMetadata } = gdc;
  const { engravingDefaults = {} } = fontMetadata;
  let slY = y;
  switch (slValue) {
    case 1:
      break;
    case 2:
      slY += sbl * 0.5;
      break;
    case 0:
    default:
      return;
  }
  ctx.save();
  ctx.lineWidth = gdc.aCsToSCsX(engravingDefaults.staffLineThickness || 0);
  for (let yi = -10; yi < 11; yi++) {
    ctx.beginPath();
    ctx.moveTo(0, slY + sbl * yi);
    ctx.lineTo(c.width, slY + sbl * yi);

    ctx.strokeStyle = yi % 4 === 0 ? '#aaaaaa' : '#cccccc';
    ctx.stroke();
  }
  ctx.restore();
};

type IGDOptions = {
  slValue: number;
  showOrigin: boolean;
  showBBox: boolean;
  anchorInputValues: IAnchorInputValues;
};

type IFontSizeInfo = {
  fontSize: number;
  sbl: number;
};

type IBb = {
  scaledBBox: IScaledBBox;
  isIndeterminate: boolean;
  anchor: number[] | number;
  anchorDef: string[];
  glyphData: IGlyphData;
  vals: Dict<number | undefined> | undefined;
  fontSizeInfo: IFontSizeInfo;
};

const draw = (gdc: GDCtx, value: IUCSelectOption, options: IGDOptions) => {
  const { ctx, c, fontSize, fontMetadata } = gdc;
  if (!ctx) {
    return;
  }
  const x = c.width * 0.5;
  const y = c.height * 0.5;

  ctx.save();
  ctx.clearRect(0, 0, c.clientWidth, c.clientHeight);

  drawSL(gdc, x, y, options.slValue);
  if (!value) {
    return;
  }

  const glyphData = resolveGlyphdata(gdc.sMuFLMetadata, gdc.fontMetadata, value.value);

  _renderGlyph(ctx, glyphData, x, y, fontSize);

  const gm = gdc.measureGlyph(glyphData, x, y, gdc.sbl);
  const { scaledBBox, bbox } = gm;
  const { showOrigin, showBBox, anchorInputValues } = options;

  if (showOrigin) {
    ctx.fillStyle = 'orange';
    ctx.fillRect(x - 6, y - 0.5, 12, 1);
    ctx.fillRect(x - 0.5, y - 6, 1, 12);
  }

  if (showBBox && bbox && scaledBBox) {
    // fixme: resolve scaled BBox but where?
    ctx.strokeStyle = 'green';
    if (bbox.bBoxNE && bbox.bBoxSW) {
      ctx.strokeRect(scaledBBox.W, scaledBBox.N, scaledBBox.w, scaledBBox.h);
    }
  }

  const { anchors } = glyphData;
  if (anchors && scaledBBox) {
    const bbs: Dict<IBb> = {};
    for (const akey in anchors) {
      const anchorDef = AnchorDefs[akey];
      const anchorInputValue = anchorInputValues[akey];
      const triVal = anchorInputValue.triState?.value;
      if (triVal === TriValues.initial) {
        continue;
      }
      const isIndeterminate = triVal === TriValues.indeterminate;
      bbs[akey] = {
        scaledBBox: scaledBBox,
        isIndeterminate,
        anchor: anchors[akey],
        anchorDef: anchorDef,
        fontSizeInfo: gdc.getFontSizeInfo(),
        glyphData: glyphData,
        vals: undefined,
      };
      renderAnchor(
        gdc,
        akey,
        anchors[akey],
        anchorDef,
        scaledBBox,
        fontMetadata.engravingDefaults || {},
        isIndeterminate,
        bbs,
      );
    }
    // _renderGraceNoteSlash(bbs, engravingDefaults, sbl);
  }
  ctx.restore();
};

type IGlyphCanvasOptions = {
  value: IUCSelectOption | null;
  sMuFLMetadata: Database;
  options: Options;
};

const DEFAULTS = {
  size: 200,
};

const testTriState = (name: string, triState = false) => {
  const isIndeterminate =
    name.startsWith('stem') ||
    name.startsWith('splitStem') ||
    name.startsWith('opticalCenter') ||
    name.startsWith('noteheadOrigin') ||
    name.startsWith('graceNoteSlash');
  if (isIndeterminate || name.startsWith('repeatOffset') || name.startsWith('numeral')) {
    if (!triState) {
      throw Error(`${name}: ${triState}`);
    }
  }
};

const ANCHOR_INPUTS: {
  [index: string]: {
    title: string;
    triState?: boolean;
  };
} = {
  splitStemUpSW: {
    title:
      'The exact position at which the bottom left-hand (south-west) corner of an angled upward-pointing stem connecting the left-hand side of a notehead to a vertical stem to its right should start, relative to the glyph origin, expressed as Cartesian coordinates in staff spaces.',
    triState: true,
  },
  splitStemUpSE: {
    title:
      'The exact position at which the bottom right-hand (south-east) corner of an angled upward-pointing stem connecting the right-hand side of a notehead to a vertical stem to its left should start, relative to the glyph origin, expressed as Cartesian coordinates in staff spaces.',
    triState: true,
  },
  splitStemDownNW: {
    title:
      'The exact position at which the top left-hand (north-west) corner of an angled downward-pointing stem connecting the left-hand side of a notehead to a vertical stem to its right should start, relative to the glyph origin, expressed as Cartesian coordinates in staff spaces.',
    triState: true,
  },
  splitStemDownNE: {
    title:
      'The exact position at which the top right-hand (north-east) corner of an angled downward-pointing stem connecting the right-hand side of a notehead to a vertical stem to its left should start, relative to the glyph origin, expressed as Cartesian coordinates in staff spaces.',
    triState: true,
  },
  stemUpNW: {
    title:
      'The amount by which an up-stem should be lengthened from its nominal unmodified length in order to ensure a good connection with a flag, in spaces.11',
    triState: true,
  },
  stemDownNW: {
    title:
      'The exact position at which the top left-hand (north-west) corner of a downward-pointing stem rectangle should start, relative to the glyph origin, expressed as Cartesian coordinates in staff spaces.',
    triState: true,
  },
  stemUpSE: {
    title:
      'The exact position at which the bottom right-hand (south-east) corner of an upward-pointing stem rectangle should start, relative to the glyph origin, expressed as Cartesian coordinates in staff spaces.',
    triState: true,
  },
  stemDownSW: {
    title:
      'The amount by which a down-stem should be lengthened from its nominal unmodified length in order to ensure a good connection with a flag, in spaces.',
    triState: true,
  },
  nominalWidth: {
    title:
      'The width in staff spaces of a given glyph that should be used for e.g. positioning leger lines correctly.12',
  },
  numeralTop: {
    title:
      "The position in staff spaces that should be used to position numerals relative to clefs with ligated numbers where those numbers hang from the bottom of the clef, corresponding horizontally to the center of the numeral's bounding box.",
    triState: true,
  },
  numeralBottom: {
    title:
      "The position in staff spaces that should be used to position numerals relative to clefs with ligatured numbers where those numbers sit on the baseline or at the north-east corner of the G clef, corresponding horizontally to the center of the numeral's bounding box.",
    triState: true,
  },
  cutOutNW: {
    title:
      "The Cartesian coordinates in staff spaces of the bottom right corner of a nominal rectangle that intersects the top left corner of the glyph's bounding box.",
  },
  cutOutNE: {
    title:
      "The Cartesian coordinates in staff spaces of the bottom left corner of a nominal rectangle that intersects the top right corner of the glyph's bounding box. This rectangle, together with those in the other four corners of the glyph's bounding box, can be cut out to produce a more detailed bounding box (of abutting rectangles), useful for kerning or interlocking symbols such as accidentals.",
  },
  cutOutSW: {
    title:
      "The Cartesian coordinates in staff spaces of the top right corner of a nominal rectangle that intersects the bottom left corner of the glyph's bounding box.",
  },
  cutOutSE: {
    title:
      "The Cartesian coordinates in staff spaces of the top left corner of a nominal rectangle that intersects the bottom right corner of the glyph's bounding box.",
  },
  cutOutOrigin_BBL: {
    title: `cutOut anchor points are relative to the:
    unchecked: glyph origin.
    checked: bottom left-hand corner of the glyph bounding box(old spec)`,
  },
  graceNoteSlashSW: {
    title:
      'The Cartesian coordinates in staff spaces of the position at which the glyph graceNoteSlashStemUp should be positioned relative to the stem-up flag of an unbeamed grace note; alternatively, the bottom left corner of a diagonal line drawn instead of using the above glyph.',
    triState: true,
  },
  graceNoteSlashNE: {
    title:
      'The Cartesian coordinates in staff spaces of the top right corner of a diagonal line drawn instead of using the glyph graceNoteSlashStemUp for a stem-up flag of an unbeamed grace note.',
    triState: true,
  },
  graceNoteSlashNW: {
    title:
      'The Cartesian coordinates in staff spaces of the position at which the glyph graceNoteSlashStemDown should be positioned relative to the stem-down flag of an unbeamed grace note; alternatively, the top left corner of a diagonal line drawn instead of using the above glyph.',
    triState: true,
  },
  graceNoteSlashSE: {
    title:
      'The Cartesian coordinates in staff spaces of the bottom right corner of a diagonal line drawn instead of using the glyph graceNoteSlashStemDown for a stem-down flag of an unbeamed grace note.',
    triState: true,
  },
  repeatOffset: {
    title:
      'The Cartesian coordinates in staff spaces of the horizontal position at which a glyph repeats, i.e. the position at which the same glyph or another of the same group should be positioned to ensure correct tessellation. This is used for e.g. multi-segment lines and the component glyphs that make up trills and mordents.',
    triState: true,
  },
  noteheadOrigin: {
    title:
      'The Cartesian coordinates in staff spaces of the left-hand edge of a notehead with a non-zero left-hand side bearing (e.g. a double whole, or breve, notehead with two vertical lines at each side), to assist in the correct horizontal alignment of these noteheads with other noteheads with zero-width left-side bearings.',
    triState: true,
  },
  opticalCenter: {
    title:
      'The Cartesian coordinates in staff spaces of the optical center of the glyph, to assist in the correct horizontal alignment of the glyph relative to a notehead or stem. Currently recommended for use with glyphs in the Dynamics range.',
    triState: true,
  },
};

const ANCHOR_INPUTS_NAMES = Object.keys(ANCHOR_INPUTS);

const TriStateInput = ({
  name,
  title,
  mode,
  triVal,
  anchorInputValRef,
  triOnInput,
}: {
  name: string;
  title: string;
  mode: string;
  triVal: TriValues;
  anchorInputValRef: { triState: ITriState | undefined };
  triOnInput: () => void;
}): JSX.Element => {
  const triState = useTriState(triVal);
  anchorInputValRef.triState = triState;

  return (
    <FormControlLabel
      title={title}
      label={
        <Typography id={`non-linear-tri-state-${name}`} gutterBottom display="inline">
          {name}
        </Typography>
      }
      control={
        <TriStateCheckbox
          triValue={triState.value}
          triOnInput={(e: unknown, mode: string) => {
            triState.onInput(e, mode);
            triOnInput();
          }}
          mode={mode}
        />
      }
    />
  );
};

type IonInput = () => void;

const AnchorInputs = ({
  anchors = {},
  anchorInputsRef,
  cutOutOrigin_BBL,
}: {
  anchors: Dict<unknown>;
  anchorInputsRef: MutableRefObject<IAnchorInputsRef>;
  cutOutOrigin_BBL: boolean;
}): JSX.Element => {
  let hasCutOut = false;
  const anchorInputVal = anchorInputsRef.current;
  const aiVals = anchorInputVal.values;
  return (
    <>
      {ANCHOR_INPUTS_NAMES.map((name): JSX.Element => {
        let anchor = anchors[name];
        let triValue = TriValues.initial;
        if (name === 'cutOutOrigin_BBL') {
          anchor = hasCutOut ? {} : undefined;
          triValue = cutOutOrigin_BBL ? TriValues.checked : TriValues.initial;
        } else {
          if (!hasCutOut) {
            hasCutOut = !!(name.startsWith('cutOut') && anchor);
          }
        }
        const v = ANCHOR_INPUTS[name];
        const mode = v.triState ? 'tri' : 'check';

        testTriState(name, v.triState ?? false);
        aiVals[name] = { triState: undefined };
        return (
          <Box
            key={name}
            style={!anchor ? { display: 'none' } : {}}
            className={clsx('gcGlyphHintInputContainer', name)}
          >
            <TriStateInput
              name={name}
              title={v.title}
              mode={mode}
              triVal={triValue}
              triOnInput={anchorInputVal.onInput}
              anchorInputValRef={aiVals[name]}
            />
          </Box>
        );
      })}
    </>
  );
};

function _renderStemEx(
  gdc: GDCtx,
  nhScaledBBox: IScaledBBox,
  w: number,
  endY: number,
  bb: IBb,
  stemAnchorName: string | undefined,
) {
  const { ctx } = gdc;
  if (!bb.glyphData || !bb.glyphData.anchors || !stemAnchorName) {
    return 0;
  }
  const stemAnchor = bb.glyphData.anchors[stemAnchorName];
  const stemAttachmentPos = GDCtx.anchorCsToScreenCs(nhScaledBBox, stemAnchor, nhScaledBBox.sbl);

  if (stemAttachmentPos.x === undefined) {
    return 0;
  }

  const x = stemAttachmentPos.x - w * 0.5 * (stemAnchorName.endsWith('NW') ? -1 : 1);
  const y = stemAttachmentPos.y;
  ctx.save();
  ctx.lineWidth = Math.abs(w);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, endY);
  ctx.stroke();
  ctx.restore();

  return x;
}

const stemAnchorNamesByHV = {
  R_BTT: 'stemUpSE',
  R_TTB: 'stemDownNW',
  L_BTT: 'stemUpSE',
  L_TTB: 'stemDownNW',
};

function _renderAllteredUnison(
  gdc: GDCtx,
  halign: string,
  vdir: string,
  w: number,
  nhScaledBBox: {
    W?: number;
    N?: number;
    E?: number;
    S?: number;
    w: any;
    h?: number;
    x: any;
    y: any;
    sbl: any;
  },
  bb: IBb,
) {
  const { ctx } = gdc;
  ctx.save();
  ctx.strokeStyle = '#aaaaaa';
  ctx.fillStyle = '#aaaaaa';

  const angd = gdc.getGlyphData('accidentalNatural');
  const anm = gdc.measureGlyph(angd, 0, 0, nhScaledBBox.sbl);

  const afgd = gdc.getGlyphData('accidentalFlat');
  const afm = gdc.measureGlyph(afgd, 0, 0, nhScaledBBox.sbl);

  const paddingX = nhScaledBBox.sbl * 0.4;
  const accidentalPaddingX = nhScaledBBox.sbl * 0.15;

  let nh1X = nhScaledBBox.x;

  if (halign === 'R') {
    // n ap [nh1 p b ap] nh0
    nh1X -= afm.scaledBBox?.w + nhScaledBBox.w + (paddingX + accidentalPaddingX);
  } else {
    // b ap [nh0 p n ap nh1]
    nh1X += nhScaledBBox.w + anm.scaledBBox?.w + (paddingX + accidentalPaddingX);
  }

  _renderGlyph(ctx, bb.glyphData, nh1X, nhScaledBBox.y, bb.fontSizeInfo.fontSize);
  const m = gdc.measureGlyph(bb.glyphData, nh1X, nhScaledBBox.y, nhScaledBBox.sbl);

  if (!m.scaledBBox || !anm.scaledBBox || !afm.scaledBBox) {
    return {
      nhMetrics: m,
    };
  }
  _renderGlyph(
    ctx,
    angd,
    m.scaledBBox.x - anm.scaledBBox.w - accidentalPaddingX,
    m.scaledBBox.y,
    bb.fontSizeInfo.fontSize,
  );

  _renderGlyph(
    ctx,
    afgd,
    nhScaledBBox.x - afm.scaledBBox.w - accidentalPaddingX,
    nhScaledBBox.y,
    bb.fontSizeInfo.fontSize,
  );

  // console.log(vdir, halign, w);
  const stemAnchorName =
    stemAnchorNamesByHV[`${halign}_${vdir}` as keyof typeof stemAnchorNamesByHV];
  const stemLen = m.scaledBBox.sbl * 4 * (vdir === 'BTT' ? 1 : -1);
  const stemEndY = m.scaledBBox.y - stemLen;
  const stemX = _renderStemEx(gdc, m.scaledBBox, Math.abs(w), stemEndY, bb, stemAnchorName);

  ctx.restore();

  return {
    nhMetrics: m,
    stemAttachmentY: stemEndY + stemLen / 4,
    stemAttachmentX: stemX,
  };
}

function _renderStem(
  gdc: GDCtx,
  x: number,
  y: number,
  h: number,
  halign: string,
  vdir: string,
  sbl: number,
  engravingDefaults: EngravingDefaults,
  isSplitStem: boolean,
  nhScaledBBox: IScaledBBox,
  akey: string,
  bb: IBb,
) {
  const { ctx } = gdc;
  let w = GDCtx.anchorCsToScreenCsX(engravingDefaults.stemThickness || 0, sbl);
  let rad = 0;

  if (isSplitStem) {
    const auInfo = _renderAllteredUnison(gdc, halign, vdir, w, nhScaledBBox, bb);
    // https://steinberg.help/dorico/v2/en/_shared_picts/picts/dorico/notation_reference/accidentals_altered_unison_tree.png
    // https://www.steinberg.net/forums/download/file.php?id=16781
    if (auInfo.stemAttachmentX !== undefined && auInfo.stemAttachmentY !== undefined) {
      const dw = auInfo.stemAttachmentX - x - w * 0.5 * (halign === 'L' ? 1 : -1);
      const dh = auInfo.stemAttachmentY - y;
      rad = Math.atan2(dw, dh) * -1;
      h = Math.sqrt(dw * dw + dh * dh);
      if ((vdir === 'BTT' && halign === 'L') || (vdir === 'TTB' && halign === 'R')) {
        w *= -1;
      }
    }
  } else {
    if (vdir === 'BTT') {
      h *= -1;
    }
    if (halign === 'R') {
      w *= -1;
    }
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rad);
  ctx.translate(-x, -y);
  ctx.fillStyle = '#aaaaaacc';
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
  // const cm = ctx.getTransform();
  ctx.restore();
}

const renderAnchor = (
  gdc: GDCtx,
  akey: string,
  anchor: number | number[],
  types: string[] = [],
  scaledBBox: IScaledBBox,
  engravingDefaults: EngravingDefaults,
  isIndeterminate: boolean,
  bbs: Dict<IBb>,
) => {
  const { ctx, cutOutOrigin_BBL = false } = gdc;
  if (!anchor) {
    console.warn('fixme !anchor');
    return;
  }
  let x;
  let y;
  let w;
  let h;
  const sbl = scaledBBox.sbl;
  const isCutOut = akey.startsWith('cutOut');
  const vals = GDCtx.anchorCsToScreenCs(scaledBBox, anchor, sbl, isCutOut && cutOutOrigin_BBL);

  // eslint-disable-next-line no-unused-vars
  let halign = 'L';
  let vdir = 'TTB';
  types.forEach(function (type) {
    if (vals.y === undefined || vals.x === undefined) {
      return;
    }
    switch (type) {
      case 'S':
        y = vals.y;
        h = scaledBBox.S - y;
        vdir = 'BTT';
        break;
      case 'N':
        h = vals.y - scaledBBox.N;
        y = scaledBBox.N;
        break;
      case 'E':
        w = scaledBBox.E - vals.x;
        x = vals.x;
        halign = 'R';
        break;
      case 'W':
        w = vals.x - scaledBBox.W;
        x = scaledBBox.W;
        break;
      case 'Width':
      case 'Top':
      case 'Bottom':
      case 'Offset':
      case 'Origin':
      case 'Center':
        break;
      default:
        console.warn('FIXME: ' + type);
        break;
    }
  });
  bbs[akey].vals = vals;
  ctx.save();
  if (isCutOut) {
    if (cutOutOrigin_BBL) {
      ctx.fillStyle = '#ccccd5cc';
    } else {
      ctx.fillStyle = '#cccccccc';
    }
    if (x !== undefined && y !== undefined && w !== undefined && h !== undefined) {
      ctx.fillRect(x, y, w, h);
    }
    ctx.fillStyle = '#44aaffcc';
    // _renderCross(vals.x, vals.y);
  } else if (
    akey.startsWith('splitStem') ||
    akey.startsWith('stem') ||
    akey.startsWith('numeral') ||
    akey.startsWith('graceNoteSlash') ||
    akey === 'repeatOffset' ||
    akey === 'noteheadOrigin' ||
    akey === 'opticalCenter'
  ) {
    x = vals.x || 0;
    y = vals.y || 0;

    if (!isIndeterminate) {
      if (akey.startsWith('splitStem') || akey.startsWith('stem')) {
        _renderStem(
          gdc,
          x,
          y,
          Math.max(scaledBBox.h, GDCtx.anchorCsToScreenCsX(3.5, sbl)),
          halign,
          vdir,
          sbl,
          engravingDefaults,
          akey.startsWith('splitStem'),
          scaledBBox,
          akey,
          bbs[akey],
        );
      } else if (akey.startsWith('numeral')) {
        _renderNumeral(gdc, x, y, sbl, bbs[akey]);
      } else if (akey === 'opticalCenter') {
        _renderSampleNoteheadAlignToOpticalCenter(
          gdc,
          x,
          y,
          scaledBBox,
          engravingDefaults,
          bbs[akey],
        );
      } else if (akey === 'noteheadOrigin') {
        _renderSampleNoteheadAlignToNoteheadOrigin(
          gdc,
          x,
          y,
          scaledBBox,
          engravingDefaults,
          bbs[akey],
        );
      }
    }

    ctx.fillStyle = '#ff4444cc';
    if (akey.startsWith('stem')) {
      ctx.fillStyle = '#4444ffcc';
    }
    _renderCross(gdc, x, y);
  }
  ctx.restore();
};

type IAnchorInputValues = Dict<{ triState: ITriState | undefined }>;
type IAnchorInputsRef = {
  onInput: () => void;
  values: IAnchorInputValues;
  tick: number;
};

export default function GlyphCanvas(props: IGlyphCanvasOptions): JSX.Element {
  const { value, sMuFLMetadata, options } = props;
  console.log(value);

  const [tick, setTick] = React.useState<number>(0);
  const slTriState = useTriState(0);

  const anchorInputsRef = React.useRef<IAnchorInputsRef>({
    onInput: () => {
      setTick((v) => {
        return v + 1;
      });
    },
    values: {},
    tick: 0,
  });
  const [showOrigin, setShowOrigin] = useState<boolean>(true);
  const [showBBox, setShowBBox] = useState<boolean>(true);

  const [size, setSize] = React.useState<number>(DEFAULTS.size);

  /*
  function _anchorCsToScreenCs(scaledBBox, anchor, sbl, relativeToBBL) {
    return {
      x: (relativeToBBL ? scaledBBox.W : scaledBBox.x) + anchorCsToScreenCsX(Number(anchor[0]), sbl),
      y: (relativeToBBL ? scaledBBox.S : scaledBBox.y) + anchorCsToScreenCsY(Number(anchor[1]), sbl)
    };
  }
  */

  const { cutOutOrigin_BBL } = options.settings;

  const drawGlyph = useCallback(
    (c: HTMLCanvasElement, ctx: RenderingContext | null) => {
      const { current } = anchorInputsRef;
      current.tick = tick;
      if (value) {
        const gdc = new GDCtx(
          ctx as CanvasRenderingContext2D,
          sMuFLMetadata,
          size,
          cutOutOrigin_BBL ?? false,
        );
        draw(gdc, value, {
          slValue: slTriState.value,
          showOrigin,
          showBBox,
          anchorInputValues: current.values,
        });
      }
    },
    [value, sMuFLMetadata, size, cutOutOrigin_BBL, slTriState.value, showOrigin, showBBox, tick],
  );
  const sizeRef = React.useRef(size);
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  const canvasRef = useCanvas(drawGlyph, value);
  const gcBoxRef = React.useRef<HTMLDivElement>(null);

  const sizeLabelFormat = useCallback((val) => val, []);
  const handleSizeChange = useCallback((e, val) => setSize(val), []);
  const SLIDER_RANGE = {
    min: 20,
    max: 1000,
  };

  const resetScPos = useCallback(() => {
    if (!gcBoxRef.current) {
      return;
    }
    const gcBoxElm = gcBoxRef.current;
    gcBoxElm.scrollTop = gcBoxElm.scrollHeight * 0.5 - gcBoxElm.clientHeight * 0.5;
    gcBoxElm.scrollLeft = gcBoxElm.scrollWidth * 0.5 - gcBoxElm.clientWidth * 0.5;
  }, [gcBoxRef]);

  const updateSize = useCallback(
    (v) => {
      setSize(Math.min(SLIDER_RANGE.max, Math.max(SLIDER_RANGE.min, v * 30 + sizeRef.current)));
    },
    [SLIDER_RANGE.max, SLIDER_RANGE.min, sizeRef],
  );

  useEffect(() => {
    if (!gcBoxRef.current) {
      return;
    }
    const gcBoxElm = gcBoxRef.current;

    const mhInfos = initMouseHandlers(gcBoxElm, gcBoxElm, updateSize);
    resetScPos();
    return () => {
      mhInfos.off();
    };
  }, [SLIDER_RANGE.max, SLIDER_RANGE.min, gcBoxRef, resetScPos, updateSize]);

  const fontMetadata = sMuFLMetadata?.fontMetadata();
  const glyphBBoxes = fontMetadata?.glyphBBoxes || {};
  const glyphBBox = glyphBBoxes[value?.glyphname || ''];
  const glyphsWithAnchors = fontMetadata?.glyphsWithAnchors || {};
  const glyphWithAnchors = glyphsWithAnchors[value?.glyphname || ''];

  return (
    <>
      <div className="gcBox" ref={gcBoxRef}>
        <canvas ref={canvasRef} width="800" height="600" />
      </div>
      <Box className="GCOptionBox">
        <FormControlLabel
          control={
            <Checkbox
              checked={showOrigin}
              onChange={(e) => {
                setShowOrigin(e.target.checked);
              }}
            />
          }
          label={
            <Typography id="non-linear-showOrigin" gutterBottom display="inline">
              origin
            </Typography>
          }
        />
      </Box>
      <Box className="GCOptionBox">
        <FormControlLabel
          title="staff lines: All glyphs should be drawn at a scale consistent with the key measurement that one staff space = 0.25 em"
          label={
            <Typography id="non-linear-tri-state-sl" gutterBottom display="inline">
              sl
            </Typography>
          }
          control={<TriStateCheckbox triValue={slTriState.value} triOnInput={slTriState.onInput} />}
        />
      </Box>
      <Box className="GCOptionBox">
        <FormControlLabel
          control={
            <Checkbox
              checked={showBBox}
              onChange={(e) => {
                setShowBBox(e.target.checked);
              }}
            />
          }
          label={
            <Typography id="non-linear-showBBox" gutterBottom display="inline">
              bbox: {JSON.stringify(glyphBBox)}
            </Typography>
          }
        />
      </Box>
      <Box className="gcSizeBox GCOptionBox">
        <Typography id="non-linear-slider-glyph-size" gutterBottom>
          size: {size}
        </Typography>
        <Slider
          value={size}
          min={SLIDER_RANGE.min}
          step={1}
          max={SLIDER_RANGE.max}
          // scale={calculateValue}
          getAriaValueText={sizeLabelFormat}
          valueLabelFormat={sizeLabelFormat}
          onChange={handleSizeChange}
          valueLabelDisplay="auto"
          aria-labelledby="non-linear-slider-glyph-size"
        />
        <Button
          title="reset font size"
          onClick={() => {
            setSize(DEFAULTS.size);
          }}
        >
          s
        </Button>
        <Button
          title="reset scroll position"
          onClick={() => {
            resetScPos();
          }}
        >
          p
        </Button>
      </Box>
      <Box id="smuflGlyphHints">
        <AnchorInputs
          anchors={glyphWithAnchors}
          anchorInputsRef={anchorInputsRef}
          cutOutOrigin_BBL={cutOutOrigin_BBL ?? false}
        />
      </Box>
    </>
  );
}
