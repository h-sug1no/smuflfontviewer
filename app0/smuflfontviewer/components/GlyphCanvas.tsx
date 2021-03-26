/* eslint-disable no-use-before-define */
import React, { useCallback, useEffect } from 'react';
import { IUCSelectOption } from './UCodepointSelect';

function useCanvas(draw: any, value: IUCSelectOption, context = '2d') {
  const canvasRef = React.useRef<any>(null);

  React.useEffect(
    () => {
      const ctx: CanvasRenderingContext2D | null = canvasRef.current.getContext(context);
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
  _renderGlyph(glyphData, 100, 100, 100, ctx);
};

export default function GlyphCanvas(props: any): JSX.Element {
  const { value } = props;
  console.log(value);
  const drawGlyph = useCallback(
    (c: HTMLCanvasElement, ctx: CanvasRenderingContext2D | null) => {
      draw(c, ctx, value);
    },
    [value],
  );
  const canvasRef = useCanvas(drawGlyph, value);

  const [tick] = React.useState<number>(0);
  const refTick = React.useRef<number>();

  useEffect(() => {
    refTick.current = tick;
  });

  return (
    <>
      <canvas ref={canvasRef} width="800" height="600" />
    </>
  );
}
