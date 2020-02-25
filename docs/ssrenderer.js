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
    function drawBarlines(dCtx, system, sbbox) {
      ctx.save();

      const sbl = dCtx.sbl;

      const maOffset = -(sbl * 0.5);
      const maSize = sbl * 0.3;

      _drawMarker(system.x - sbl * 0.5, system.y - sbbox.slt * 0.5, sbl * 0.3, sbbox.slt,
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
      util._renderGlyph(glyphData, x, system.y + system.h, dCtx.sbl * 4, ctx);

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
    }

    const sbl = 10;
    const dCtx = {
      ctx: ctx,
      util: util,
      nStaffLines: 5,
      systems: [
        {
          x: 10,
          y: 10,
          w: 200,
          h: sbl * 4,
          draw: drawBarlines,
        }
      ],
      sbl: sbl,
      toScreenCSX: function(engravingDefaultsVal) {
        return this.sbl * engravingDefaultsVal;
      },
      renderGlyph: function(x, y, codepoint, fontSize) {
        this.ctx.font = fontSize + 'px SMuFLFont';
        const str = String.fromCodePoint(codepoint);
        ctx.fillText(str, x, y);
      }
    };

    dCtx.ctx.save();
    dCtx.ctx.scale(4, 4);
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
    systems.forEach(function(system) {
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
  }
}
