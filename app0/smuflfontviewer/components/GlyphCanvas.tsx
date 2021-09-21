/* eslint-disable no-use-before-define */
import React, { useCallback, useEffect, useState } from 'react';
import { IUCSelectOption, IUCSelectOption_value2Number } from './UCodepointSelect';
import { Typography, Box, Slider, Checkbox, FormControlLabel } from '@material-ui/core';
import TriStateCheckbox, { useTriState } from '../lib/TriStateCheckbox';
import { Database, FontMetadata } from '../lib/SMuFLMetadata';
import { UCodePoint } from '../lib/UCodePoint';
import { glyphBBoxItem, GlyphsWithAnchorItem } from '../lib/SMuFLTypes';

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

  const [size, setSize] = React.useState<number>(40);

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
        <FormControlLabel
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
      </Box>
    </>
  );
}
