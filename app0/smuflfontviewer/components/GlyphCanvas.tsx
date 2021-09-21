/* eslint-disable no-use-before-define */
import React, { useCallback, useEffect, useState } from 'react';
import { IUCSelectOption, IUCSelectOption_value2Number } from './UCodepointSelect';
import {
  Typography,
  Box,
  Slider,
  Checkbox,
  FormControlLabel,
  Button,
  Tooltip,
} from '@material-ui/core';
import TriStateCheckbox, { useTriState } from '../lib/TriStateCheckbox';
import { Database, FontMetadata } from '../lib/SMuFLMetadata';
import { UCodePoint } from '../lib/UCodePoint';
import { GlyphsWithAnchorItem } from '../lib/SMuFLTypes';

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
  constructor(ctx: CanvasRenderingContext2D, sMuFLMetadata: Database, fontSize: number) {
    this.ctx = ctx;
    this.c = ctx.canvas;
    this.fontSize = fontSize;
    this.sbl = fontSize * 0.25;
    this.sMuFLMetadata = sMuFLMetadata;
    this.fontMetadata = sMuFLMetadata?.fontMetadata() || {};
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

function _renderGlyph(
  glyphData: IGlyphData,
  x: number,
  y: number,
  fontSize: string | number,
  ctx: CanvasRenderingContext2D,
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
};

const draw = (gdc: GDCtx, value: IUCSelectOption, options: IGDOptions) => {
  const { ctx, c, fontSize } = gdc;
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

  _renderGlyph(glyphData, x, y, fontSize, ctx);

  const gm = gdc.measureGlyph(glyphData, x, y, gdc.sbl);
  const { scaledBBox, bbox } = gm;
  const { showOrigin, showBBox } = options;

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

  ctx.restore();
};

type IGlyphCanvasOptions = {
  value: IUCSelectOption | null;
  sMuFLMetadata: Database;
};

const DEFAULTS = {
  size: 200,
};
export default function GlyphCanvas(props: IGlyphCanvasOptions): JSX.Element {
  const { value, sMuFLMetadata } = props;
  console.log(value);

  const [tick] = React.useState<number>(0);
  const refTick = React.useRef<number>();
  const slTriState = useTriState(0);
  const [showOrigin, setShowOrigin] = useState<boolean>(true);
  const [showBBox, setShowBBox] = useState<boolean>(true);

  useEffect(() => {
    refTick.current = tick;
  });

  const [size, setSize] = React.useState<number>(DEFAULTS.size);

  /*
  function _anchorCsToScreenCs(scaledBBox, anchor, sbl, relativeToBBL) {
    return {
      x: (relativeToBBL ? scaledBBox.W : scaledBBox.x) + anchorCsToScreenCsX(Number(anchor[0]), sbl),
      y: (relativeToBBL ? scaledBBox.S : scaledBBox.y) + anchorCsToScreenCsY(Number(anchor[1]), sbl)
    };
  }
  */

  const drawGlyph = useCallback(
    (c: HTMLCanvasElement, ctx: RenderingContext | null) => {
      if (value) {
        const gdc = new GDCtx(ctx as CanvasRenderingContext2D, sMuFLMetadata, size);
        draw(gdc, value, {
          slValue: slTriState.value,
          showOrigin,
          showBBox,
        });
      }
    },
    [value, sMuFLMetadata, size, slTriState.value, showOrigin, showBBox],
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

  const glyphBBoxes = sMuFLMetadata?.fontMetadata()?.glyphBBoxes || {};
  const glyphBBox = glyphBBoxes[value?.glyphname || ''];

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
        <Tooltip title="staff lines: All glyphs should be drawn at a scale consistent with the key measurement that one staff space = 0.25 em">
          <FormControlLabel
            label={
              <Typography id="non-linear-tri-state-sl" gutterBottom display="inline">
                sl
              </Typography>
            }
            control={
              <TriStateCheckbox triValue={slTriState.value} triOnInput={slTriState.onInput} />
            }
          />
        </Tooltip>
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
        <Tooltip title="reset font size">
          <Button
            onClick={() => {
              setSize(DEFAULTS.size);
            }}
          >
            s
          </Button>
        </Tooltip>
        <Tooltip title="reset scroll position">
          <Button
            onClick={() => {
              resetScPos();
            }}
          >
            p
          </Button>
        </Tooltip>
      </Box>
      <Box id="smuflGlyphHints">
        <label title="The exact position at which the bottom left-hand (south-west) corner of an angled upward-pointing stem connecting the left-hand side of a notehead to a vertical stem to its right should start, relative to the glyph origin, expressed as Cartesian coordinates in staff spaces.">
          <input type="checkbox" />
          splitStemUpSW<span className="val"></span>
        </label>
        <label title="The exact position at which the bottom right-hand (south-east) corner of an angled upward-pointing stem connecting the right-hand side of a notehead to a vertical stem to its left should start, relative to the glyph origin, expressed as Cartesian coordinates in staff spaces.">
          <input type="checkbox" />
          splitStemUpSE<span className="val"></span>
        </label>
        <label title="The exact position at which the top left-hand (north-west) corner of an angled downward-pointing stem connecting the left-hand side of a notehead to a vertical stem to its right should start, relative to the glyph origin, expressed as Cartesian coordinates in staff spaces.">
          <input type="checkbox" />
          splitStemDownNW<span className="val"></span>
        </label>
        <label title="The exact position at which the top right-hand (north-east) corner of an angled downward-pointing stem connecting the right-hand side of a notehead to a vertical stem to its left should start, relative to the glyph origin, expressed as Cartesian coordinates in staff spaces.">
          <input type="checkbox" />
          splitStemDownNE<span className="val"></span>
        </label>
        <label title="The amount by which an up-stem should be lengthened from its nominal unmodified length in order to ensure a good connection with a flag, in spaces.11">
          <input type="checkbox" />
          stemUpNW<span className="val"></span>
        </label>
        <label title="The exact position at which the top left-hand (north-west) corner of a downward-pointing stem rectangle should start, relative to the glyph origin, expressed as Cartesian coordinates in staff spaces.">
          <input type="checkbox" />
          stemDownNW<span className="val"></span>
        </label>
        <label title="The exact position at which the bottom right-hand (south-east) corner of an upward-pointing stem rectangle should start, relative to the glyph origin, expressed as Cartesian coordinates in staff spaces.">
          <input type="checkbox" />
          stemUpSE<span className="val"></span>
        </label>
        <label title="The amount by which a down-stem should be lengthened from its nominal unmodified length in order to ensure a good connection with a flag, in spaces.">
          <input type="checkbox" />
          stemDownSW<span className="val"></span>
        </label>
        <label title="The width in staff spaces of a given glyph that should be used for e.g. positioning leger lines correctly.12">
          <input type="checkbox" />
          nominalWidth<span className="val"></span>
        </label>
        <label title="The position in staff spaces that should be used to position numerals relative to clefs with ligated numbers where those numbers hang from the bottom of the clef, corresponding horizontally to the center of the numeral's bounding box.">
          <input type="checkbox" />
          numeralTop<span className="val"></span>
        </label>
        <label title="The position in staff spaces that should be used to position numerals relative to clefs with ligatured numbers where those numbers sit on the baseline or at the north-east corner of the G clef, corresponding horizontally to the center of the numeral's bounding box.">
          <input type="checkbox" />
          numeralBottom<span className="val"></span>
        </label>
        <label title="The Cartesian coordinates in staff spaces of the bottom right corner of a nominal rectangle that intersects the top left corner of the glyph's bounding box.">
          <input type="checkbox" />
          cutOutNW<span className="val"></span>
        </label>
        <label title="The Cartesian coordinates in staff spaces of the bottom left corner of a nominal rectangle that intersects the top right corner of the glyph's bounding box. This rectangle, together with those in the other four corners of the glyph's bounding box, can be cut out to produce a more detailed bounding box (of abutting rectangles), useful for kerning or interlocking symbols such as accidentals.">
          <input type="checkbox" />
          cutOutNE<span className="val"></span>
        </label>
        <label title="The Cartesian coordinates in staff spaces of the top right corner of a nominal rectangle that intersects the bottom left corner of the glyph's bounding box.">
          <input type="checkbox" />
          cutOutSW<span className="val"></span>
        </label>
        <label title="The Cartesian coordinates in staff spaces of the top left corner of a nominal rectangle that intersects the bottom right corner of the glyph's bounding box.">
          <input type="checkbox" />
          cutOutSE<span className="val"></span>
        </label>
        <label
          title="cutOut anchor points are relative to the:
        unchecked: glyph origin.
        checked: bottom left-hand corner of the glyph bounding box(old spec).
        "
        >
          <input type="checkbox" />
          cutOutOrigin_BBL<span className="val"></span>
        </label>
        <label title="The Cartesian coordinates in staff spaces of the position at which the glyph graceNoteSlashStemUp should be positioned relative to the stem-up flag of an unbeamed grace note; alternatively, the bottom left corner of a diagonal line drawn instead of using the above glyph.">
          <input type="checkbox" />
          graceNoteSlashSW<span className="val"></span>
        </label>
        <label title="The Cartesian coordinates in staff spaces of the top right corner of a diagonal line drawn instead of using the glyph graceNoteSlashStemUp for a stem-up flag of an unbeamed grace note.">
          <input type="checkbox" />
          graceNoteSlashNE<span className="val"></span>
        </label>
        <label title="The Cartesian coordinates in staff spaces of the position at which the glyph graceNoteSlashStemDown should be positioned relative to the stem-down flag of an unbeamed grace note; alternatively, the top left corner of a diagonal line drawn instead of using the above glyph.">
          <input type="checkbox" />
          graceNoteSlashNW<span className="val"></span>
        </label>
        <label title="The Cartesian coordinates in staff spaces of the bottom right corner of a diagonal line drawn instead of using the glyph graceNoteSlashStemDown for a stem-down flag of an unbeamed grace note.">
          <input type="checkbox" />
          graceNoteSlashSE<span className="val"></span>
        </label>
        <label title="The Cartesian coordinates in staff spaces of the horizontal position at which a glyph repeats, i.e. the position at which the same glyph or another of the same group should be positioned to ensure correct tessellation. This is used for e.g. multi-segment lines and the component glyphs that make up trills and mordents.">
          <input type="checkbox" />
          repeatOffset<span className="val"></span>
        </label>
        <label title="The Cartesian coordinates in staff spaces of the left-hand edge of a notehead with a non-zero left-hand side bearing (e.g. a double whole, or breve, notehead with two vertical lines at each side), to assist in the correct horizontal alignment of these noteheads with other noteheads with zero-width left-side bearings.">
          <input type="checkbox" />
          noteheadOrigin<span className="val"></span>
        </label>
        <label title="The Cartesian coordinates in staff spaces of the optical center of the glyph, to assist in the correct horizontal alignment of the glyph relative to a notehead or stem. Currently recommended for use with glyphs in the Dynamics range.">
          <input type="checkbox" />
          opticalCenter<span className="val"></span>
        </label>
      </Box>
    </>
  );
}
