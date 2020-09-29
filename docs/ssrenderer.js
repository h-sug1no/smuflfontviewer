/**
 * Copyright (c) 2020 h-sug1no
 */

/* eslint-disable quotes */
/* eslint-disable no-console */
// eslint-disable-next-line no-unused-vars
class SSRenderer {

  constructor() {
    // eslint-disable-next-line no-undef
  }

  init(options) {
    this.sMuFLMetadata = options.sMuFLMetadata;
    this.engravingDefaults = options.sMuFLMetadata.fontMetadata().engravingDefaults;
  }

  /*
    "staffLineThickness" 	The thickness of each staff line
    "stemThickness" 	The thickness of a stem
    "beamThickness" 	The thickness of a beam

    "beamSpacing" 	The distance between the inner edge of the primary and outer
       edge of subsequent secondary beams
    
    "legerLineThickness" 	The thickness of a leger line (normally somewhat thicker
       than a staff line)
    
    "legerLineExtension" 	The amount by which a leger line should extend either
      side of a notehead, scaled proportionally with the notehead's size, e.g.
      when scaled down as a grace note
    
    "slurEndpointThickness" 	The thickness of the end of a slur
    "slurMidpointThickness" 	The thickness of the mid-point of a slur (i.e. its thickest point)
    "tieEndpointThickness" 	The thickness of the end of a tie
    "tieMidpointThickness" 	The thickness of the mid-point of a tie
    
    "thinBarlineThickness" 	The thickness of a thin barline, e.g. a normal barline, or each of
      the lines of a double barline
    
    "thickBarlineThickness" 	The thickness of a thick barline, e.g. in a final barline or a
      repeat barline
    
    "dashedBarlineThickness" 	The thickness of a dashed barline
    "dashedBarlineDashLength" 	The length of the dashes to be used in a dashed barline
    "dashedBarlineGapLength" 	The length of the gap between dashes in a dashed barline
    
    "barlineSeparation" 	The default distance between multiple barlines when locked together,
      e.g. between two thin barlines making a double barline, or a thin and a thick barline
      making a final barline, measured from the right-hand edge of the left barline to the
      left-hand edge of the right barline.
    
    "repeatBarlineDotSeparation" 	The default horizontal distance between the dots and the inner
      barline of a repeat barline, measured from the edge of the dots to the edge of the barline.
    
    "bracketThickness" 	The thickness of the vertical line of a bracket grouping staves together
    
    "subBracketThickness" 	The thickness of the vertical line of a sub-bracket grouping staves
      belonging to the same instrument together
    
    "hairpinThickness" 	The thickness of a crescendo/diminuendo hairpin
    "octaveLineThickness" 	The thickness of the dashed line used for an octave line
    "pedalLineThickness" 	The thickness of the line used for piano pedaling
    "repeatEndingLineThickness" 	The thickness of the brackets drawn to indicate repeat endings
    "arrowShaftThickness" 	The thickness of the line used for the shaft of an arrow
    "lyricLineThickness" 	The thickness of the lyric extension line to indicate a melisma in vocal music
    "textEnclosureThickness" 	The thickness of a box drawn around text instructions (e.g. rehearsal marks)
    "tupletBracketThickness" 	The thickness of the brackets drawn either side of tuplet numbers
  */

  draw(ctx, util) {
    const that = this;

    function _drawMarker(x, y, w, h, fillStyle = 'blue', isHMarker = false) {
      ctx.save();
      ctx.fillStyle = fillStyle;
      ctx.beginPath();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.fill();

      ctx.beginPath();
      ctx.lineWidth = 0.2;
      if (isHMarker) {
        ctx.moveTo(x - w * 0.2, y + h * 0.5);
        ctx.lineTo(x + w + w * 0.2, y + h * 0.5);
      }
      else {
        ctx.moveTo(x + w * 0.5, y - h * 0.2);
        ctx.lineTo(x + w * 0.5, y + h + h * 0.2);
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawOctavaBracket(dCtx, startPos, endPos) {
      const ctx = dCtx.ctx;
      const olt = dCtx.toScreenCSX(that.engravingDefaults.octaveLineThickness);
      const glyphData = util._getGlyphData('ottavaAlta');
      const m = util._measureGlyph(glyphData, 0, 0, dCtx.sbl);
      ctx.save();
      ctx.lineWidth = olt;
      util._renderGlyph(glyphData, startPos.x, startPos.y + (dCtx.sbl * 1), dCtx.fontSize, ctx);

      const dv = dCtx.sbl * 0.8;
      ctx.setLineDash([0, dv, dv, 0]); // fixme: how to resolve?
      ctx.beginPath();
      ctx.moveTo(m.scaledBBox.w + startPos.x - (dCtx.sbl * 0.5), startPos.y);
      ctx.lineTo(endPos.x, endPos.y);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(endPos.x, endPos.y - (olt * 0.5));
      ctx.lineTo(endPos.x, endPos.y + (dCtx.sbl * 1.5));
      ctx.stroke();

      ctx.restore();
    }

    function drawHorizontalArrowLine(dCtx, startPos, endPos) {
      const ctx = dCtx.ctx;

      // FIXME: Is this an expected example?
      const ast = dCtx.toScreenCSX(that.engravingDefaults.arrowShaftThickness);
      const glyphData = util._getGlyphData('arrowheadBlackRight');
      const m = util._measureGlyph(glyphData, 0, 0, dCtx.sbl);
      if (!m.scaledBBox) {
        console.warn('no arrowheadBlackRight bbox.');
        m.scaledBBox = {
          isFakeBBox: true,
          w: dCtx.fontSize * 0.5,
          h: dCtx.fontSize
        };
      }
      ctx.save();
      ctx.lineWidth = ast;
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(endPos.x - (m.scaledBBox.w * 0.5), endPos.y);
      ctx.stroke();
      if (!m.scaledBBox.isFakeBBox) {
        util._renderGlyph(glyphData, endPos.x - m.scaledBBox.w, endPos.y + (m.scaledBBox.h * 0.5), dCtx.fontSize, ctx);
      }
      else {
        ctx.beginPath();
        ctx.moveTo(endPos.x, endPos.y);
        const aX = endPos.x - (m.scaledBBox.w * 0.5);
        const aYd = dCtx.sbl * 0.5;
        ctx.lineTo(aX, endPos.y + aYd);
        ctx.lineTo(aX, endPos.y - aYd);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawBarlines(dCtx, system, sbbox) {
      ctx.save();

      const sbl = dCtx.sbl;

      const maOffset = -(sbl * 0.5);
      const maSize = sbl * 0.3;

      const octaveBracketPos = {
        startPos: {
          x: 0,
          y: system.y - (sbl * 3)
        },
        endPos: {
          x: 0,
          y: system.y - (sbl * 3)
        }
      };

      _drawMarker(system.x + system.w + sbl * 0.5, system.y - sbbox.slt * 0.5, sbl * 0.3, sbbox.slt,
        'blue', true);


      // thin braline. (normal)
      const thinbt = dCtx.toScreenCSX(that.engravingDefaults.thinBarlineThickness);
      let x = sbbox.x + 30;
      let y = sbbox.y;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + sbbox.h);
      ctx.lineWidth = thinbt;
      ctx.stroke();

      _drawMarker(x - thinbt * 0.5, y + maOffset, thinbt, maSize);

      // thick braline.
      const thickbt = dCtx.toScreenCSX(that.engravingDefaults.thickBarlineThickness);
      x += 30;
      octaveBracketPos.startPos.x = x;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + sbbox.h);
      ctx.lineWidth = thickbt;
      ctx.stroke();

      _drawMarker(x - thickbt * 0.5, y + maOffset, thickbt, maSize);


      // dashed braline.
      const dblt = dCtx.toScreenCSX(that.engravingDefaults.dashedBarlineThickness);
      const dbldl = dCtx.toScreenCSX(that.engravingDefaults.dashedBarlineDashLength);
      const dblgl = dCtx.toScreenCSX(that.engravingDefaults.dashedBarlineGapLength);

      x += 30;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + sbbox.h);
      ctx.lineWidth = dblt;
      ctx.setLineDash([dbldl, dblgl]);
      ctx.stroke();
      ctx.restore();

      _drawMarker(x - dblt * 0.5, y + maOffset, dblt, maSize);


      // double (thin + separation + thin) barline.
      x += 30;

      const dlseparation = dCtx.toScreenCSX(that.engravingDefaults.barlineSeparation);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + sbbox.h);
      ctx.lineWidth = thinbt;
      ctx.stroke();

      _drawMarker(x - thinbt * 0.5, y + maOffset, thinbt, maSize);
      _drawMarker(x + thinbt * 0.5, y + maOffset, dlseparation, maSize, 'red');

      x += dlseparation + (thinbt * 0.5) + (thinbt * 0.5);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + sbbox.h);
      ctx.lineWidth = thinbt;
      ctx.stroke();
      _drawMarker(x - thinbt * 0.5, y + maOffset, thinbt, maSize);

      // repeat braline. (dot + dotSeparation + thin + separation + thick)
      const repeatbldsep = dCtx.toScreenCSX(that.engravingDefaults.repeatBarlineDotSeparation);
      x += 30;

      const glyphData = util._getGlyphData('repeatDots');
      const m = util._measureGlyph(glyphData, 0, 0, dCtx.sbl);
      util._renderGlyph(glyphData, x, system.y + system.h, dCtx.fontSize, ctx);

      ctx.save();
      ctx.fillStyle = "#ff000088";
      util._renderCross(x, system.y + system.h, 10, ctx);
      ctx.restore();

      _drawMarker(x, y + maOffset, m.scaledBBox.w, maSize);

      x += m.scaledBBox.w;

      _drawMarker(x, y + maOffset, repeatbldsep, maSize, 'red');
      x += repeatbldsep;

      x += thinbt * 0.5;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + sbbox.h);
      ctx.lineWidth = thinbt;
      ctx.stroke();

      _drawMarker(x - thinbt * 0.5, y + maOffset, thinbt, maSize);

      _drawMarker(x + thinbt * 0.5, y + maOffset, dlseparation, maSize, 'red');
      x += dlseparation + (thinbt * 0.5) + (thickbt * 0.5);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + sbbox.h);
      ctx.lineWidth = thickbt;
      ctx.stroke();
      _drawMarker(x - thickbt * 0.5, y + maOffset, thickbt, maSize);

      ctx.restore();

      octaveBracketPos.endPos.x = x;
      drawOctavaBracket(dCtx, octaveBracketPos.startPos, octaveBracketPos.endPos);

      const arrowLineOffsetY = sbl * -1.2;
      octaveBracketPos.startPos.y += arrowLineOffsetY;
      octaveBracketPos.endPos.y += arrowLineOffsetY;
      drawHorizontalArrowLine(dCtx, octaveBracketPos.startPos, octaveBracketPos.endPos);
    }

    function drawLegerLine(dCtx, x, y, noteheadMetrics) {
      /*
        "legerLineThickness" 	The thickness of a leger line (normally somewhat thicker
           than a staff line)

        "legerLineExtension" 	The amount by which a leger line should extend either
          side of a notehead, scaled proportionally with the notehead's size, e.g.
          when scaled down as a grace note
      */
      const llThickness = dCtx.toScreenCSX(that.engravingDefaults.legerLineThickness);
      const llExt = that.engravingDefaults.legerLineExtension * noteheadMetrics.scaledBBox.w;
      const ctx = dCtx.ctx;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x - llExt, y);
      ctx.lineTo(x + noteheadMetrics.scaledBBox.w + llExt, y);
      ctx.lineWidth = llThickness;
      ctx.stroke();
      ctx.restore();
    }

    function drawStem(dCtx, anchorPos, h, hAlign) {
      const stemThickness = dCtx.toScreenCSX(that.engravingDefaults.stemThickness);
      const x = anchorPos.x - (hAlign == 'R' ? stemThickness : 0);
      const y = anchorPos.y;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + stemThickness, y);
      ctx.lineTo(x + stemThickness, y + h);
      ctx.lineTo(x, y + h);
      ctx.fill();
      ctx.restore();
    }

    function drawSimpleBeams(dCtx, tlPos, trPos, nBeams) {
      const ctx = dCtx.ctx;
      const bs = dCtx.toScreenCSX(that.engravingDefaults.beamSpacing);
      const bt = dCtx.toScreenCSX(that.engravingDefaults.beamThickness);
      const hbt = bt * 0.5;

      // tlPos: top left, trPos: top right
      let x = tlPos.x;
      let y = tlPos.y + hbt;
      let x1 = trPos.x;
      let y1 = y; // FIXME: support slope.

      ctx.save();
      ctx.lineWidth = bt;
      for (let i = 0; i < nBeams; i++) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        y += bs + bt;
        y1 = y;
      }
      ctx.restore();
    }

    function drawHairpin(dCtx, x, y, x2, h) {
      const ctx = dCtx.ctx;
      const hairpinThickness = dCtx.toScreenCSX(that.engravingDefaults.hairpinThickness);
      ctx.save();
      ctx.lineWidth = hairpinThickness;
      ctx.beginPath();
      ctx.moveTo(x2, y - h * 0.5);
      ctx.lineTo(x, y);
      ctx.lineTo(x2, y + h * 0.5);
      ctx.stroke();
      ctx.restore();
    }

    function drawCurve(dCtx, pos, cps, type) {
      const ctx = dCtx.ctx;

      /*
      "slurEndpointThickness" 	The thickness of the end of a slur
      "slurMidpointThickness" 	The thickness of the mid-point of a slur (i.e. its thickest point)
      "tieEndpointThickness" 	The thickness of the end of a tie
      "tieMidpointThickness" 	The thickness of the mid-point of a tie
      */

      const et = dCtx.toScreenCSX(that.engravingDefaults[type + 'EndpointThickness']);
      const mt = dCtx.toScreenCSX(that.engravingDefaults[type + 'MidpointThickness']);
      const hmt = mt * 0.5; // FIXME: More accurate calculation.

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pos.x1, pos.y1);
      ctx.bezierCurveTo(cps.x1, cps.y1 - hmt,
        cps.x2, cps.y2 - hmt,
        pos.x2, pos.y2
      );

      ctx.bezierCurveTo(cps.x2, cps.y2 + hmt,
        cps.x1, cps.y1 + hmt,
        pos.x1, pos.y1
      );

      ctx.lineWidth = et;
      ctx.stroke();
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawTuplet(dCtx, pos, n, placement) {
      const ctx = dCtx.ctx;
      const tt = dCtx.toScreenCSX(that.engravingDefaults.tupletBracketThickness);

      const bh = sbl * (placement === 'above' ? 1 : -1);

      const w = pos.x2 - pos.x1;
      const h = pos.y2 - pos.y1;
      const slope = h / w;
      const gdTupletNumber = util._getGlyphData('tuplet' + n);
      const fontSize = dCtx.sbl * 3; // FIXME: how to resolve font size?
      const gm = util._measureGlyph(gdTupletNumber, 0, 0, fontSize / 5);

      const lw = (w * 0.5) - (gm.scaledBBox.w * 0.5) - (dCtx.sbl * 0.5);
      const middlePos = {
        x1: pos.x1 + lw,
        y1: pos.y1 + (slope * lw),
        x2: pos.x2 - lw,
        y2: pos.y1 + (slope * (w - lw)),
      };

      ctx.save();
      ctx.lineWidth = tt;
      ctx.beginPath();
      ctx.moveTo(pos.x1, pos.y1 + bh);
      ctx.lineTo(pos.x1, pos.y1);
      ctx.lineTo(middlePos.x1, middlePos.y1);

      ctx.moveTo(middlePos.x2, middlePos.y2);
      ctx.lineTo(pos.x2, pos.y2);
      ctx.lineTo(pos.x2, pos.y2 + bh);
      ctx.stroke();

      ctx.textAlign = 'center';
      util._renderGlyph(gdTupletNumber, pos.x1 + (w * 0.5),
        (gm.scaledBBox.h * 0.5) + Math.min(pos.y2, pos.y1) + (h * 0.5),
        fontSize, ctx);

      ctx.restore();
    }

    function drawLyrics(dCtx, lyricDefs) {
      const ctx = dCtx.ctx;
      const fontSize = (dCtx.sbl * 1.6);
      ctx.save();
      ctx.font = (fontSize) + 'px serif';
      ctx.textAlign = 'center';
      const lines = [];
      lyricDefs.forEach((def) => {
        let offsetX = 0;
        if (def.text) {
          ctx.fillText(def.text, def.x, def.y);
          offsetX = ctx.measureText(def.text).width * 0.5;
          offsetX += fontSize * 0.1;
        }
        if (def.lineEnd) {
          if (lines.length) {
            lines[lines.length - 1].x2 = def.x;
            lines[lines.length - 1].y2 = def.y;
          }
        }
        if (def.lineStart) {
          lines.push({
            x1: def.x + offsetX,
            y1: def.y,
            x2: NaN,
            y2: NaN
          });
        }
      });

      ctx.lineWidth = dCtx.toScreenCSX(that.engravingDefaults.lyricLineThickness);
      lines.forEach((line) => {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
      });
      ctx.restore();
    }

    function drawPedal(dCtx, sym1,
      x1, y, x2) {
      const ctx = dCtx.ctx;

      ctx.save();
      ctx.lineWidth = dCtx.toScreenCSX(that.engravingDefaults.pedalLineThickness);
      const gdSym1 = util._getGlyphData(sym1);
      const mSym1 = util._measureGlyph(gdSym1, 0, 0, dCtx.sbl);
      util._renderGlyph(gdSym1, x1, y, dCtx.fontSize, ctx);

      ctx.beginPath();
      const ly = y - (ctx.lineWidth * 0.5);
      ctx.moveTo(x1 + mSym1.scaledBBox.w + (dCtx.fontSize * 0.1), ly);
      ctx.lineTo(x2, ly);
      ctx.lineTo(x2, ly - (mSym1.scaledBBox.h * 0.7)); // fake hook...
      ctx.stroke();

      ctx.restore();
    }

    function drawRehearsalMark(dCtx, pos, str) {
      const ctx = dCtx.ctx;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const fontSize = (dCtx.sbl * 1.5);
      ctx.font = (fontSize) + 'px serif';
      let hw = ctx.measureText(str).width * 0.5;
      let hh = fontSize * 0.5;
      ctx.fillText(str, pos.x, pos.y);
      ctx.lineWidth = dCtx.toScreenCSX(that.engravingDefaults.textEnclosureThickness);
      ctx.beginPath();
      const padding = fontSize * 0.2;
      const hPadding = padding * 1.5;
      ctx.rect(pos.x - hw - hPadding,
        pos.y - hh - padding,
        (hw * 2) + (hPadding * 2),
        (hh * 2) + (padding * 2)
      );
      ctx.stroke();
      ctx.restore();
    }

    /*
    https://w3c.github.io/smufl/gitbook/specification/scoring-metrics-glyph-registration.html
    ---------------------------------------------------------------------
    Digits for time signatures should be scaled such that each digits
    is two staff spaces tall, i.e. 0.5 em, and vertically centered on the baseline.

    Although some glyphs in the time signatures range
    (such as the large + sign, common and cut time glyphs, etc.)
    apply to the whole staff, these should likewise be vertically centered on the baseline.
    Time signature digits should also have non-zero side bearings to achieve good default
    spacing when set in a single run.
    ---------------------------------------------------------------------

    But, Petaluma 1.04: timeSig4 height is sbl*4 (also height of other timeSig*
    glyphs are more that sbl*3), so its too large...;-p

    */
    function drawTimeSig(dCtx, system) {
      const gdTimeSigN = util._getGlyphData('timeSig2');
      const gdTimeSigD = util._getGlyphData('timeSig4');
      const timeSigDMetrics = util._measureGlyph(gdTimeSigD, 0, 0, dCtx.sbl);
      const timeSigNMetrics = util._measureGlyph(gdTimeSigN, 0, 0, dCtx.sbl);

      const block = {
        N: timeSigNMetrics.scaledBBox.N,
        S: timeSigNMetrics.scaledBBox.h + timeSigDMetrics.scaledBBox.S,
        E: Math.max(timeSigDMetrics.scaledBBox.E, timeSigNMetrics.scaledBBox.E),
        W: Math.min(timeSigDMetrics.scaledBBox.W, timeSigNMetrics.scaledBBox.W)
      };
      block.w = block.E - block.W;
      block.h = block.S - block.N;
      block.offsetX = block.w * 0.5;
      block.onY = -timeSigNMetrics.scaledBBox.S;
      block.odY = -timeSigDMetrics.scaledBBox.N;

      const paddingW = dCtx.sbl * 0.25;
      const sbl4 = (dCtx.sbl * 4);
      const lineY = system.y + (dCtx.sbl * 2);

      ctx.save();

      ctx.textAlign = 'center';

      // 1) scale d/n glyhps to fit to N line staff height.
      // in this case, application must considere the glyph type and it's complicated. ;-p
      const fontScale = sbl4 / block.h;
      let fontSize = (fontScale * sbl4);

      const scaledVals = {
        offsetX: block.offsetX * fontScale,
        onY: block.onY * fontScale,
        odY: block.odY * fontScale,
        w: block.w * fontScale
      };

      util._renderGlyph(gdTimeSigN, system.x + scaledVals.offsetX, lineY + scaledVals.onY, fontSize, ctx);
      util._renderGlyph(gdTimeSigD, system.x + scaledVals.offsetX, lineY + scaledVals.odY, fontSize, ctx);

      // 2) fontSize=sbl*4 like other glpyhs (e.g. noteheads). And centering vertically in N line staff.
      system.x += scaledVals.w + paddingW;
      fontSize = sbl4;

      util._renderGlyph(gdTimeSigN, system.x + block.offsetX, lineY + block.onY, fontSize, ctx);
      util._renderGlyph(gdTimeSigD, system.x + block.offsetX, lineY + block.odY, fontSize, ctx);

      ctx.textAlign = 'start';
      system.x += block.w + paddingW;

      const gd1 = util._getGlyphData('timeSigCutCommon');
      util._renderGlyph(gd1, system.x, lineY, sbl4, ctx);

      system.x += util._measureGlyph(gd1, 0, 0, dCtx.sbl).scaledBBox.w + paddingW;
      util._renderGlyph(util._getGlyphData('timeSigCommon'), system.x, lineY, sbl4, ctx);

      ctx.restore();
    }

    function drawNotes(dCtx, system, sbbox) {
      const ctx = dCtx.ctx;
      system = {
        x: system.x + 10,
        y: system.y
      };

      drawTimeSig(dCtx, system);

      const gdNoteheadBlack = util._getGlyphData('noteheadBlack');
      const stemHeight = 3 * dCtx.sbl;
      const fontSize = dCtx.fontSize;

      let x = system.x + 40;
      let y = system.y - sbl * 2;

      const gdNoteheadWhole = util._getGlyphData('noteheadWhole');
      const noteheadWholeMetrics = util._measureGlyph(gdNoteheadWhole, 0, 0, dCtx.sbl);
      util._renderGlyph(gdNoteheadWhole, x, y, fontSize, ctx);

      drawLegerLine(dCtx, x, y + sbl, noteheadWholeMetrics);
      drawLegerLine(dCtx, x, y, noteheadWholeMetrics);

      x += 40;

      util._renderGlyph(gdNoteheadBlack, x, y, fontSize, ctx);
      const noteheadBlackMetrics = util._measureGlyph(gdNoteheadBlack, x, y, dCtx.sbl);

      drawLegerLine(dCtx, x, y + sbl, noteheadBlackMetrics);
      drawLegerLine(dCtx, x, y, noteheadBlackMetrics);
      const nb_stemDownNWAnchor = util._getAnchor('noteheadBlack', 'stemDownNW');
      if (nb_stemDownNWAnchor) {
        const pos0 = util._anchorCsToScreenCs(noteheadBlackMetrics.scaledBBox, nb_stemDownNWAnchor, dCtx.sbl);
        drawStem(dCtx, pos0, stemHeight + sbl - (pos0.y - y), 'L');
      }

      /////////////////////////////////////////////////////////////
      // beamed notes.

      // hairpin
      drawHairpin(dCtx, system.x + 30, system.y - sbl * 3.2, system.x + 120, sbl * 1.2);

      x += 60;
      y = system.y + sbl;

      util._renderGlyph(gdNoteheadBlack, x, y, fontSize, ctx);
      const m1 = util._measureGlyph(gdNoteheadBlack, x, y, dCtx.sbl);
      const nb_stemUpSEAnchor = util._getAnchor('noteheadBlack', 'stemUpSE');

      const lyricLineY = system.y + (sbl * 10.5);
      const lyricDefs = [
        {
          x: 0,
          y: lyricLineY,
          text: 'lyric'
        },
        {
          x: 0,
          y: lyricLineY,
          text: 'line',
          lineStart: true
        },
        {
          x: 0,
          y: lyricLineY,
          lineEnd: true
        }
      ];

      // text enclosure.
      drawRehearsalMark(dCtx, {
        x: x + sbl,
        y: y - (4.5 * sbl),
      }, 'A');

      x += 25;
      util._renderGlyph(gdNoteheadBlack, x, y, fontSize, ctx);
      const m2 = util._measureGlyph(gdNoteheadBlack, x, y, dCtx.sbl);
      if (nb_stemUpSEAnchor) {
        const pos1 = util._anchorCsToScreenCs(m1.scaledBBox, nb_stemUpSEAnchor, dCtx.sbl);
        const beamedStemHeight = stemHeight + (pos1.y - y);
        drawStem(dCtx, pos1, -beamedStemHeight, 'R');

        const pos2 = util._anchorCsToScreenCs(m2.scaledBBox, nb_stemUpSEAnchor, dCtx.sbl);
        drawStem(dCtx, pos2, -beamedStemHeight, 'R');

        const ty = pos1.y + (-beamedStemHeight);
        pos1.y = ty;
        pos2.y = ty;
        drawSimpleBeams(dCtx, pos1, pos2, 2);

      }

      // curves
      x = system.x + 80;
      y = system.y + sbl * 3;

      const npos = [{
        x: x,
        y: y
      }];

      util._renderGlyph(gdNoteheadBlack, x, y, fontSize, ctx);
      if (nb_stemDownNWAnchor) {
        const m = util._measureGlyph(gdNoteheadBlack, x, y, dCtx.sbl);
        const pos0 = util._anchorCsToScreenCs(m.scaledBBox, nb_stemDownNWAnchor, dCtx.sbl);
        drawStem(dCtx, pos0, stemHeight - (pos0.y - y), 'L');
      }

      x += 60;
      y += sbl;
      npos.push({
        x: x,
        y: y
      });

      util._renderGlyph(gdNoteheadBlack, x, y, fontSize, ctx);
      if (nb_stemDownNWAnchor) {
        const m = util._measureGlyph(gdNoteheadBlack, x, y, dCtx.sbl);
        const pos0 = util._anchorCsToScreenCs(m.scaledBBox, nb_stemDownNWAnchor, dCtx.sbl);
        drawStem(dCtx, pos0, stemHeight - (pos0.y - y), 'L');
      }

      x += 50;
      npos.push({
        x: x,
        y: y
      });
      util._renderGlyph(gdNoteheadBlack, x, y, fontSize, ctx);
      if (nb_stemDownNWAnchor) {
        const m = util._measureGlyph(gdNoteheadBlack, x, y, dCtx.sbl);
        const pos0 = util._anchorCsToScreenCs(m.scaledBBox, nb_stemDownNWAnchor, dCtx.sbl);
        drawStem(dCtx, pos0, stemHeight - (pos0.y - y), 'L');
      }

      const tpos = {
        x1: npos[1].x + 6,
        y1: npos[1].y - 7,
        x2: npos[2].x + 6,
        y2: npos[2].y - 7,
      };
      const tcps = {
        x1: tpos.x1 + 8,
        y1: tpos.y1 - 9,
        x2: tpos.x2 - 8,
        y2: tpos.y2 - 9
      };
      drawCurve(dCtx, tpos, tcps, 'tie');

      const spos = {
        x1: npos[0].x + 3,
        y1: npos[0].y + 2 * sbl,
        x2: npos[1].x - 2,
        y2: npos[1].y + 2 * sbl,
      };
      const scps = {
        x1: spos.x1 + 2,
        y1: spos.y1 + 4,
        x2: spos.x2 - 16,
        y2: spos.y2 + 6
      };
      drawCurve(dCtx, spos, scps, 'slur');

      // FIXME: how to resolve hook length?
      drawTuplet(dCtx, {
        x1: npos[0].x,
        y1: npos[0].y + 4.5 * sbl,
        x2: npos[2].x + m1.scaledBBox.w,
        y2: npos[2].y + 4.5 * sbl,
      },
        3, 'below');

      lyricDefs[0].x = npos[0].x + (m1.scaledBBox.w * 0.5);
      lyricDefs[1].x = npos[1].x + (m1.scaledBBox.w * 0.5);
      lyricDefs[2].x = npos[2].x + m1.scaledBBox.w;
      drawLyrics(dCtx, lyricDefs);

      drawPedal(dCtx, 'keyboardPedalPed',
        npos[0].x, lyricLineY + (sbl * 4),
        npos[2].x);
    }

    const sbl = 10;
    const dCtx = {
      ctx: ctx,
      util: util,
      nStaffLines: 5,
      fontSize: sbl * 4,
      systems: [
        {
          x: 50,
          y: 50,
          w: 200,
          h: sbl * 4,
          draw: drawBarlines,
        },
        {
          x: 50,
          y: 50 + sbl * 10,
          w: 300,
          h: sbl * 4,
          draw: drawNotes,
        }
      ],
      sbl: sbl,
      toScreenCSX: function (engravingDefaultsVal) {
        return this.sbl * engravingDefaultsVal;
      },
    };

    dCtx.ctx.save();
    dCtx.ctx.clearRect(0, 0, dCtx.ctx.canvas.clientWidth, dCtx.ctx.canvas.clientHeight);
    const scaleVal = util.ssOptionsGlyphSize / (sbl * 4);
    dCtx.ctx.scale(scaleVal, scaleVal);
    this.drawStaffs(dCtx);
    dCtx.ctx.restore();
  }

  drawStaffs(dCtx) {
    const ctx = dCtx.ctx;
    const slt = dCtx.toScreenCSX(this.engravingDefaults.staffLineThickness);
    const systems = dCtx.systems;
    const nStaffLines = dCtx.nStaffLines;
    const sbl = dCtx.sbl;

    ctx.lineWidth = slt;
    ctx.strokeStyle = 'black';
    systems.forEach(function (system) {
      for (let i = 0; i < nStaffLines; i++) {
        const y = system.y + (dCtx.sbl * i);
        ctx.beginPath();
        ctx.moveTo(system.x, y);
        ctx.lineTo(system.x + system.w, y);
        ctx.stroke();
      }

      system.draw(dCtx, system, {
        x: system.x,
        y: system.y - (slt * 0.5),
        w: system.w,
        h: ((nStaffLines - 1) * sbl) + slt,
        slt: slt
      });
    });

    // https://steinberg.help/dorico/v1/en/dorico/topics/notation_reference/notation_reference_brackets_braces_c.html
    ctx.lineWidth = dCtx.toScreenCSX(this.engravingDefaults.thinBarlineThickness);
    const blx = systems[0].x + (ctx.lineWidth * 0.5);
    ctx.beginPath();
    ctx.moveTo(blx, systems[0].y);
    ctx.lineTo(blx, systems[1].y + (sbl * (nStaffLines - 1)));
    ctx.stroke();


    // stave bracket.
    ctx.lineWidth = dCtx.toScreenCSX(this.engravingDefaults.bracketThickness);
    const bx = systems[0].x - (sbl * 0.8);
    const bp = 0.2;
    const by1 = systems[0].y - (sbl * bp);
    const by2 = systems[1].y + (sbl * (nStaffLines - 1 + bp));
    ctx.beginPath();
    ctx.moveTo(bx + (ctx.lineWidth * 0.5), by1);
    ctx.lineTo(bx + (ctx.lineWidth * 0.5), by2);
    ctx.stroke();

    [{
      gname: 'bracketTop',
      y: by1
    },
    {
      gname: 'bracketBottom',
      y: by2
    }].forEach((def) => {
      const gd = dCtx.util._getGlyphData(def.gname);
      //const noteheadWholeMetrics = util._measureGlyph(gdNoteheadWhole, 0, 0, dCtx.sbl);
      dCtx.util._renderGlyph(gd, bx, def.y, dCtx.fontSize, ctx);
    });

    // sub stave bracket.
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = dCtx.toScreenCSX(this.engravingDefaults.subBracketThickness);
    const sbx = systems[0].x + (ctx.lineWidth * 0.5);
    const shw = sbl * 1.3;
    ctx.beginPath();
    ctx.moveTo(sbx, systems[0].y);
    ctx.lineTo(sbx - shw, systems[0].y);
    ctx.lineTo(sbx - shw, systems[1].y + (sbl * (nStaffLines - 1)));
    ctx.lineTo(sbx, systems[1].y + (sbl * (nStaffLines - 1)));
    ctx.stroke();

  }
}
