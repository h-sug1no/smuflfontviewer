/**
 * Copyright (c) 2019 h-sug1no
 */

/* eslint-disable quotes */
/* eslint-disable no-console */
// eslint-disable-next-line no-unused-vars
class SMuFLFontViewer {

  constructor() {
    // eslint-disable-next-line no-undef
    this.sMuFLMetadata = new SMuFLMetadata();
    this.sSRenderer = new SSRenderer();
  }

  init(options) {
    const $ = window.$;
    const sMuFLMetadata = this.sMuFLMetadata;
    const that = this;

    if (!options.get) {
      options = {
        data: options,
        get: function (key) {
          return this.data[key];
        }
      };
    }

    function _$c_appendText($c, text) {
      $c.append(document.createTextNode(text));
    }

    function _initFontFace() {
      const fontFace = that.fontFace = {
        fontUrl: undefined
      };

      Object.keys(fontFace).forEach(function (key) {
        fontFace[key] = options.get(key);
      });

      if (!window.FontFace) {
        alert('no window.FontFace. This browser is not supported.');
      }

      const smuflFontFace = new FontFace('SMuFLFont', `url(${fontFace.fontUrl})`);

      smuflFontFace.load().then(function (loaded_face) {
        // loaded_face holds the loaded FontFace
        document.fonts.add(loaded_face);
        let fontUrlItems = fontFace.fontUrl.split('/');
        if (fontUrlItems.length < 1) {
          fontUrlItems = ['?'];
        }
        document.title = `${fontUrlItems[fontUrlItems.length - 1]}: ${document.title}`;
        window.setTimeout(function () {
          that._handle_onResourceReady('smuflFontFace');
        });
      }).catch(function (error) {
        // error occurred
        alert(error + ': ' + fontFace.fontUrl);
      });
    }

    _initFontFace();

    const $codepointSelect = $('#codepointSelect');
    let $codepointSelect_selectize;

    let rosgCpSelect;  // repeatOffset sample glyph cp select.

    sMuFLMetadata.init(options).then(function (/* obj */) {
      if (sMuFLMetadata.initErrors.length) {
        alert(sMuFLMetadata.initErrors.map(function (str) {
          return str + '\n';
        }));
      }
      else {
        const soptions = [];
        const glyphnames = sMuFLMetadata.data.glyphnames;

        Object.keys(glyphnames).forEach((gname) => {
          //{series: 'optionalGlyphs', value: 10, name: '1'},
          const cp = glyphnames[gname].codepoint.replace('U+', '');
          soptions.push({
            series: 'glyphnames',
            value: cp,
            name: cp + ': ' + gname
          });
        });

        const optionalGlyphs = sMuFLMetadata.fontMetadata().optionalGlyphs;
        console.warn('no optionalGlyphs');
        Object.keys(optionalGlyphs||{}).forEach((gname) => {
          const cp = optionalGlyphs[gname].codepoint.replace('U+', '');
          soptions.push({
            series: 'optionalGlyphs',
            value: cp,
            name: cp + ': ' + gname
          });
        });

        function initCpSelect($codepointSelect, onChangeCB, onBlurCB) {
          $codepointSelect.selectize({
            options: soptions,
            optgroups: [
              { value: 'glyphnames', label: 'glyphnames' },
              { value: 'optionalGlyphs', label: 'optionalGlyphs' },
              { value: 'codepoint', label: 'codepoint' },
            ],
            optgroupField: 'series',
            labelField: 'name',
            searchField: ['name'],
            placeholder: 'enter glyphname or (c)odepoint',
            maxItems: 1,
            create: false,
            onType: function (str) {
              // console.log(str);
              $codepointSelect_selectize.onType(str);
            },
            onChange: function (value) {
              onChangeCB(value);
            },
            onBlur: function () {
              onBlurCB($codepointSelect_selectize);
            }
            //openOnFocus: false,
            //plugins: ['optgroup_columns']
          });

          const $codepointSelect_selectize = $codepointSelect[0].selectize;
          $codepointSelect_selectize.onType = function(str, keepOptions) {
            str = str.toUpperCase();
            if (str.match(/^[A-F0-9]+$/)) {
              let cpNumber = NaN;
              try {
                cpNumber = parseInt(str, 16);
                // check cpNumber is valid unicode codepoint.
                String.fromCodePoint(cpNumber);
              } catch (e) {
                // RangeError: xxxxxxx is not a valid code point
                // console.log(e);
                return;
              }
              if (isNaN(cpNumber)) {
                return;
              }

              str = formatCodepointNumber(cpNumber);
              const cpData = $codepointSelect_selectize.addCodePointItem(str);
              $codepointSelect_selectize.refreshOptions(!keepOptions);
              return str;
            }
          };
          $codepointSelect_selectize.addCodePointItem = function (cp) {
            cp = cp.toUpperCase();
            const cpData = {
              series: 'codepoint',
              value: cp,
              name: cp
            }
            $codepointSelect_selectize.addOption(cpData);
            return cpData;
          };
          return {
            $codepointSelect: $codepointSelect,
            $codepointSelect_selectize: $codepointSelect_selectize,
          };
        }
        const cpSelect0 = initCpSelect($codepointSelect, (value) => {
          if (value.length) {
            setCodepointByString(value);
          }
        },
        ($codepointSelect_selectize) => {
          if (!$codepointSelect_selectize.getValue().length) {
            $codepointSelect_selectize.setValue(history.currentUCodepoint, true);
          }
        });
        $codepointSelect_selectize = cpSelect0.$codepointSelect_selectize;

        const $rosgCpSelect = $('<selct class="rosgCpSelect"></selct>');
        $smuflGlyphHints_repatOffset3StateBox[0].parentElement.parentElement.appendChild($rosgCpSelect[0]);
        rosgCpSelect = initCpSelect($rosgCpSelect, (value) => {
          if (value.length) {
            // repaint repeatOffset sample glyph.
            // renderGlyph(currentGlyphData);
          }
        },
        ($codepointSelect_selectize) => {
          // fixme: onBlurCB.
        });
        rosgCpSelect.$codepointSelect_selectize.$control.prop('title',
          'Select a glyph to use as an example drawing for the repeatOffset property');

        that._handle_onResourceReady('smuflMetadata');
      }
    });


    const params = new URLSearchParams(window.location.search);

    const $smuflGlyphHints = $('#smuflGlyphHints');

    function toHintlabelIdStr(name) {
      return 'hintLabel_' + name;
    }

    function input_make3State(inputElm, isIndeterminate, isUnchecked) {
      inputElm.parentElement.classList.add('tri-state');
      inputElm._on3StateChange = function () {
        inputElm._3state++;
        if (inputElm._3state > 2) { inputElm._3state = 0; }
        inputElm.checked = inputElm._3state & 2;
        inputElm.indeterminate = inputElm._3state & 1;
      };
      if (isIndeterminate) {
        inputElm._3state = 0;
      }
      else if (isUnchecked) {
        inputElm._3state = 2;
      }
      else {
        inputElm._3state = 1;
      }
      inputElm._on3StateChange();
    }

    const hintLabels = $smuflGlyphHints.children('label');
    for (let li = 0; li < hintLabels.length; li++) {
      const hintLabel = hintLabels[li];
      hintLabel.id = toHintlabelIdStr(hintLabel.textContent);
      const inputElm = hintLabel.firstElementChild;

      if (!hintLabel.textContent.startsWith('cutOutOrigin_BBL')) {
        inputElm.checked = true;
      }

      const isIndeterminate = hintLabel.textContent.startsWith('stem') ||
        hintLabel.textContent.startsWith('splitStem') ||
        hintLabel.textContent.startsWith('opticalCenter') ||
        hintLabel.textContent.startsWith('noteheadOrigin') ||
        hintLabel.textContent.startsWith('graceNoteSlash');
      if (isIndeterminate || hintLabel.textContent.startsWith('repeatOffset') ||
        hintLabel.textContent.startsWith('numeral')) {
        input_make3State(inputElm, isIndeterminate);
      }
    }

    const $smuflGlyphHints_repatOffset3StateBox =
      $smuflGlyphHints.find('#' + toHintlabelIdStr('repeatOffset') + ' input');
    const smuflGlyphHints_repatOffset3StateBoxElm = $smuflGlyphHints_repatOffset3StateBox[0];

    const $smuflGlyphHints_cutOutOrigin_BBL =
      $smuflGlyphHints.find('#' + toHintlabelIdStr('cutOutOrigin_BBL') + ' input');

    var c = document.getElementById('smuflGlyphCanvas');
    var ctx = c.getContext('2d');

    const $smuflRenderGlyphOptionsOrigin = $('#smuflRenderGlyphOptionsOrigin');
    const $smuflRenderGlyphOptionsBbox = $('#smuflRenderGlyphOptionsBbox');

    const $smuflRenderGlyphOptionsGlyphSize = $('#smuflRenderGlyphOptionsGlyphSize');

    const $smuflRenderGlyphOptionsResetScrollPosition = $('#smuflRenderGlyphOptionsResetScrollPosition');
    const $smuflRenderGlyphOptionsResetGlyphSize = $('#smuflRenderGlyphOptionsResetGlyphSize');

    const $smuflRenderGlyphOptionsSl = $('#smuflRenderGlyphOptionsSl');
    input_make3State($smuflRenderGlyphOptionsSl.get(0), false, true);

    $smuflRenderGlyphOptionsGlyphSize.on('input', function () {
      this.nextElementSibling.textContent = this.value;
    });
    $smuflRenderGlyphOptionsGlyphSize.trigger('input');

    $smuflRenderGlyphOptionsGlyphSize.on('input', function () {
      renderGlyph(currentGlyphData);
    });

    $smuflRenderGlyphOptionsResetScrollPosition.on('click', function() {
      _resetScPosition();
    });

    const initialGlyphSize = $smuflRenderGlyphOptionsGlyphSize.val();
    $smuflRenderGlyphOptionsResetGlyphSize.on('click', function() {
      $smuflRenderGlyphOptionsGlyphSize.val(initialGlyphSize).trigger('input');
    });

    const $scratchpadDialog = $('#scratchpadDialog');
    $('#BShowScratchpad').on('click', function () {
      $scratchpadDialog.toggleClass('hidden');
    });

    const $scratchpadDialogTextarea = $('#scratchpadDialog textarea');
    const $scrachpadGlyphSizeSlider = $('#scrachpadGlyphSizeSlider');

    $scrachpadGlyphSizeSlider.on('input', function () {
      this.nextElementSibling.textContent = this.value;
      const nPx = Number(this.value);
      $scratchpadDialogTextarea.css('font-size', nPx + 'px');

      // FIXME: too large clientRect by Petaluma and Bravura, limit textarea size
      $scratchpadDialogTextarea.css('height', (nPx * 3) + 'px');
      $scratchpadDialogTextarea.css('width', (nPx * 5) + 'px');
    });

    const $uCodeSpan = $('#uCodeSpan');
    const prevTASelection = {
      start: undefined,
      end: undefined,
      value: undefined
    };

    function updateCurrentUCharInfo() {
      const docSelection = document.getSelection();
      // console.log(e, docSelection);
      const elm = $scratchpadDialogTextarea[0];
      const value = $scratchpadDialogTextarea.val();
      if (prevTASelection.start === elm.selectionStart &&
        prevTASelection.end === elm.selectionEnd &&
        prevTASelection.value === value) {
        return;
      }
      prevTASelection.start = elm.selectionStart;
      prevTASelection.end = elm.selectionEnd;
      prevTASelection.value = value;

      let text = 'EOF';
      const selectedStr = value.slice(elm.selectionStart,
        elm.selectionStart === elm.selectionEnd ? elm.selectionStart + 1 : elm.selectionEnd);
      if (selectedStr.length) {
        text = Array.prototype.map.call(selectedStr, c => {
          return ('[' + c + ']: U+' +
            c.codePointAt(0).toString(16)
              .toUpperCase().padStart(4, '0'));
        }).join(', ');
      }
      // console.log(text);
      $uCodeSpan.text(text);
    }

    $scratchpadDialogTextarea.on('keyup', (e) => {
      updateCurrentUCharInfo();
    });

    $scratchpadDialogTextarea.on('mouseup', (e) => {
      updateCurrentUCharInfo();
    });

    $(document).on('selectionchange', (e) => {
      updateCurrentUCharInfo();
    });

    updateCurrentUCharInfo();

    $scrachpadGlyphSizeSlider.trigger('input');

    const $scratchpadDialogInsertButton = $('#scratchpadDialog .controls input[type="button"]');
    $scratchpadDialogInsertButton.on('click', function () {
      const elm = $scratchpadDialogTextarea[0];
      elm.focus();
      const value = $scratchpadDialogTextarea.val();
      const prevSelectionStart = elm.selectionStart;
      const head = value.slice(0, elm.selectionStart);
      const tail = value.slice(elm.selectionEnd);
      const str = String.fromCodePoint(currentGlyphData.codepoint);
      const newValue = head + str + tail;
      $scratchpadDialogTextarea.val(newValue);
      elm.selectionStart = (prevSelectionStart + str.length);
      elm.selectionEnd = elm.selectionStart;
    });

    $('#smuflRenderGlyphOptions input').on('change', function (ev) {
      if (ev.target._on3StateChange) {
        ev.target._on3StateChange();
      }
      renderGlyph(currentGlyphData);
    });

    this.resizeHandlers = [];
    $(window).on('resize', function () {
      renderGlyph(currentGlyphData);
      that.resizeHandlers.forEach(function (func) {
        window.setTimeout(func);
      });
    });

    function _resetScPosition() {
      $('#smuflGlyphCanvasContainer').scrollTop(
        ($('#smuflGlyphCanvasContainer').prop('scrollHeight') * 0.5) -
        ($('#smuflGlyphCanvasContainer').innerHeight() * 0.5));

      $('#smuflGlyphCanvasContainer').scrollLeft(
        ($('#smuflGlyphCanvasContainer').prop('scrollWidth') * 0.5) -
        ($('#smuflGlyphCanvasContainer').width() * 0.5));
    }

    function _initMouseHandlers() {
      const $smuflGlyphCanvasContainer = $('#smuflGlyphCanvasContainer');

      let isActive = false;
      let startPos;

      function _setIsActive(v) {
        isActive = v;
        $smuflGlyphCanvasContainer.css('cursor', isActive ? 'move' : '');
      }

      _setIsActive(false);

      $smuflGlyphCanvasContainer.on('mousedown', function (ev) {
        if (ev.button !== 0) { return; }
        _setIsActive(true);
        startPos = {
          clientX: ev.clientX,
          clientY: ev.clientY,
          scrollLeft: $smuflGlyphCanvasContainer.scrollLeft(),
          scrollTop: $smuflGlyphCanvasContainer.scrollTop()
        };
      });

      $smuflGlyphCanvasContainer.on('mousemove', function (ev) {
        if (isActive) {
          $smuflGlyphCanvasContainer.scrollTop(startPos.scrollTop -
            (ev.clientY - startPos.clientY));
          $smuflGlyphCanvasContainer.scrollLeft(startPos.scrollLeft -
            (ev.clientX - startPos.clientX));
        }
      });

      $smuflGlyphCanvasContainer.on('mouseup', function (ev) {
        if (ev.button !== 0) { return; }
        _setIsActive(false);
      });
      $smuflGlyphCanvasContainer.on('mouseleave', function (ev) {
        _setIsActive(false);
      });

      _resetScPosition();
    }

    _initMouseHandlers();

    const $body = $('body');
    const $rootContainer = $('#rootContainer');
    const $infoDialog = $('#infoDialog');
    const $infoDialog_closeButton = $infoDialog.find('input.closeButton');
    const infoDialogElm = $infoDialog.get(0);
    const $contentContainer = $('#contentContainer');
    const _$infoDialog_defaultDescription = 'use browser\'s search to find glyphname, smufl properties, codepoint, etc...';

    if (!infoDialogElm.showModal) {
      const $dialogTitle = $('#infoDialog #dialogTitle');
      $rootContainer.addClass('fakeDialog');
      infoDialogElm.showModal = function (title, description = _$infoDialog_defaultDescription) {
        $body.addClass('fakeDialogVisible');
        $dialogTitle.empty();
        if (title.keyText) {
          $dialogTitle.append($(title));
        }
        else {
          $dialogTitle.text(title);
        }
        $contentContainer.prop('title', description);
        $body.scrollTop($contentContainer.$contentDom.prevScrollTop || 0);
      };
      infoDialogElm.close = function () {
        $contentContainer.$contentDom.prevScrollTop = $body.scrollTop();
        $body.removeClass('fakeDialogVisible');
        $contentContainer.prop('title', '');
        document.body.scrollIntoView(); // reset vertical scroll position.
        renderGlyph(currentGlyphData);
      };
    }

    const $smuflGlyphInfoText = $('#smuflGlyphInfoText');
    const $alternatesInfo = $('#alternatesInfo');
    const $classesInfo = $('#classesInfo');
    const $rangeInfo = $('#rangeInfo');
    const $ligaturesInfo = $('#ligaturesInfo');
    const $setsInfo = $('#setsInfo');

    const $rangeSelect = $('#rangeSelect');
    let $rangeSelect_selectize;


    function getCodepoint() {
      return $codepointSelect.val();
    }

    function formatCodepointNumber(codepointNumber) {
      let str = 'NaN';
      if (isNaN(codepointNumber)) {
        return str;
      }

      str = codepointNumber.toString(16).toUpperCase();
      return str.padStart(4, '0');
    }

    function getCodepointNumber(cpStr) {
      return Number('0x' + (cpStr || getCodepoint()), 16);
    }

    function setCodepointByNumber(codepointNumber) {
      setCodepointByString(formatCodepointNumber(codepointNumber));
    }

    function appendCodepoint($c, uCodepointStr, currentUCodepoint) {
      let currentGlyph = '';
      if (uCodepointStr && (uCodepointStr === currentUCodepoint)) {
        currentGlyph = ' currentGlyph';
      }
      $c.append($(`<span class="smuflCodepoint${currentGlyph}">${uCodepointStr}</span>`));
    }

    function appendCodepointOrText($c, uCodepointStr, currentUCodepoint) {
      if (uCodepointStr.startsWith && uCodepointStr.startsWith('U+')) {
        appendCodepoint($c, uCodepointStr, currentUCodepoint);
      }
      else {
        _$c_appendText($c, uCodepointStr);
      }
    }

    function appendAlternateCodepointFors($c, uCodepointStr) {
      const fontInfo = sMuFLMetadata.getFontInfo();
      if (!fontInfo) {
        return;
      }

      const alternateCodepointFors = fontInfo.alternateCodepointFors;
      if (!alternateCodepointFors) {
        return;
      }

      const glyphs = alternateCodepointFors[uCodepointStr];
      if (!glyphs || !glyphs.length) {
        return;
      }

      _$c_appendText($c, ' is alternateCodepoint for:');


      glyphs.forEach(function (glyph) {
        _$c_appendText($c, '\n  codepoint: ');
        const option = { searchOptional: true };
        const tUCodepoint = sMuFLMetadata.glyphname2uCodepoint(glyph.glyphname, option);
        appendCodepoint($c, tUCodepoint);
        _$c_appendText($c, `, name: `);
        appendGlyphname($c, glyph.glyphname);
      });

    }

    function appendGlyphname($c, glyphname, currentGlyphName, uCodepoint, showUCodepoint) {
      const option = { searchOptional: true };
      let tUCodepoint = sMuFLMetadata.glyphname2uCodepoint(glyphname, option);
      if ((uCodepoint || tUCodepoint) !== tUCodepoint) {
        //console.error(`fixme: ${(uCodepoint || tUCodepoint)} !== ${tUCodepoint}`);
        if (uCodepoint) {
          tUCodepoint = uCodepoint;
        }
      }
      uCodepoint = tUCodepoint;
      let charStr;
      if (uCodepoint) {
        charStr = sMuFLMetadata.uCodepoint2CharString(uCodepoint);
      }
      const nCodepoint = sMuFLMetadata.uCodepoint2Codepoint(uCodepoint);

      const $uCodepoint = showUCodepoint ?
        `<span class="uCodepoint">(${uCodepoint})</span> `: '';
      const $t = $(`${$uCodepoint}<span class="smuflGlyphname">${glyphname || '?'}:<span class="smufl">${charStr}</span></span>`);
      if (option.isOptionalGlyph) {
        $t.addClass('optionalGlyph');
      }
      if (option.isUnknownOptionalGlyph) {
        if (0xF400 <= nCodepoint && nCodepoint <= 0xFFFF) {
          $t.addClass('unknownOptionalGlyph');
        }
      }
      const tGlyphname = glyphname || uCodepoint;
      if (tGlyphname && currentGlyphName === tGlyphname) {
        $t.addClass('currentGlyph');
      }

      $t.prop('uCodepoint', uCodepoint);
      $c.append($t);

      return {
        uCodepoint: uCodepoint
      };
    }

    const history = {
      prevUCodepoint: undefined,
      currentUCodepoint: undefined
    };

    $('#BShowPrev').on('click', function () {
      selectCodepointByString(history.prevUCodepoint || $codepointSelect.val());
    });

    function setCodepointByString(codepointStr) {
      if (!(codepointStr || '').length) {
        return;
      }
      history.prevUCodepoint = history.currentUCodepoint;
      $codepointSelect.val(codepointStr);
      history.currentUCodepoint = getCodepoint();
      if (rosgCpSelect && rosgCpSelect.$codepointSelect_selectize) {
        rosgCpSelect.$codepointSelect_selectize.setValue(history.currentUCodepoint,
          true /*silent: no changed event*/);
      }
      _postDraw();
    }

    $('#smuflGlyphHints').on('change', function (ev) {
      const target = ev.target;
      if (target._on3StateChange) {
        target._on3StateChange();
      }

      //console.log(this);
      renderGlyph(currentGlyphData);
    });

    $('body').keyup(function (ev) {
      // console.log(ev);
      // On the osx platform(safar, chrome, FX) 'command + key'
      // keyup events are not fired.
      // check metaKey for 'windows key'.
      if (ev.ctrlKey || ev.altKey || ev.metaKey) {
        return;
      }
      if (ev.target.nodeName === 'INPUT') {
        if (ev.target.type === 'text') {
          return;
        }
      }
      if (ev.target.nodeName === 'SELECT' ||
        ev.target.nodeName === 'TEXTAREA') {
        return;
      }
      switch (ev.key) {
        case 'w':
          //case 'Escape':
          if ($body.hasClass('fakeDialogVisible')) {
            $infoDialog_closeButton.click();
          }
          break;
        case 'g':
          window.setTimeout(function () {
            $('#BGlyphnames').focus();
          });
          break;
        case 'k':
          $('#BPrevGlyph').click();
          break;
        case 'h':
          $('#BPrev').click();
          break;
        case 'l':
          $('#BNext').click();
          break;
        case 'p':
          $('#BShowPrev').click();
          break;
        case 'c':
          window.setTimeout(function () {
            $codepointSelect_selectize.focus();
          });
          break;
        case 'j':
          $('#BNextGlyph').click();
          break;
        case 'r':
          window.setTimeout(function () {
            $rangeSelect_selectize.focus();
          });
          break;
      }
    });

    $('body').on('click', function (ev) {
      // console.log(this);
      const targetElm = ev.target;
      function _closeDialog() {
        const dialog = targetElm.closest('#infoDialog');
        if (dialog) {
          dialog.close();
        }
      }
      if (targetElm.classList.contains('smuflCodepoint')) {
        _closeDialog();
        window.setTimeout(function () {
          selectCodepointByString(targetElm.textContent.slice(2));
        });
      }
      if (!targetElm.closest('#smuflGlyphInfoText')) {
        if (targetElm.classList.contains('smuflGlyphname')) {
          let uCodepoint = targetElm.uCodepoint;
          if (uCodepoint) {
            _closeDialog();
            selectCodepointByString(uCodepoint.slice(2));
          }
        }
      }
    });

    function selectCodepointByString(cp) {
      cp = $codepointSelect_selectize.addCodePointItem(cp).value;
      $codepointSelect_selectize.setValue(cp);
    }

    function selectCodepointByNumber(cp) {
      selectCodepointByString(formatCodepointNumber(cp));
    }

    function seekToCodepoint(cpNumber, d, checkHasGlyph) {
      const fontInfo = sMuFLMetadata.getFontInfo();
      let glyphsByUCodepoint;
      if (fontInfo) {
        glyphsByUCodepoint = fontInfo.glyphsByUCodepoint;
      }

      let codepointStr;
      while ((cpNumber += d) >= 0 && cpNumber < 0x10FFFF & !codepointStr) {
        const tCodepointStr = formatCodepointNumber(cpNumber);
        if (checkHasGlyph && glyphsByUCodepoint) {
          if (glyphsByUCodepoint[sMuFLMetadata.ensureUCodepoint(tCodepointStr)]) {
            codepointStr = tCodepointStr;
          }
        }
        else {
          codepointStr = tCodepointStr;
        }
      }
      if (codepointStr) {
        selectCodepointByString(codepointStr);
      }
    }

    $('#BPrev').on('click', function () {
      seekToCodepoint(getCodepointNumber(), -1, false);
    });
    $('#BNext').on('click', function () {
      seekToCodepoint(getCodepointNumber(), 1, false);
    });

    $('#BPrevGlyph').on('click', function () {
      seekToCodepoint(getCodepointNumber(), -1, true);
    });
    $('#BNextGlyph').on('click', function () {
      seekToCodepoint(getCodepointNumber(), 1, true);
    });

    function addGlyphnameInfo($contentContainer, ginfo, glyphname) {
      _$c_appendText($contentContainer, `${ginfo.codepoint}: `);
      appendGlyphname($contentContainer, glyphname); // here, no current glyph.
      _$c_appendText($contentContainer, `, ${ginfo.description || ''}: `);
      if (ginfo.alternateCodepoint) {
        _$c_appendText($contentContainer, `, alternateCodepoint: ${ginfo.alternateCodepoint}: `);
      }
      $contentContainer.append($('<br>'));
    }

    const $aStatickLink = $('#AStaticLink');
    const $aUULink = $('#AUULink');

    const _$infoDialog_contentDoms = {};
    function _$infoDialog_showModal(keyIn, func) {
      const key = keyIn.keyText || keyIn;
      let $contentDom = _$infoDialog_contentDoms[key];
      if (!$contentDom) {
        $contentDom = _$infoDialog_contentDoms[key] = $('<div class="infoDialogContents"></div>');
        func($contentDom);
      }
      const contentDomElm = $contentDom.get(0);
      $contentContainer.empty();
      $contentContainer.append($contentDom);
      $contentContainer.$contentDom = $contentDom;
      if ($contentDom.onAttachedToDom) {
        $contentDom.onAttachedToDom();
      }

      $infoDialog.get(0).showModal(keyIn);

      if (contentDomElm.dlRepaint) {
        window.setTimeout(function () {
          contentDomElm.dlRepaint();
        });
      }
    }

    function mkSpecLinkDom(doms, text, filenames) {
      filenames = filenames || [text];
      const ret = document.createElement('div');
      const textDom = document.createElement('div');
      textDom.textContent = text;
      ret.appendChild(textDom);
      filenames.forEach(function(filename) {
        const aDom = document.createElement('a');
        aDom.classList.add('specLink');
        aDom.href = `https://w3c.github.io/smufl/latest/specification/${filename}.html`;
        aDom.text = filename;
        aDom.target = `_smuflfontvierer_${filename}_`;
        aDom.title = `${filename} spec`;
        ret.appendChild(aDom);
      });
      ret.keyText = text;
      doms[ret.keyText] = ret;
      return ret;
    }

    const specLinkDoms = {};
    mkSpecLinkDom(specLinkDoms, 'glyphnames');
    mkSpecLinkDom(specLinkDoms, 'font metadata optionalGlyphs',['optionalglyphs']);
    mkSpecLinkDom(specLinkDoms, 'font metadata', ['font-specific-metadata', 'engravingdefaults']);
    mkSpecLinkDom(specLinkDoms, 'font metadata ligatures', ['ligatures']);
    mkSpecLinkDom(specLinkDoms, 'font metadata sets', ['sets']);
    mkSpecLinkDom(specLinkDoms, 'ranges');
    mkSpecLinkDom(specLinkDoms, 'classes');
    mkSpecLinkDom(specLinkDoms, 'font metadata glyphsWithAlternates', ['glyphswithalternates']);
    mkSpecLinkDom(specLinkDoms, 'font metadata glyphsWithAnchors', ['glyphswithanchors']);

    $('#BGlyphnames').on('click', function () {
      _$infoDialog_showModal(specLinkDoms.glyphnames, function($contentContainer) {
        const glyphnames = sMuFLMetadata.data.glyphnames;
        try {
          for (const key in glyphnames) {
            addGlyphnameInfo($contentContainer, glyphnames[key], key);
          }
        } catch (e) {
          console.log(e);
        }
        return $contentContainer;
      });
    });

    $('#BOptionalGlyphs').on('click', function () {
      _$infoDialog_showModal(specLinkDoms['font metadata optionalGlyphs'],
      function ($contentContainer) {
        const optionalGlyphs = sMuFLMetadata.fontMetadata().optionalGlyphs;
        if (!optionalGlyphs) {
          return;
        }
        for (const key in optionalGlyphs) {
          addGlyphnameInfo($contentContainer, optionalGlyphs[key], key);
        }
      });
    });

    $('#BFontMetadata').on('click', function () {
      _$infoDialog_showModal(specLinkDoms['font metadata'], function($contentContainer) {
        function add_engravingDefaults(name, engravingDefaults) {
          _$c_appendText($contentContainer, `${name}: `);
          const $tdContaienr = $('<div class="engravingDefaultsContainer"></div>');
          for (const key in engravingDefaults) {
            _$c_appendText($tdContaienr, `${key}: ${engravingDefaults[key]}, `);
          }
          $contentContainer.append($tdContaienr);
        }

        // eslint-disable-next-line no-unused-vars
        function add_sets(name, sets) {
          const setsKeys = Object.keys(sMuFLMetadata.fontMetadata().sets);
          _$c_appendText($contentContainer, `${name}: ${setsKeys.length ? setsKeys.join(', ') : 'none'
            }`);
        }

        const urls = sMuFLMetadata.urls;
        const $urlsContainer = $('<div class="fontMetadataUrlsContainer"></div>');

        function _addUrl(key, val) {
          const $d = $(`<div>${key}: <a></a></div>`);
          const $a = $d.children('a');
          $a.prop('href', val);
          $a.text(val);
          $urlsContainer.append($d);
          _$c_appendText($urlsContainer, `\n`);
        }

        _addUrl('fontUrl', that.fontFace.fontUrl);
        for (const key in urls) {
          _addUrl(key, urls[key]);
        }
        $contentContainer.append($urlsContainer);

        const fontMetadata = sMuFLMetadata.fontMetadata();
        for (const key in fontMetadata) {
          let addBr = true;
          switch (key) {
            case 'fontName':
            case 'fontVersion':
              _$c_appendText($contentContainer, `${key}: ${fontMetadata[key]}`);
              break;
            case 'engravingDefaults':
              add_engravingDefaults(key, fontMetadata[key]);
              addBr = false;
              break;
            case 'glyphBBoxes':
            case 'glyphsWithAlternates':
            case 'glyphsWithAnchors':
            case 'ligatures':
            case 'optionalGlyphs':
              _$c_appendText($contentContainer, `${key}: ...`);
              break;
            case 'glyphAdvanceWidths':
              _$c_appendText($contentContainer, `${key}: FIXME:...`);
              break;
            case 'sets':
              add_sets(key, fontMetadata[key]);
              break;
            default:
              _$c_appendText($contentContainer, `${key}: unsupported property.`);
              break;
          }
          if (addBr) {
            $contentContainer.append($('<br>'));
          }
        }

        const $ssOptionsGlyphSizeContainer =
          $contentContainer.append($(`
        <div id='ssOptionsGlyphSizeContainer'>
          <label>glyph size: <input id="ssOptionsGlyphSize"
              type="range" min="40" max="250" value="40"><span><span></label>
        </div>`));

        const $ssOptionsGlyphSize = $ssOptionsGlyphSizeContainer.find('label input');

        $contentContainer.onAttachedToDom = function () {
          $ssOptionsGlyphSize.off('input.ssUI');
          $ssOptionsGlyphSize.off('input.ssUI');

          $ssOptionsGlyphSize.on('input.ssUI', function () {
            this.nextElementSibling.textContent = this.value;
          });
          $ssOptionsGlyphSize.trigger('input');

          $ssOptionsGlyphSize.on('input.ssUI', function () {
            drawSs();
          });
        };

        const $gmCanvas = $('<canvas id="gm_canvas"></canvas>');
        $contentContainer.append($gmCanvas);
        const drawSs = function () {
          const gmCanvasElm = $gmCanvas.get(0);

          // canvas is cleared by resize.
          gmCanvasElm.width = gmCanvasElm.clientWidth;
          gmCanvasElm.height = gmCanvasElm.clientHeight;

          that.sSRenderer.draw(gmCanvasElm.getContext('2d'), {
            ssOptionsGlyphSize: Number($ssOptionsGlyphSize.val()),
            _measureGlyph: _measureGlyph,
            _renderGlyph: _renderGlyph,
            _getGlyphData: _getGlyphData,
            _renderCross: _renderCross,
            _anchorCsToScreenCs: _anchorCsToScreenCs,
            _getAnchor: function (glyphname, anchorName) {
              let anchors = sMuFLMetadata.fontMetadata().glyphsWithAnchors;
              anchors = anchors ? anchors[glyphname] : undefined;
              return anchors ? anchors[anchorName] : undefined;
            }
          });
        };
        that.resizeHandlers.push(drawSs);
        $contentContainer.get(0).dlRepaint = drawSs;
      });
    });

    function addLigatureInfo($ligaturesInfo, label, ligature, glyphname) {
      if (ligature) {
        if (label) {
          _$c_appendText($ligaturesInfo, label);
        }
        appendGlyphname($ligaturesInfo, glyphname, undefined, undefined, true);
        _$c_appendText($ligaturesInfo, '\ndescription: ');
        _$c_appendText($ligaturesInfo, (ligature.description || '') + '\n');
        if (ligature.componentGlyphs) {
          _$c_appendText($ligaturesInfo, 'componentGlyphs:\n');
          const $glyphsContainer = $('<div class="glyphsContainer"></div>');
          $ligaturesInfo.append($glyphsContainer);
          ligature.componentGlyphs.forEach(function (tGlyphname) {
            appendGlyphname($glyphsContainer, tGlyphname, glyphname, undefined, true);
            _$c_appendText($glyphsContainer, ', ');
          });
        }
      }
    }

    $('#BFontMetadataLigatures').on('click', function () {
      _$infoDialog_showModal(specLinkDoms['font metadata ligatures'], function ($contentContainer) {
        try {
          const ligatures = sMuFLMetadata.getFontInfo().fontMetadata.ligatures;
          Object.keys(ligatures).forEach(function (glyphname) {
            const $ligaturesInfo = $(`<div class="ligatureContainer glyphContainer"></div>`);
            $contentContainer.append($ligaturesInfo);
            addLigatureInfo($ligaturesInfo, undefined, ligatures[glyphname], glyphname);
          });
        } catch (e) {
          console.log(e);
        }
      });
    });

    function _createAnyListPage($contentContainer, listName, dict,
      addItemFunc, getGlyphsFunc, addGlyphFunc) {
      function _hrefId(hrefName) {
        return listName + 'Container_' + hrefName;
      }

      function _addLink($c, hrefName, clazz) {
        const disabled = hrefName ? false : true;
        if (disabled) {
          hrefName = '....';
        }
        if (disabled) {
          $c.append($(`<span class=${clazz}>${hrefName}</span> `));
        }
        else {
          $c.append($(`<a class=${clazz} href="#${_hrefId(hrefName)}">${hrefName}</a> `));
        }
      }

      try {
        const dictKeys = Object.keys(dict);
        if (!dictKeys.length) {
          _$c_appendText($contentContainer, `no ${listName} items`);
          return;
        }
        dictKeys.forEach(function (itemName, idx, items) {
          const item = dict[itemName];
          const id = _hrefId(itemName);
          const $itemContainer = $(`<div class="${listName}Container" id="${id}"></div>`);
          $contentContainer.append($itemContainer);
          _$c_appendText($itemContainer, `${itemName}: `);
          _addLink($itemContainer, items[idx - 1], 'linkToPrev');
          _addLink($itemContainer, items[idx + 1], 'linkToNext');
          _$c_appendText($itemContainer, `\n`);
          addItemFunc($itemContainer, item);
          const glyphs = getGlyphsFunc(item);
          glyphs.forEach(function (glyph) {
            const $glyphContainer = $('<div class="glyphContainer"></div>');
            addGlyphFunc($glyphContainer, glyph);
            $itemContainer.append($glyphContainer);
          });
        });
      } catch (e) {
        console.log(e);
      }
    }

    $('#BFontMetadataSets').on('click', function () {
      _$infoDialog_showModal(specLinkDoms['font metadata sets'], function ($contentContainer) {
        _createAnyListPage($contentContainer, 'set',
          sMuFLMetadata.getFontInfo().fontMetadata.sets,
          //addItemFunc
          ($itemContainer, item) => {
            _$c_appendText($itemContainer, `description: ${item.description}: \n`);
            _$c_appendText($itemContainer, `type: ${item.type}: \n`);
          },
          // getGlyphsFunc
          (item) => {
            return item.glyphs;
          },
          // addGlyphFunc
          ($glyphContainer, glyph) => {
            _$c_appendText($glyphContainer, `description: ${glyph.description}\n`);
            appendCodepointOrText($glyphContainer, glyph.codepoint);
            _$c_appendText($glyphContainer, ', ');
            appendGlyphname($glyphContainer, glyph.name);
            _$c_appendText($glyphContainer, ', alternateFor: ');
            appendGlyphname($glyphContainer, glyph.alternateFor, undefined, undefined, true);
          });
      });
    });

    $('#BRanges').on('click', function () {
      _$infoDialog_showModal(specLinkDoms.ranges, function ($contentContainer) {
        _createAnyListPage($contentContainer, 'range',
          sMuFLMetadata.data.ranges,
          //addItemFunc
          ($itemContainer, item) => {
            _$c_appendText($itemContainer, `range_start: ${item.range_start}, `);
            _$c_appendText($itemContainer, `range_end: ${item.range_end}: \n`);
            _$c_appendText($itemContainer, `description: ${item.description}: \n`);
          },
          // getGlyphsFunc
          (item) => {
            return item.glyphs;
          },
          // addGlyphFunc
          ($glyphContainer, glyphName) => {
            appendGlyphname($glyphContainer, glyphName, undefined, undefined, true);
          });
      });
    });

    $('#BClasses').on('click', function () {
      _$infoDialog_showModal(specLinkDoms.classes, function ($contentContainer) {

        _createAnyListPage($contentContainer, 'class',
          sMuFLMetadata.getFontInfo().computedClasses.classes,
          //addItemFunc
          ($itemContainer, item) => {
          },
          // getGlyphsFunc
          (item) => {
            return item;
          },
          // addGlyphFunc
          ($glyphContainer, glyphName) => {
            appendGlyphname($glyphContainer, glyphName, undefined, undefined, true);
          });
      });
    });


    function addAlternatesInfo($alternatesInfo, alternates, baseGlyphname, glyphname, currentUCodepoint) {
      if (alternates && alternates.alternates) {
        _$c_appendText($alternatesInfo, 'alternates: ');
        appendGlyphname($alternatesInfo, baseGlyphname, glyphname, undefined, true);
        _$c_appendText($alternatesInfo, '\n');
        alternates.alternates.forEach(function (v) {
          _$c_appendText($alternatesInfo, 'codepoint: ');
          appendCodepoint($alternatesInfo, v.codepoint, currentUCodepoint);
          _$c_appendText($alternatesInfo, `, name: `);
          appendGlyphname($alternatesInfo, v.name, glyphname, v.codepoint);
          _$c_appendText($alternatesInfo, `\n`);
        });
      }
    }

    $('#BFontMetadataGlyphsWithAlternates').on('click', function () {
      _$infoDialog_showModal(specLinkDoms['font metadata glyphsWithAlternates'], function ($contentContainer) {
        try {
          const gwAlternates = sMuFLMetadata.fontMetadata().glyphsWithAlternates;
          for (const akey in gwAlternates) {
            const alternates = gwAlternates[akey];
            const $gwaContainer = $(`<div class="gwalternatesContainer glyphContainer"></div>`);
            $contentContainer.append($gwaContainer);
            addAlternatesInfo($gwaContainer, alternates, akey);
          }
        } catch (e) {
          console.log(e);
        }
      });
    });

    $('#BFontMetadataGlyphsWithAnchors').on('click', function () {
      _$infoDialog_showModal(specLinkDoms['font metadata glyphsWithAnchors'], function ($contentContainer) {
        try {
          const glyphsWithAnchors = sMuFLMetadata.getFontInfo().fontMetadata.glyphsWithAnchors;
          Object.keys(glyphsWithAnchors).forEach(function (glyphname) {
            const glyph = glyphsWithAnchors[glyphname];
            const $gwaContainer = $(`<div class="gwanchorsContainer"></div>`);
            $contentContainer.append($gwaContainer);
            const $glyphContainer = $('<div class="glyphContainer"></div>');
            appendGlyphname($glyphContainer, glyphname, undefined, undefined, true);
            const $nbsp = '&nbsp;';
            $glyphContainer.append($nbsp);
            _$c_appendText($glyphContainer, Object.keys(glyph).join(', '));
            $gwaContainer.append($glyphContainer);
          });
        } catch (e) {
          console.log(e);
        }
      });
    });

    $('#BCCStaticLink').on('click', function () {
      const key = 'static link';
      _$infoDialog_showModal(key, function ($contentContainer) {
        try {
          const $stlinkContainer = $(`<div class="stlinkContainer"></div>`);
          $contentContainer.append($stlinkContainer);

          const $urlText = $(`<textarea class="urlText" readonly title=""></textarea>`);
          $stlinkContainer.append($urlText);
          $contentContainer.$urlText = $urlText;

          const $msgText = $(`<div class="msgText">URL copied to clipboard.</div>`);
          $stlinkContainer.append($msgText);
        } catch (e) {
          console.log(e);
        }
      });

      const $dom = _$infoDialog_contentDoms[key];
      $dom.$urlText.text($aStatickLink.prop('href'));
      $dom.$urlText.select();
      document.execCommand('copy');
    });

    $infoDialog_closeButton.on('click', function () {
      $infoDialog.get(0).close();
      $contentContainer.empty();
    });

    let aStaticLinkTitle;
    function updateStatickLink() {
      aStaticLinkTitle = aStaticLinkTitle || $aStatickLink.prop('title');
      const params = new URLSearchParams(window.location.search);
      params.set('glyph', $codepointSelect.val());
      params.delete('showFontMetadata');

      var t = new URL('./app.html', location);
      params.forEach((value, key) => {
        t.searchParams.set(key, value);
      });

      if ($smuflGlyphHints_cutOutOrigin_BBL.prop('checked')) {
        t.searchParams.set('settings.cutOutOrigin_BBL', true);
      }
      else {
        t.searchParams.delete('settings.cutOutOrigin_BBL');
      }
      $aStatickLink.prop('href', t.href);
      $aStatickLink.prop('title', `${aStaticLinkTitle}: ${params.get('glyph')}`);
    }

    let aUULinkTitle;
    function updateUUkLink() {
      aUULinkTitle = aUULinkTitle || $aUULink.prop('title');
      const params = new URLSearchParams();
      params.set('a', $codepointSelect.val());

      var t = new URL('https://util.unicode.org/UnicodeJsps/character.jsp');
      params.forEach((value, key) => {
        t.searchParams.set(key, value);
      });

      $aUULink.prop('href', t.href);
      $aUULink.prop('title', `${aUULinkTitle}: ${params.get('a')}`);
    }

    function anchorCsToScreenCsY(val, sbl) {
      return val * sbl * -1;
    }

    function anchorCsToScreenCsX(val, sbl) {
      return val * sbl;
    }

    function _anchorCsToScreenCs(scaledBBox, anchor, sbl, relativeToBBL) {
      return {
        x: (relativeToBBL ? scaledBBox.W : scaledBBox.x) + anchorCsToScreenCsX(Number(anchor[0]), sbl),
        y: (relativeToBBL ? scaledBBox.S : scaledBBox.y) + anchorCsToScreenCsY(Number(anchor[1]), sbl)
      };
    }

    function renderAnchor(akey, anchor, types, scaledBBox, engravingDefaults, isIndeterminate, bbs) {
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
      const isCutOutOriginBBL = $smuflGlyphHints_cutOutOrigin_BBL.prop('checked');
      let vals = _anchorCsToScreenCs(scaledBBox, anchor, sbl,
        isCutOut && isCutOutOriginBBL);

      // eslint-disable-next-line no-unused-vars
      let halign = 'L';
      let vdir = 'TTB';
      types.forEach(function (type) {
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
        if (isCutOutOriginBBL) {
          ctx.fillStyle = '#ccccd5cc';
        }
        else {
          ctx.fillStyle = '#cccccccc';
        }
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#44aaffcc';
        _renderCross(vals.x, vals.y);
      }
      else if (akey.startsWith('splitStem') || akey.startsWith('stem') ||
        akey.startsWith('numeral') || akey.startsWith('graceNoteSlash') || akey === 'repeatOffset' ||
        akey === 'noteheadOrigin' || akey === 'opticalCenter') {
        x = vals.x;
        y = vals.y;

        if (!isIndeterminate) {
          if ((akey.startsWith('splitStem') || akey.startsWith('stem'))) {
            _renderStem(x, y,
              Math.max(scaledBBox.h, anchorCsToScreenCsX(3.5, sbl)),
              halign, vdir, sbl, engravingDefaults, akey.startsWith('splitStem'), scaledBBox, akey, bbs[akey]);
          }
          else if (akey.startsWith('numeral')) {
            _renderNumeral(x, y, sbl, bbs[akey]);
          }
          else if (akey === 'opticalCenter') {
            _renderSampleNoteheadAlignToOpticalCenter(x, y, scaledBBox, engravingDefaults, bbs[akey]);
          }
          else if (akey === 'noteheadOrigin') {
            _renderSampleNoteheadAlignToNoteheadOrigin(x, y, scaledBBox, engravingDefaults, bbs[akey]);
          }
        }

        ctx.fillStyle = '#ff4444cc';
        if (akey.startsWith('stem')) {
          ctx.fillStyle = '#4444ffcc';
        }
        _renderCross(x, y);
      }
      ctx.restore();
    }

    const anchorDefs = {
      splitStemUpSE: undefined,
      splitStemUpSW: undefined,
      splitStemDownNE: undefined,
      splitStemDownNW: undefined,
      stemUpSE: undefined,
      stemDownNW: undefined,
      stemUpNW: undefined,
      stemDownSW: undefined,
      nominalWidth: undefined,
      numeralTop: undefined,
      numeralBottom: undefined,
      cutOutNE: undefined,
      cutOutSE: undefined,
      cutOutSW: undefined,
      cutOutNW: undefined,
      graceNoteSlashSW: undefined,
      graceNoteSlashNE: undefined,
      graceNoteSlashNW: undefined,
      graceNoteSlashSE: undefined,
      repeatOffset: undefined,
      noteheadOrigin: undefined,
      opticalCenter: undefined
    };

    function _setValValue($valSibling, obj) {
      const text = obj ? ': ' + JSON.stringify(obj) : '';
      $valSibling.parent().find('.val').text(text);
    }

    function _renderStemEx(nhScaledBBox, w, endY, bb, stemAnchorName) {
      const stemAnchor = bb.glyphData.anchor[stemAnchorName];
      const stemAttachmentPos = _anchorCsToScreenCs(nhScaledBBox, stemAnchor, nhScaledBBox.sbl);

      const x = stemAttachmentPos.x - (w * 0.5 * (stemAnchorName.endsWith('NW') ? -1 : 1));
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
      L_TTB: 'stemDownNW'
    };

    function _renderAllteredUnison(halign, vdir, w, nhScaledBBox, bb) {
      ctx.save();
      ctx.strokeStyle = '#aaaaaa';
      ctx.fillStyle = '#aaaaaa';

      const angd = _getGlyphData('accidentalNatural');
      const anm = _measureGlyph(angd, 0, 0, nhScaledBBox.sbl);

      const afgd = _getGlyphData('accidentalFlat');
      const afm = _measureGlyph(afgd, 0, 0, nhScaledBBox.sbl);

      const paddingX = (nhScaledBBox.sbl * 0.4);
      const accidentalPaddingX = (nhScaledBBox.sbl * 0.15);

      let nh1X = nhScaledBBox.x;

      if (halign === 'R') {
        // n ap [nh1 p b ap] nh0
        nh1X -= (afm.scaledBBox.w + nhScaledBBox.w + (paddingX + accidentalPaddingX));
      }
      else {
        // b ap [nh0 p n ap nh1]
        nh1X += (nhScaledBBox.w + anm.scaledBBox.w + (paddingX + accidentalPaddingX));
      }

      _renderGlyph(bb.glyphData, nh1X, nhScaledBBox.y, bb.fontSizeInfo.fontSize);
      const m = _measureGlyph(bb.glyphData, nh1X, nhScaledBBox.y, nhScaledBBox.sbl);

      _renderGlyph(angd, m.scaledBBox.x - anm.scaledBBox.w - accidentalPaddingX,
        m.scaledBBox.y, bb.fontSizeInfo.fontSize);

      _renderGlyph(afgd, nhScaledBBox.x - afm.scaledBBox.w - accidentalPaddingX,
        nhScaledBBox.y, bb.fontSizeInfo.fontSize);

      // console.log(vdir, halign, w);
      const stemAnchorName = stemAnchorNamesByHV[`${halign}_${vdir}`];
      const stemLen = (m.scaledBBox.sbl * 4 * (vdir === 'BTT' ? 1 : -1));
      const stemEndY = m.scaledBBox.y - stemLen;
      const stemX = _renderStemEx(m.scaledBBox, Math.abs(w), stemEndY, bb, stemAnchorName);
      ctx.restore();

      return {
        nhMetrics: m,
        stemAttachmentY: stemEndY + (stemLen / 4),
        stemAttachmentX: stemX
      };
    }

    function _renderStem(x, y, h, halign, vdir, sbl, engravingDefaults, isSplitStem, nhScaledBBox, akey, bb) {
      let w = anchorCsToScreenCsX(engravingDefaults.stemThickness, sbl);
      let rad = 0;

      if (isSplitStem) {
        const auInfo = _renderAllteredUnison(halign, vdir, w, nhScaledBBox, bb);
        // https://steinberg.help/dorico/v2/en/_shared_picts/picts/dorico/notation_reference/accidentals_altered_unison_tree.png
        // https://www.steinberg.net/forums/download/file.php?id=16781
        const dw = auInfo.stemAttachmentX - x - ((w * 0.5) * (halign === 'L' ? 1 : -1));
        const dh = auInfo.stemAttachmentY - y;
        rad = Math.atan2(dw, dh) * -1;
        h = Math.sqrt((dw * dw) + (dh * dh));
        if ((vdir === 'BTT' && halign === 'L') ||
          (vdir === 'TTB' && halign === 'R')) {
          w *= -1;
        }
      }
      else {
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
      const cm = ctx.getTransform();
      ctx.restore();
    }

    function _renderGraceNoteSlash(bbs, engravingDefaults, sbl) {
      const slashBbs = [
        [bbs.graceNoteSlashSW, bbs.graceNoteSlashNE],
        [bbs.graceNoteSlashSE, bbs.graceNoteSlashNW]
      ];

      // finale26: grace note slash thickness is similar to stem thickness:
      //   https://user-images.githubusercontent.com/59550999/73713729-c8805c80-4751-11ea-962f-609ff4039acb.png
      // FIXME: graceNoteSlash thichness: any smufl property for this?
      const w = anchorCsToScreenCsX(engravingDefaults.stemThickness, sbl) * 1.1;
      slashBbs.forEach(function (sbb) {
        if (sbb[0] && sbb[1] && (!sbb[0].isIndeterminate || !sbb[1].isIndeterminate)) {
          ctx.save();
          ctx.lineWidth = w;
          ctx.strokeStyle = '#aaaaaacc';
          ctx.beginPath();
          ctx.moveTo(sbb[0].vals.x, sbb[0].vals.y);
          ctx.lineTo(sbb[1].vals.x, sbb[1].vals.y);
          ctx.stroke();
          ctx.restore();
        }
      });
    }

    function _renderCross(x, y, crossSize = 10, tCtx = ctx) {
      tCtx.fillRect(x - (crossSize * 0.5), y - 0.5, crossSize, 1);
      tCtx.fillRect(x - 0.5, y - crossSize * 0.5, 1, crossSize);
    }

    function _renderNumeral(x, y, sbl, bb) {
      const glyphData = _getGlyphData('tuplet5');
      const m = _measureGlyph(glyphData, x, y, sbl);
      let ox = x - (m.scaledBBox.W);
      const hw = m.scaledBBox.w * 0.5;
      let oy = 0; // no y offset for baseline.

      ctx.fillStyle = '#aaaaaacc';
      _renderGlyph(glyphData, x + ox - hw, y + oy, bb.fontSizeInfo.fontSize);

      // hori: center of bbox.
      // vert: baseline
      ctx.fillStyle = '#0000ffff';
      _renderCross(m.scaledBBox.W + ox - hw + hw, y + oy);
    }

    function _renderSampleNoteheadAlignToOpticalCenter(ocX, ocY, ocScaledBBox, engravingDefaults, bb) {
      const glyphData = _getGlyphData('noteheadWhole');
      const m = _measureGlyph(glyphData, 0, 0, ocScaledBBox.sbl);

      ctx.save();
      ctx.fillStyle = '#aaaaaaaa';
      const nhY = ocScaledBBox.y - (ocScaledBBox.sbl * 3.5);
      _renderGlyph(glyphData, ocX - (m.scaledBBox.w * 0.5), nhY, bb.fontSizeInfo.fontSize);
      ctx.lineWidth = 1;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(ocX, nhY);
      ctx.lineTo(ocX, ocY);
      ctx.stroke();
      ctx.restore();
    }

    function _renderSampleNoteheadAlignToNoteheadOrigin(noX, noY, noScaledBBox, engravingDefaults, bb) {
      const glyphData = _getGlyphData('noteheadWhole');
      const m = _measureGlyph(glyphData, 0, 0, noScaledBBox.sbl);

      ctx.save();
      ctx.fillStyle = '#aaaaaaaa';
      const nhY = noScaledBBox.y - (noScaledBBox.sbl * 2);
      _renderGlyph(glyphData, noX, nhY, bb.fontSizeInfo.fontSize);
      ctx.lineWidth = 1;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(noX, nhY);
      ctx.lineTo(noX, noY);
      ctx.stroke();
      ctx.restore();
    }

    function _getFontSizeInfo() {
      const fontSize = Number($smuflRenderGlyphOptionsGlyphSize.val());
      const sbl = fontSize * 0.25;
      return {
        fontSize: fontSize,
        sbl: sbl
      };
    }

    function _renderGlyph(glyphData, x, y, fontSize, tctx = ctx) {
      tctx.font = fontSize + 'px SMuFLFont';
      const str = String.fromCodePoint(glyphData.codepoint);
      tctx.fillText(str, x, y);
    }

    function _measureGlyph(glyphData, x, y, sbl) {
      const glyphname = glyphData.glyphname;
      const bbox = sMuFLMetadata.fontMetadata().glyphBBoxes[glyphname];
      let scaledBBox;
      if (bbox) {
        if (bbox.bBoxNE && bbox.bBoxSW) {
          let E = anchorCsToScreenCsX(bbox.bBoxNE[0], sbl);
          let N = anchorCsToScreenCsY(bbox.bBoxNE[1], sbl);
          let W = anchorCsToScreenCsX(bbox.bBoxSW[0], sbl);
          let S = anchorCsToScreenCsY(bbox.bBoxSW[1], sbl);

          scaledBBox = {
            W: x + W,
            N: y + N,
            w: E - W,
            h: S - N,
            x: x,
            y: y,
            sbl: sbl
          };
          scaledBBox.E = scaledBBox.W + scaledBBox.w;
          scaledBBox.S = scaledBBox.N + scaledBBox.h;
        }
      }
      return {
        bbox: bbox,
        scaledBBox: scaledBBox
      };
    }

    function renderGlyph(glyphData) {
      const codepoint = glyphData.codepoint;
      const glyphname = glyphData.glyphname;
      const anchor = glyphData.anchor;
      const repeatOffset = anchor ? anchor.repeatOffset : undefined;
      const engravingDefaults = sMuFLMetadata.fontMetadata().engravingDefaults;
      const x = c.width * 0.5;
      const y = c.height * 0.5;

      ctx.clearRect(0, 0, c.clientWidth, c.clientHeight);

      const fontSizeInfo = _getFontSizeInfo();
      const fontSize = fontSizeInfo.fontSize;
      const sbl = fontSizeInfo.sbl;

      const slChecked = $smuflRenderGlyphOptionsSl.prop('checked');
      const slIndeterminate = $smuflRenderGlyphOptionsSl.prop('indeterminate');
      if (slChecked || slIndeterminate) {
        ctx.save();
        ctx.lineWidth = anchorCsToScreenCsX(engravingDefaults.staffLineThickness, sbl);
        const slY = y + (slChecked ? sbl * 0.5 : 0);
        for (let yi = -10; yi < 11; yi++) {
          ctx.beginPath();
          ctx.moveTo(0, slY + (sbl * yi));
          ctx.lineTo(c.width, slY + (sbl * yi));

          ctx.strokeStyle = ((yi % 4) === 0) ? '#aaaaaa' : '#cccccc';
          ctx.stroke();
        }
        ctx.restore();
      }

      const m = _measureGlyph(glyphData, x, y, sbl);
      const scaledBBox = m.scaledBBox;
      const bbox = m.bbox;

      ctx.fillStyle = '#444444cc';
      _renderGlyph(glyphData, x, y, fontSize);

      if (rosgCpSelect) {
        if ($(smuflGlyphHints_repatOffset3StateBoxElm).parent().is(':hidden')) {
          rosgCpSelect.$codepointSelect_selectize.$control.hide();
        } else {
          if (smuflGlyphHints_repatOffset3StateBoxElm._3state == 2) {
            rosgCpSelect.$codepointSelect_selectize.$control.show();
          } else {
            rosgCpSelect.$codepointSelect_selectize.$control.hide();
          }
        }
      }

      if ($smuflGlyphHints_repatOffset3StateBox.prop('checked')) {
        ctx.save();
        if (repeatOffset) {
          ctx.fillStyle = '#44444477';
          const tGlyphData = {
            codepoint: getCodepointNumber(rosgCpSelect.$codepointSelect.val()),
          };
          _renderGlyph(tGlyphData, x + (anchorCsToScreenCsX(repeatOffset[0], sbl)),
            y + (anchorCsToScreenCsY(repeatOffset[1], sbl)), fontSize);
        }
        ctx.restore();
      }

      ctx.save();

      if ($smuflRenderGlyphOptionsOrigin.prop('checked')) {
        ctx.fillStyle = 'orange';
        ctx.fillRect(x - 6, y - 0.5, 12, 1);
        ctx.fillRect(x - 0.5, y - 6, 1, 12);
      }

      if (bbox) {
        ctx.strokeStyle = 'green';
        if (bbox.bBoxNE && bbox.bBoxSW) {
          if ($smuflRenderGlyphOptionsBbox.prop('checked')) {
            ctx.strokeRect(scaledBBox.W, scaledBBox.N,
              scaledBBox.w, scaledBBox.h);
          }
        }
      }
      _setValValue($smuflRenderGlyphOptionsBbox.parent(), bbox);

      if (anchor) {
        const bbs = {};
        for (const akey in anchorDefs) {
          let anchorDef = anchorDefs[akey];
          const $anchorCheckbox = $smuflGlyphHints.find('#' + toHintlabelIdStr(akey) + ' input');
          _setValValue($anchorCheckbox, anchor[akey]);
          const isIndeterminate = $anchorCheckbox.prop('indeterminate');
          if ((!$anchorCheckbox.prop('checked') && !isIndeterminate) ||
            $anchorCheckbox.parent().is(':hidden')) {
            continue;
          }

          if (!anchorDef) {
            if (akey.endsWith('SE')) {
              anchorDef = ['S', 'E'];
            }
            else if (akey.endsWith('SW')) {
              anchorDef = ['S', 'W'];
            }
            else if (akey.endsWith('NE')) {
              anchorDef = ['N', 'E'];
            }
            else if (akey.endsWith('NW')) {
              anchorDef = ['N', 'W'];
            }
            else if (akey.endsWith('Width')) {
              anchorDef = ['Width'];
            }
            else if (akey.endsWith('Top')) {
              anchorDef = ['Top'];
            }
            else if (akey.endsWith('Bottom')) {
              anchorDef = ['Bottom'];
            }
            else if (akey.endsWith('Offset')) {
              anchorDef = ['Offset'];
            }
            else if (akey.endsWith('Origin')) {
              anchorDef = ['Origin'];
            }
            else if (akey.endsWith('Center')) {
              anchorDef = ['Center'];
            }
            anchorDefs[akey] = anchorDef;
          }
          bbs[akey] = {
            scaledBBox: scaledBBox,
            isIndeterminate: isIndeterminate,
            anchor: anchor,
            anchorDef: anchorDef,
            fontSizeInfo: fontSizeInfo,
            glyphData: glyphData
          };
          renderAnchor(akey, anchor[akey], anchorDef, scaledBBox, engravingDefaults, isIndeterminate, bbs);
        }
        _renderGraceNoteSlash(bbs, engravingDefaults, sbl);
      }

      ctx.restore();
    }

    let currentGlyphData = {
      codepoint: undefined,
      glyphname: undefined,
      anchor: undefined
    };

    function _getGlyphData(glyphname) {
      const option0 = { searchOptional: true };
      const uCp = sMuFLMetadata.glyphname2uCodepoint(glyphname, option0);
      let codepoint;
      if (uCp) {
        codepoint = sMuFLMetadata.uCodepoint2Codepoint(uCp);
      }
      const gwanchors = sMuFLMetadata.fontMetadata().glyphsWithAnchors;
      const anchors = gwanchors ? gwanchors[glyphname] : undefined;
      return {
        glyphname: glyphname,
        codepoint: codepoint,
        anchors: anchors
      };
    }

    function _postDraw() {
      window.setTimeout(_draw);
    }

    const _toRaneSpecFilename = (() => {
      const table = {
        gouldArrowQuartertoneAccidentals24Edo: 'gould-arrow-quartertone-accidentals-24-edo',
        kodályHandSigns: 'kodaly-hand-signs',
        organGerman: 'german-organ-tablature',
        simsAccidentals72Edo: 'sims-accidentals-72-edo',
        standardAccidentals12Edo: 'standard-accidentals-12-edo',
        steinZimmermannAccidentals24Edo: 'stein-zimmermann-accidentals-24-edo',
        stockhausenAccidentals: 'stockhausen-accidentals-24-edo',
        timeSignaturesReversed: 'reversed-time-signatures',
        timeSignaturesTurned: 'turned-time-signatures',
        trojanSagittalExtension12EdoRelativeAccidentals: 'trojan-sagittal-extension-12-edo-relative-accidentals',
        wyschnegradskyAccidentals72Edo: 'wyschnegradsky-accidentals-72-edo'
      };

      const rangeSpecFilenames = {};
      return (rangeName) => {
        rangeSpecFilenames[rangeName] = table[rangeName] || rangeSpecFilenames[rangeName] ||
        rangeName.replace(/[A-Z]/g, function(s) {
          return '-' + s.charAt(0).toLowerCase();
        });
        return rangeSpecFilenames[rangeName];
      };
    })();

    function _draw() {
      const fontInfo = sMuFLMetadata.getFontInfo();
      if (!fontInfo) {
        return;
      }

      var codepoint = getCodepointNumber();
      if (isNaN(codepoint)) {
        const cval = getCodepoint();
        const glyphData = _getGlyphData(cval);
        const option0 = { searchOptional: true };
        const uCp = sMuFLMetadata.glyphname2uCodepoint(cval, option0);
        if (uCp) {
          codepoint = sMuFLMetadata.uCodepoint2Codepoint(uCp);
        }
      }

      $codepointSelect.val(formatCodepointNumber(codepoint));
      const uCodepoint = sMuFLMetadata.ensureUCodepoint(getCodepoint());
      const option1 = { searchOptional: true };
      const glyphname = sMuFLMetadata.uCodepoint2Glyphname(uCodepoint, option1);

      $smuflGlyphInfoText.empty();
      appendGlyphname($smuflGlyphInfoText, glyphname, glyphname || uCodepoint, uCodepoint);
      _$c_appendText($smuflGlyphInfoText, '\n');
      let glyphnameData = sMuFLMetadata.data.glyphnames[glyphname];
      const optionalGlyphs = sMuFLMetadata.fontMetadata().optionalGlyphs;
      glyphnameData = glyphnameData || (optionalGlyphs ? optionalGlyphs[glyphname] : undefined);

      if (!glyphnameData) {
        _$c_appendText($smuflGlyphInfoText, 'codepoint: ');
        appendCodepointOrText($smuflGlyphInfoText, uCodepoint, uCodepoint);
        appendAlternateCodepointFors($smuflGlyphInfoText, uCodepoint);
      }
      else {
        for (const key in glyphnameData) {
          // FIXME: support classes for optionalGlyphs.
          if (key !== 'classes') {
            _$c_appendText($smuflGlyphInfoText,
              key + ': ');
            appendCodepointOrText($smuflGlyphInfoText, glyphnameData[key], uCodepoint);
            _$c_appendText($smuflGlyphInfoText, '\n');
          }
        }
      }

      $rangeInfo.empty();
      const ranges = sMuFLMetadata.data.ranges;
      let tRange;
      for (const key in ranges) {
        const range = ranges[key];
        if (!range.nStart) {
          range.nStart = sMuFLMetadata.uCodepoint2Codepoint(range.range_start);
          range.nEnd = sMuFLMetadata.uCodepoint2Codepoint(range.range_end);
        }
        if (codepoint >= range.nStart && codepoint <= range.nEnd) {
          tRange = {
            key: key,
            r: range
          };
          break;
        }
      }

      if (!tRange) {
        const tGlyph = smuFLFontViewer.sMuFLMetadata.getFontInfo().glyphsByUCodepoint[uCodepoint];
        if (tGlyph && tGlyph.isOptionalGlyph) {
          tRange = {
            key: fontInfo.optRange.description,
            r: fontInfo.optRange
          };
        }
      }

      if (!tRange) {
        tRange = {
          key: 'unicode',
          r: {
            description: 'unicode',
            noSpecLink: true
          }
        };
      }

      if (tRange) {
        _$c_appendText($rangeInfo, 'range: ');

        const filename = _toRaneSpecFilename(tRange.key);

        if (tRange.r.noSpecLink) {
          _$c_appendText($rangeInfo, tRange.key);
        }
        else {
          const $aDom = $(`<a href="https://w3c.github.io/smufl/gitbook/tables/${filename}.html"
 title="${tRange.key} range spec">${tRange.key}</a>`);
          $rangeInfo.append($aDom);
        }

        $rangeSelect_selectize.setValue(tRange.key, true);
        $rangeSelect_selectize.currentValue_ = tRange.key;

        _$c_appendText($rangeInfo, '\n');
        tRange = tRange.r;

        Object.keys(tRange).forEach(function (key) {
          if (key === 'nStart' || key === 'nEnd') {
            return;
          }
          _$c_appendText($rangeInfo, key + ': ');
          if (key === 'glyphs') {
            const $glyphsContainer = $('<div class="glyphsContainer"></div>');
            $rangeInfo.append($glyphsContainer);
            tRange[key].forEach(function (v) {
              appendGlyphname($glyphsContainer, v, glyphname);
              _$c_appendText($glyphsContainer, ', ');
            });
          }
          else {
            appendCodepointOrText($rangeInfo, tRange[key]);
          }
          _$c_appendText($rangeInfo, '\n');
        });
      }

      $alternatesInfo.empty();
      let alternates = sMuFLMetadata.fontMetadata().glyphsWithAlternates;
      let baseGlyphnames = [];
      if (option1.isOptionalGlyph || !glyphname) {
        if (fontInfo) {
          const glyph = fontInfo.glyphsByUCodepoint[uCodepoint];
          if (glyph || fontInfo.glyphsWithAlternates) {
            const alternateFors = fontInfo.alternateFors[glyph.glyphname];
            if (alternateFors) {
              baseGlyphnames = alternateFors;
            }
          } else if (fontInfo.alternateFors) {
            const alternateFors = fontInfo.alternateFors[uCodepoint];
            if (alternateFors) {
              baseGlyphnames = alternateFors;
            }
          }
        }
      }
      else {
        baseGlyphnames.push(glyphname);
      }

      baseGlyphnames.forEach(function (baseGlyphname) {
        const tAalternates = alternates ? alternates[baseGlyphname] : undefined;
        addAlternatesInfo($alternatesInfo, tAalternates, baseGlyphname, glyphname, uCodepoint);
      });

      const classes = sMuFLMetadata.getFontInfo().computedClasses.classes;

      const tClasses = [];
      $classesInfo.empty();

      for (var key in classes) {
        const c = classes[key];
        if (c.indexOf(glyphname) !== -1) {
          tClasses.push({
            key: key,
            class: c
          });
        }
      }

      if (tClasses.length) {
        _$c_appendText($classesInfo, 'classes: ' + '\n');
        tClasses.forEach(function (kc) {
          const $classInfo = $(`<div class="classInfo">${kc.key}: </div>`);
          $classesInfo.append($classInfo);
          const $glyphsContainer = $('<div class="glyphsContainer"></div>');
          $classInfo.append($glyphsContainer);
          kc.class.forEach(function (tGglyphname) {
            appendGlyphname($glyphsContainer, tGglyphname, glyphname);
            _$c_appendText($glyphsContainer, ', ');
          });
        });
      }

      $ligaturesInfo.empty();
      const ligatures = sMuFLMetadata.fontMetadata().ligatures;
      const ligature = ligatures ? ligatures[glyphname] : undefined;

      addLigatureInfo($ligaturesInfo, `ligatures: `, ligature, glyphname);

      $setsInfo.empty();
      if (fontInfo) {
        const setsByAlternateForItem = fontInfo.setsByAlternateFor[glyphname];
        const setsByNameItem = fontInfo.setsByName[glyphname];
        let $setInfosContainer;
        let $setNames;
        if (setsByAlternateForItem || setsByNameItem) {
          _$c_appendText($setsInfo, 'sets: ');
          $setNames = $('<span class="setNames"></span>');
          $setsInfo.append($setNames);
          $setInfosContainer = $('<div class="setInfosContainer"></div>');
          $setsInfo.append($setInfosContainer);
        }

        [setsByAlternateForItem, setsByNameItem].forEach(function (items) {
          if (!items) {
            return;
          }
          items.forEach(function (item) {
            const $setInfoContainer = $('<div class="setInfoContainer"></div>');
            $setInfosContainer.append(`${item.setName}: `);
            $setNames.append(`${item.setName}, `);
            const $setInfo = $('<div class="setInfo"></div>');
            _$c_appendText($setInfo, `description: ${item.set.description}, type: ${item.set.type}`);
            _$c_appendText($setInfo, `, alternateFor: `);
            appendGlyphname($setInfo, item.glyph.alternateFor, glyphname);
            _$c_appendText($setInfo, `, codepoint: `);
            appendCodepointOrText($setInfo, item.glyph.codepoint, uCodepoint);
            _$c_appendText($setInfo, `, description: ${item.glyph.description}`);
            _$c_appendText($setInfo, `, name: `);
            appendGlyphname($setInfo, item.glyph.name, glyphname);
            $setInfoContainer.append($setInfo);
            $setInfosContainer.append($setInfoContainer);
          });
        });
      }

      const anchors = sMuFLMetadata.fontMetadata().glyphsWithAnchors;
      const anchor = anchors ? anchors[glyphname] : undefined;
      hintLabels.hide();

      let hasCutOut = false;
      if (anchor) {
        for (const key in anchor) {
          hasCutOut |= key.startsWith('cutOut');
          $smuflGlyphHints.children(`#${toHintlabelIdStr(key)}`).show();
        }
      }

      if (hasCutOut) {
        $smuflGlyphHints.children(`#${toHintlabelIdStr('cutOutOrigin_BBL')}`).show();
      }

      currentGlyphData = {
        codepoint: codepoint,
        glyphname: glyphname,
        anchor: anchor
      };
      renderGlyph(currentGlyphData);

      var currentGlyphs = $('span.currentGlyph');
      currentGlyphs.each(function (idx, elm) {
        elm.scrollIntoView();
      });

      window.setTimeout(function () {
        document.firstElementChild.scrollIntoView(true);
      });

      updateStatickLink();
      updateUUkLink();
    }

    const resources = {
      smuflFontFace: false,
      smuflMetadata: false
    };

    this._handle_onResourceReady = function (type) {
      resources[type] = true;
      if (!resources.smuflFontFace || !resources.smuflMetadata) {
        return;
      }

      this.sSRenderer.init({
        sMuFLMetadata: sMuFLMetadata
      });

      const ranges = sMuFLMetadata.data.ranges;
      const rangeItems = [];
      const rangeItemDic = {};

      let dictItem = rangeItemDic.unicode = {
        value: 'unicode',
        name: 'unicode',
        codepoint: 0x21
      };
      rangeItems.push(dictItem);

      const optRange = sMuFLMetadata.getFontInfo().optRange;
      if (optRange.range_start) {
        dictItem = rangeItemDic[optRange.description] = {
          value: optRange.description,
          name: optRange.description,
          codepoint: sMuFLMetadata.uCodepoint2Codepoint(optRange.range_start)
        };
        rangeItems.push(dictItem);
      }

      for (const rk in ranges) {
        const range = ranges[rk];
        rangeItemDic[rk] = {
          value: rk,
          name: rk,
          codepoint: sMuFLMetadata.uCodepoint2Codepoint(range.range_start)
        };
        rangeItems.push(rangeItemDic[rk]);
      }

      $rangeSelect.selectize({
        options: rangeItems,
        labelField: 'name',
        searchField: ['name'],
        maxItems: 1,
        placeholder: 'enter (r)ange',
        onChange: function (value) {
          if (value.length && rangeItemDic[value]) {
            $rangeSelect_selectize.currentValue_ = value;
            selectCodepointByNumber(rangeItemDic[value].codepoint);
          }
        },
        onBlur: function () {
          if (!$rangeSelect_selectize.getValue().length) {
            $rangeSelect_selectize.setValue($rangeSelect_selectize.currentValue_,
              true /*silent: no changed event*/);
          }
        }
      });
      $rangeSelect_selectize = $rangeSelect[0].selectize;

      const settings_cutOutOrigin_BBL = params.get('settings.cutOutOrigin_BBL') === 'true';
      $smuflGlyphHints_cutOutOrigin_BBL.prop('checked', settings_cutOutOrigin_BBL);

      const fontMetadata = sMuFLMetadata.fontMetadata();

      $('#BOptionalGlyphs').prop('disabled', !!!fontMetadata.optionalGlyphs);
      $('#BFontMetadataLigatures').prop('disabled', !!!fontMetadata.ligatures);
      $('#BFontMetadataSets').prop('disabled', !!!fontMetadata.sets);
      $('#BFontMetadataGlyphsWithAnchors').prop('disabled', !!!fontMetadata.glyphsWithAnchors);
      $('#BFontMetadataGlyphsWithAlternates').prop('disabled', !!!fontMetadata.glyphsWithAlternates);

      let glyph = params.get('glyph');
      if (glyph) {
        var gd = _getGlyphData(glyph);
        if (!isNaN(gd.codepoint)) {
          glyph = formatCodepointNumber(gd.codepoint);
        }
        else {
          glyph = $codepointSelect_selectize.onType(glyph, true);
        }
      }
      $codepointSelect_selectize.setValue(glyph || 'E0A3');

      _postDraw();
      if (options.has('showFontMetadata')) {
        $('#BFontMetadata').click();
      }
    };

  }
}
