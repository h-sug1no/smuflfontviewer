/* eslint-disable no-use-before-define */
import React, { useCallback, useEffect } from 'react';
import { IUCSelectOption } from './UCodepointSelect';
import { Typography, Box, Slider } from '@material-ui/core';

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

function useCanvas(draw: any, value: IUCSelectOption, context = '2d') {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(
    () => {
      if (!canvasRef.current) {
        return;
      }
      const ctx: RenderingContext | null = canvasRef.current.getContext(context);
      draw(canvasRef.current, ctx);
    },
    [draw, value, context], // fires on these props changed.
  );

  return canvasRef;
}

function resolveGlyphdata(cpStr: string) {
  return {
    codepoint: parseInt(cpStr, 16),
  };
}

function _renderGlyph(
  glyphData: any,
  x: number,
  y: number,
  fontSize: string | number,
  tctx: CanvasRenderingContext2D,
) {
  tctx.font = fontSize + 'px SMuFLFont';
  const str = String.fromCodePoint(glyphData.codepoint);
  tctx.fillText(str, x, y);
}

const draw = (
  c: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D | null,
  value: IUCSelectOption,
  size: number,
) => {
  if (!ctx) {
    return;
  }
  const x = c.width * 0.5;
  const y = c.height * 0.5;

  ctx.clearRect(0, 0, c.clientWidth, c.clientHeight);
  if (!value) {
    return;
  }

  const glyphData = resolveGlyphdata(value.value);
  _renderGlyph(glyphData, 100, 100, size, ctx);
};

export default function GlyphCanvas(props: any): JSX.Element {
  const { value } = props;
  console.log(value);

  const [tick] = React.useState<number>(0);
  const refTick = React.useRef<number>();

  useEffect(() => {
    refTick.current = tick;
  });

  const [size, setSize] = React.useState<number>(40);
  const drawGlyph = useCallback(
    (c: HTMLCanvasElement, ctx: CanvasRenderingContext2D | null) => {
      draw(c, ctx, value, size);
    },
    [value, size],
  );
  const canvasRef = useCanvas(drawGlyph, value);
  const gcBoxRef = React.useRef<HTMLDivElement>(null);

  const sizeLabelFormat = useCallback((val) => val, []);
  const handleSizeChange = useCallback((e, val) => setSize(val), []);
  const SLIDER_RANGE = {
    min: 20,
    max: 1000,
  };

  useEffect(() => {
    if (!gcBoxRef.current) {
      return;
    }
    const gcBoxElm = gcBoxRef.current;

    const mhInfos = initMouseHandlers(gcBoxElm, gcBoxElm, (v) =>
      setSize(Math.min(SLIDER_RANGE.max, Math.max(SLIDER_RANGE.min, v * 30 + size))),
    );

    return () => {
      mhInfos.off();
    };
  }, [SLIDER_RANGE.max, SLIDER_RANGE.min, gcBoxRef, size]);

  return (
    <>
      <div className="gcBox" ref={gcBoxRef}>
        <canvas ref={canvasRef} width="800" height="600" />
      </div>
      <Box className="gcSizeBox">
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
