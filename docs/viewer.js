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
        get: function(key) {
          return this.data[key];
        }
      };
    }

    function _initFontFace() {
      const fontFace = {
        fontUrl: undefined
      };

      Object.keys(fontFace).forEach(function(key) {
        fontFace[key] = options.get(key);
      });

      if (!window.FontFace) {
        alert('no window.FontFace. This browser is not supported.');
      }

      const smuflFontFace = new FontFace('SMuFLFont', `url(${fontFace.fontUrl})`);

      smuflFontFace.load().then(function(loaded_face) {
        // loaded_face holds the loaded FontFace
        document.fonts.add(loaded_face);
        window.setTimeout(function() {
          that._handle_onResourceReady('smuflFontFace');
        });
      }).catch(function(error) {
        // error occurred
        alert(error + ': ' + fontFace.fontUrl);
      });
    }

    _initFontFace();

    const $codepointSelect = $('#codepointSelect');
    let $codepointSelect_selectize;

    sMuFLMetadata.init(options).then(function (/* obj */) {
      if (sMuFLMetadata.initErrors.length) {
        alert(sMuFLMetadata.initErrors.map(function(str) {
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
        Object.keys(optionalGlyphs).forEach((gname) => {
          const cp = optionalGlyphs[gname].codepoint.replace('U+', '');
          soptions.push({
            series: 'optionalGlyphs',
            value: cp,
            name: cp + ': ' + gname
          });
        });

        $codepointSelect.selectize({
          options: soptions,
          optgroups: [
            {value: 'glyphnames', label: 'glyphnames'},
            {value: 'optionalGlyphs', label: 'optionalGlyphs'},
            {value: 'codepoint', label: 'codepoint'},
          ],
          optgroupField: 'series',
          labelField: 'name',
          searchField: ['name'],
          placeholder: 'enter glyphname or codepoint',
          maxItems: 1,
          create: false,
          onType: function(str) {
            console.log(str);
            str = str.toUpperCase();
            if (str.match(/^[A-F0-9]+$/)) {
              $codepointSelect_selectize.addCodePointItem(str);
              $codepointSelect_selectize.refreshOptions(true);
            }
          },
          onChange: function(value) {
            setCodepointByString(value);
          },
          //openOnFocus: false,
          plugins: ['optgroup_columns']
        });

        $codepointSelect_selectize = $codepointSelect[0].selectize;
        $codepointSelect_selectize.addCodePointItem = function(cp) {
          cp = cp.toUpperCase();
          $codepointSelect_selectize.addOption({
            series: 'codepoint',
            value: cp,
            name: cp
          });
          return cp;
        }
        that._handle_onResourceReady('smuflMetadata');
      }
    });

    const params = new URLSearchParams(window.location.search);

    const $smuflGlyphHints = $('#smuflGlyphHints');

    function toHintlabelIdStr(name) {
      return 'hintLabel_' + name;
    }
    const hintLabels = $smuflGlyphHints.children('label');
    for (let li = 0; li < hintLabels.length; li++) {
      const hintLabel = hintLabels[li];
      hintLabel.id = toHintlabelIdStr(hintLabel.textContent);
      const inputElm = hintLabel.firstElementChild;
      inputElm.checked = true;

      const isIndeterminate = hintLabel.textContent.startsWith('stem') ||
        hintLabel.textContent.startsWith('splitStem') ||
        hintLabel.textContent.startsWith('graceNoteSlash');
      if (isIndeterminate || hintLabel.textContent.startsWith('repeatOffset') ||
        hintLabel.textContent.startsWith('numeral')) {
        inputElm._on3StateChange = function() {
          inputElm._3state++;
          if (inputElm._3state > 2) {inputElm._3state = 0;}
          inputElm.checked = inputElm._3state & 2;
          inputElm.indeterminate = inputElm._3state & 1;
        };
        if (isIndeterminate) {
          inputElm._3state = 0;
        }
        else {
          inputElm._3state = 1;
        }
        inputElm._on3StateChange();
      }
    }

    const $smuflGlyphHints_repatOffset3StateBox =
      $smuflGlyphHints.find('#' + toHintlabelIdStr('repeatOffset') + ' input');

    var c = document.getElementById('smuflGlyphCanvas');
    var ctx = c.getContext('2d');

    const $smuflRenderGlyphOptionsOrigin = $('#smuflRenderGlyphOptionsOrigin');
    const $smuflRenderGlyphOptionsBbox = $('#smuflRenderGlyphOptionsBbox');

    const $smuflRenderGlyphOptionsGlyphSize = $('#smuflRenderGlyphOptionsGlyphSize');
    $smuflRenderGlyphOptionsGlyphSize.on('input', function() {
      this.nextElementSibling.textContent = this.value;
    });
    $smuflRenderGlyphOptionsGlyphSize.trigger('input');

    $smuflRenderGlyphOptionsGlyphSize.on('input', function() {
      renderGlyph(currentGlyphData);
    });

    $('#smuflRenderGlyphOptions input').on('change', function() {
      renderGlyph(currentGlyphData);
    });

    this.resizeHandlers = [];
    $(window).on('resize', function() {
      renderGlyph(currentGlyphData);
      that.resizeHandlers.forEach(function(func) {
        window.setTimeout(func);
      });
    });

    function _initMouseHandlers() {
      const $smuflGlyphCanvasContainer = $('#smuflGlyphCanvasContainer');

      let isActive = false;
      let startPos;

      function _setIsActive(v) {
        isActive = v;
        $smuflGlyphCanvasContainer.css('cursor', isActive ? 'move' : '');
      }

      _setIsActive(false);

      $smuflGlyphCanvasContainer.on('mousedown', function(ev) {
        if (ev.button !== 0) { return; }
        _setIsActive(true);
        startPos = {
          clientX: ev.clientX,
          clientY: ev.clientY,
          scrollLeft: $smuflGlyphCanvasContainer.scrollLeft(),
          scrollTop: $smuflGlyphCanvasContainer.scrollTop()
        };
      });

      $smuflGlyphCanvasContainer.on('mousemove', function(ev) {
        if (isActive) {
          $smuflGlyphCanvasContainer.scrollTop(startPos.scrollTop -
            (ev.clientY - startPos.clientY));
          $smuflGlyphCanvasContainer.scrollLeft(startPos.scrollLeft -
            (ev.clientX - startPos.clientX));
        }
      });

      $smuflGlyphCanvasContainer.on('mouseup', function(ev) {
        if (ev.button !== 0) { return; }
        _setIsActive(false);
      });
      $smuflGlyphCanvasContainer.on('mouseleave', function(ev) {
        _setIsActive(false);
      });

      $('#smuflGlyphCanvasContainer').scrollTop(
        ($('#smuflGlyphCanvasContainer').prop('scrollHeight') * 0.5) -
        ($('#smuflGlyphCanvasContainer').innerHeight() * 0.5));

      $('#smuflGlyphCanvasContainer').scrollLeft(
        ($('#smuflGlyphCanvasContainer').prop('scrollWidth') * 0.5) -
        ($('#smuflGlyphCanvasContainer').width() * 0.5));
    }

    _initMouseHandlers();

    const $body = $('body');
    const $rootContainer = $('#rootContainer');
    const $infoDialog = $('#infoDialog');
    const infoDialogElm = $infoDialog.get(0);
    const $contentContainer = $('#contentContainer');
    const _$infoDialog_defaultDescription = 'use browser\'s search to find glyphname, smufl properties, codepoint, etc...';

    if (!infoDialogElm.showModal) {
      const $dialogTitle = $('#infoDialog #dialogTitle');
      $rootContainer.addClass('fakeDialog');
      infoDialogElm.showModal = function(title, description = _$infoDialog_defaultDescription) {
        $body.addClass('fakeDialogVisible');
        $dialogTitle.text(title);
        $contentContainer.prop('title', description);
      };
      infoDialogElm.close = function() {
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
    $rangeSelect.on('change', function() {
      const $range = $rangeSelect.children('option:selected');
      selectCodepointByNumber($range.get(0).codepoint_);
    });

    function getCodepoint() {
      return $codepointSelect.val();
    }

    function formatCodepointNumber(codepointNumber) {
      let str = 'NaN';
      if (isNaN(codepointNumber)) {
        return str;
      }

      str = codepointNumber.toString(16).toUpperCase();
      if (str.len < 4) {
        str = ('000' + str).slice(-3);
      }
      return str;
    }

    function getCodepointNumber() {
      return Number('0x' + getCodepoint(), 16);
    }

    function setCodepointByNumber(codepointNumber) {
      setCodepointByString(formatCodepointNumber(codepointNumber));
    }

    function appendCodepoint($c, uCodepointStr) {
      $c.append($(`<span class="smuflCodepoint">${uCodepointStr}</span>`));
    }

    function appendCodepointOrText($c, uCodepointStr) {
      if (uCodepointStr.startsWith && uCodepointStr.startsWith('U+')) {
        appendCodepoint($c, uCodepointStr);
      }
      else {
        $c.append(uCodepointStr);
      }
    }

    function appendGlyphname($c, glyphname, currentGlyphName, uCodepoint) {
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

      const $t = $(`<span class="smuflGlyphname">${glyphname || '?'}:<span class="smufl">${charStr}</span></span>`);
      if (option.isOptionalGlyph) {
        $t.addClass('optionalGlyph');
      }
      if (currentGlyphName === glyphname) {
        $t.addClass('currentGlyph');
      }

      $t.prop('uCodepoint', uCodepoint);
      $c.append($t);
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

    $('body').keypress(function(ev) {
      if (ev.target.nodeName === 'INPUT') {
        if (ev.target.type === 'text') {
          return;
        }
      }
      if (ev.target.nodeName === 'SELECT') {
        return;
      }
      switch (ev.key) {
      case 'w':
        if ($body.hasClass('fakeDialogVisible')) {
          $infoDialog.find('input').click();
        }
        break;
      case 'g':
        window.setTimeout(function() {
          $('#BGlyphnames').focus();
        });
        break;
      case 'k':
        $('#BPrev').click();
        break;
      case 'h':
      case 'l':
        $('#BShowPrev').click();
        break;
      case 'c':
        window.setTimeout(function() {
          $codepointSelect_selectize.focus();
        });
        break;
      case 'j':
        $('#BNext').click();
        break;
      case 'r':
        window.setTimeout(function() {
          $('#rangeSelect').focus();
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
      cp = $codepointSelect_selectize.addCodePointItem(cp);
      $codepointSelect_selectize.setValue(cp);
    }

    function selectCodepointByNumber(cp) {
      selectCodepointByString(formatCodepointNumber(cp));
    }

    $('#BPrev').on('click', function () {
      selectCodepointByNumber(getCodepointNumber() - 1);
    });
    $('#BNext').on('click', function () {
      selectCodepointByNumber(getCodepointNumber() + 1);
    });

    function addGlyphnameInfo($contentContainer, ginfo, glyphname) {
      $contentContainer.append(`${ginfo.codepoint}: `);
      appendGlyphname($contentContainer, glyphname); // here, no current glyph.
      $contentContainer.append(`, ${ginfo.description||''}: `);
      $contentContainer.append($('<br>'));
    }

    const _$infoDialog_contentDoms = {};
    function _$infoDialog_showModal(key, func) {
      let $contentDom = _$infoDialog_contentDoms[key];
      if (!$contentDom) {
        $contentDom = _$infoDialog_contentDoms[key] = $('<div></div>');
        func($contentDom);
      }
      const contentDomElm = $contentDom.get(0);
      $contentContainer.empty();
      $contentContainer.append($contentDom);
      $infoDialog.get(0).showModal(key);

      if (contentDomElm.dlRepaint) {
        window.setTimeout(function() {
          contentDomElm.dlRepaint();
        });
      }
    }

    $('#BGlyphnames').on('click', function () {
      _$infoDialog_showModal('glyphames', function($contentContainer) {
        const glyphnames = sMuFLMetadata.data.glyphnames;
        try {
          for (const key in glyphnames) {
            addGlyphnameInfo($contentContainer, glyphnames[key], key);
          }
        } catch(e) {
          console.log(e);
        }
        return $contentContainer;
      });
    });
    $('#BOptionalGlyphs').on('click', function () {
      _$infoDialog_showModal('font metadata optionalGlyphs', function($contentContainer) {
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
      _$infoDialog_showModal('font metadata', function($contentContainer) {
        function add_engravingDefaults(name, engravingDefaults) {
          $contentContainer.append(`${name}: `);
          const $tdContaienr = $('<div class="engravingDefaultsContainer"></div>');
          for (const key in engravingDefaults) {
            $tdContaienr.append(`${key}: ${engravingDefaults[key]}, `);
          }
          $contentContainer.append($tdContaienr);
        }

        // eslint-disable-next-line no-unused-vars
        function add_sets(name, sets) {
          $contentContainer.append(`${name}: ${
            Object.keys(sMuFLMetadata.fontMetadata().sets).join(', ')
          }`);
        }

        const fontMetadata = sMuFLMetadata.fontMetadata();
        for (const key in fontMetadata) {
          let addBr = true;
          switch (key) {
          case 'fontName':
          case 'fontVersion':
            $contentContainer.append(`${key}: ${fontMetadata[key]}`);
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
            $contentContainer.append(`${key}: ...`);
            break;
          case 'sets':
            add_sets(key, fontMetadata[key]);
            break;
          default:
            break;
          }
          if (addBr) {
            $contentContainer.append($('<br>'));
          }
        }
        const $gmCanvas = $('<canvas id="gm_canvas"></canvas>');
        $contentContainer.append($gmCanvas);
        const drawSs = function() {
          const gmCanvasElm = $gmCanvas.get(0);

          // canvas is cleared by resize.
          gmCanvasElm.width = gmCanvasElm.clientWidth;
          gmCanvasElm.height = gmCanvasElm.clientHeight;

          that.sSRenderer.draw(gmCanvasElm.getContext('2d'), {
            _measureGlyph: _measureGlyph,
            _renderGlyph: _renderGlyph,
            _getGlyphData: _getGlyphData,
            _renderCross: _renderCross,
            _anchorCsToScreenCs: _anchorCsToScreenCs,
            _getAnchor: function(glyphname, anchorName) {
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
          $ligaturesInfo.append(label);
        }
        appendGlyphname($ligaturesInfo, glyphname);
        $ligaturesInfo.append('\ndescription: ');
        $ligaturesInfo.append((ligature.description || '') + '\n');
        if (ligature.componentGlyphs) {
          $ligaturesInfo.append('componentGlyphs:\n');
          const $glyphsContainer = $('<div class="glyphsContainer"></div>');
          $ligaturesInfo.append($glyphsContainer);
          ligature.componentGlyphs.forEach(function (tGlyphname) {
            appendGlyphname($glyphsContainer, tGlyphname, glyphname);
            $glyphsContainer.append(', ');
          });
        }
      }
    }

    $('#BFontMetadataLigatures').on('click', function () {
      _$infoDialog_showModal('font metadata ligatures', function($contentContainer) {
        try {
          const ligatures = sMuFLMetadata.getFontInfo().fontMetadata.ligatures;
          Object.keys(ligatures).forEach(function(glyphname) {
            const $ligaturesInfo = $(`<div class="ligatureContainer glyphContainer"></div>`);
            $contentContainer.append($ligaturesInfo);
            addLigatureInfo($ligaturesInfo, undefined, ligatures[glyphname], glyphname);
          });
        } catch(e) {
          console.log(e);
        }
      });
    });

    function _createAnyListPage($contentContainer, listName, dict,
      addItemFunc, getGlyphsFunc, addGlyphFunc) {
      function _hrefId(hrefName) {
        return listName + 'Container_' + hrefName;
      }

      function _addLink($c, hrefName, items) {
        const disabled = hrefName ? false : true;
        if (disabled) {
          hrefName = '....';
        }
        if (disabled) {
          $c.append(`<span>${hrefName}</span> `);
        }
        else {
          $c.append(`<a href="#${_hrefId(hrefName)}">${hrefName}</a> `);
        }
      }

      try {
        Object.keys(dict).forEach(function(itemName, idx, items) {
          const item = dict[itemName];
          const id = _hrefId(itemName);
          const $itemContainer = $(`<div class="${listName}Container" id="${id}"></div>`);
          $contentContainer.append($itemContainer);
          $itemContainer.append(`${itemName}: `);
          _addLink($itemContainer, items[idx - 1]);
          _addLink($itemContainer, items[idx + 1]);
          $itemContainer.append(`\n`);
          addItemFunc($itemContainer, item);
          const glyphs = getGlyphsFunc(item);
          glyphs.forEach(function(glyph) {
            const $glyphContainer = $('<div class="glyphContainer"></div>');
            addGlyphFunc($glyphContainer, glyph);
            $itemContainer.append($glyphContainer);
          });
        });
      } catch(e) {
        console.log(e);
      }
    }

    $('#BFontMetadataSets').on('click', function () {
      _$infoDialog_showModal('font metadata sets', function($contentContainer) {
        _createAnyListPage($contentContainer, 'set',
          sMuFLMetadata.getFontInfo().fontMetadata.sets,
          //addItemFunc
          ($itemContainer, item) => {
            $itemContainer.append(`description: ${item.description}: \n`);
            $itemContainer.append(`type: ${item.type}: \n`);
          },
          // getGlyphsFunc
          (item) => {
            return item.glyphs;
          },
          // addGlyphFunc
          ($glyphContainer, glyph) => {
            $glyphContainer.append(`description: ${glyph.description}\n`);
            appendCodepointOrText($glyphContainer, glyph.codepoint);
            $glyphContainer.append(', ');
            appendGlyphname($glyphContainer, glyph.name);
            $glyphContainer.append(', alternateFor: ');
            appendGlyphname($glyphContainer, glyph.alternateFor);
          });
      });
    });

    $('#BRanges').on('click', function () {
      _$infoDialog_showModal('ranges', function($contentContainer) {
        _createAnyListPage($contentContainer, 'range',
          sMuFLMetadata.data.ranges,
          //addItemFunc
          ($itemContainer, item) => {
            $itemContainer.append(`description: ${item.description}: \n`);
          },
          // getGlyphsFunc
          (item) => {
            return item.glyphs;
          },
          // addGlyphFunc
          ($glyphContainer, glyphName) => {
            appendGlyphname($glyphContainer, glyphName);
          });
      });
    });

    $('#BClasses').on('click', function () {
      _$infoDialog_showModal('classes', function($contentContainer) {

        _createAnyListPage($contentContainer, 'class',
          sMuFLMetadata.data.classes,
          //addItemFunc
          ($itemContainer, item) => {
          },
          // getGlyphsFunc
          (item) => {
            return item;
          },
          // addGlyphFunc
          ($glyphContainer, glyphName) => {
            appendGlyphname($glyphContainer, glyphName);
          });
      });
    });


    function addAlternatesInfo($alternatesInfo, alternates, baseGlyphname, glyphname) {
      if (alternates && alternates.alternates) {
        $alternatesInfo.append('alternates: ');
        appendGlyphname($alternatesInfo, baseGlyphname, glyphname);
        $alternatesInfo.append('\n');
        alternates.alternates.forEach(function (v) {
          $alternatesInfo.append('codepoint: ');
          appendCodepoint($alternatesInfo, v.codepoint);
          $alternatesInfo.append(`, name: `);
          appendGlyphname($alternatesInfo, v.name, glyphname);
          $alternatesInfo.append(`\n`);
        });
      }
    }

    $('#BFontMetadataGlyphsWithAlternates').on('click', function () {
      _$infoDialog_showModal('font metadata glyphsWithAlternates', function($contentContainer) {
        try {
          const gwAlternates = sMuFLMetadata.fontMetadata().glyphsWithAlternates;
          for (const akey in gwAlternates) {
            const alternates = gwAlternates[akey];
            const $gwaContainer = $(`<div class="gwalternatesContainer glyphContainer"></div>`);
            $contentContainer.append($gwaContainer);
            addAlternatesInfo($gwaContainer, alternates, akey);
          }
        } catch(e) {
          console.log(e);
        }
      });
    });

    $('#BFontMetadataGlyphsWithAnchors').on('click', function () {
      _$infoDialog_showModal('font metadata glyphsWithAnchors', function($contentContainer) {
        try {
          const glyphsWithAnchors = sMuFLMetadata.getFontInfo().fontMetadata.glyphsWithAnchors;
          Object.keys(glyphsWithAnchors).forEach(function(glyphname) {
            const glyph = glyphsWithAnchors[glyphname];
            const $gwaContainer = $(`<div class="gwanchorsContainer"></div>`);
            $contentContainer.append($gwaContainer);
            const $glyphContainer = $('<div class="glyphContainer"></div>');
            appendGlyphname($glyphContainer, glyphname);
            $glyphContainer.append('&nbsp;' + Object.keys(glyph).join(', '));
            $gwaContainer.append($glyphContainer);
          });
        } catch(e) {
          console.log(e);
        }
      });
    });

    $infoDialog.find('input').on('click', function() {
      $infoDialog.get(0).close();
      $contentContainer.empty();
    });

    function anchorCsToScreenCsY(val, sbl) {
      return val * sbl * -1;
    }

    function anchorCsToScreenCsX(val, sbl) {
      return val * sbl;
    }

    function _anchorCsToScreenCs(scaledBBox, anchor, sbl) {
      return {
        x: scaledBBox.x + anchorCsToScreenCsX(Number(anchor[0]), sbl),
        y: scaledBBox.y + anchorCsToScreenCsY(Number(anchor[1]), sbl)
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
      let vals = _anchorCsToScreenCs(scaledBBox, anchor, sbl);

      // eslint-disable-next-line no-unused-vars
      let halign = 'L';
      let vdir = 'TTB';
      types.forEach(function(type) {
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
      if (akey.startsWith('cutOut')) {
        ctx.fillStyle = '#cccccccc';
        ctx.fillRect(x, y, w, h);
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
              halign, vdir, sbl, engravingDefaults, akey.startsWith('splitStem'));
          }
          else if (akey.startsWith('numeral')) {
            _renderNumeral(x, y, sbl, bbs[akey]);
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

    function _renderStem(x, y, h, halign, vdir, sbl, engravingDefaults, isSplitStem) {
      let w = anchorCsToScreenCsX(engravingDefaults.stemThickness, sbl);
      let rad = 0;
      if (isSplitStem) {
        // https://steinberg.help/dorico/v2/en/_shared_picts/picts/dorico/notation_reference/accidentals_altered_unison_tree.png
        // https://www.steinberg.net/forums/download/file.php?id=16781
        // FIXME: draw sample stem and noteheads(altered unison)...
        const sdx = 1.2;
        const sdy = 1;
        rad = Math.atan2(sdx, sdy);
      }

      if (halign === 'R') {
        w *= -1;
        rad *= -1;
      }
      if (vdir === 'BTT') {
        h *= -1;
      }
      else {
        rad *= -1;
      }

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rad);
      ctx.translate(-x, -y);
      ctx.fillStyle = '#aaaaaacc';
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.fill();
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
      slashBbs.forEach(function(sbb) {
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

      const m = _measureGlyph(glyphData, x, y, sbl);
      const scaledBBox = m.scaledBBox;
      const bbox = m.bbox;

      ctx.fillStyle = '#444444cc';
      _renderGlyph(glyphData, x, y, fontSize);

      if ($smuflGlyphHints_repatOffset3StateBox.prop('checked')) {
        ctx.save();
        if (repeatOffset) {
          ctx.fillStyle = '#44444477';
          _renderGlyph(glyphData, x + (anchorCsToScreenCsX(repeatOffset[0], sbl)),
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
            fontSizeInfo: fontSizeInfo
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
      const option0 = {searchOptional: true};
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

    function _draw() {
      var codepoint = getCodepointNumber();
      if (isNaN(codepoint)) {
        const cval = getCodepoint();
        const glyphData = _getGlyphData(cval);
        const option0 = {searchOptional: true};
        const uCp = sMuFLMetadata.glyphname2uCodepoint(cval, option0);
        if (uCp) {
          codepoint = sMuFLMetadata.uCodepoint2Codepoint(uCp);
        }
      }

      $codepointSelect.val(formatCodepointNumber(codepoint));
      const uCodepoint = sMuFLMetadata.ensureUCodepoint(getCodepoint());
      const option1 = { searchOptional: true, searchAlternateCodepoint: true };
      const glyphname = sMuFLMetadata.uCodepoint2Glyphname(uCodepoint, option1);

      $smuflGlyphInfoText.empty();
      appendGlyphname($smuflGlyphInfoText, glyphname, glyphname, uCodepoint);
      $smuflGlyphInfoText.append('\n');
      const glyphnameData = sMuFLMetadata.data.glyphnames[glyphname];
      if (!glyphnameData) {
        $smuflGlyphInfoText.append('codepoint: ');
        appendCodepointOrText($smuflGlyphInfoText, uCodepoint);
      }
      else {
        for (const key in glyphnameData) {
          $smuflGlyphInfoText.append(
            key + ': ');
          appendCodepointOrText($smuflGlyphInfoText, glyphnameData[key]);
          $smuflGlyphInfoText.append('\n');
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

      if (tRange) {
        $rangeInfo.append('range: ');
        $rangeInfo.append(tRange.key);

        $rangeSelect.val(tRange.key);

        $rangeInfo.append('\n');
        tRange = tRange.r;

        Object.keys(tRange).forEach(function(key) {
          if (key === 'nStart' || key === 'nEnd') {
            return;
          }
          $rangeInfo.append(key + ': ');
          if (key === 'glyphs') {
            const $glyphsContainer = $('<div class="glyphsContainer"></div>');
            $rangeInfo.append($glyphsContainer);
            tRange[key].forEach(function (v) {
              appendGlyphname($glyphsContainer, v, glyphname);
              $glyphsContainer.append(', ');
            });
          }
          else {
            appendCodepointOrText($rangeInfo, tRange[key]);
          }
          $rangeInfo.append('\n');
        });
      }

      $alternatesInfo.empty();
      let alternates = sMuFLMetadata.fontMetadata().glyphsWithAlternates;
      let baseGlyphname = glyphname;
      if (option1.isOptionalGlyph) {
        for (var gk in alternates) {
          if (glyphname === gk) {
            baseGlyphname = gk;
            break;
          }
        }
      }

      // TODO: search alternates[glyphname].alternates[].name and add all entries like sets.

      alternates = alternates ? alternates[baseGlyphname] : undefined;
      addAlternatesInfo($alternatesInfo, alternates, baseGlyphname, glyphname);

      const classes = sMuFLMetadata.data.classes;
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
        $classesInfo.append('classes: ' + '\n');
        tClasses.forEach(function (kc) {
          const $classInfo = $(`<div class="classInfo">${kc.key}: </div>`);
          $classesInfo.append($classInfo);
          const $glyphsContainer = $('<div class="glyphsContainer"></div>');
          $classInfo.append($glyphsContainer);
          kc.class.forEach(function (tGglyphname) {
            appendGlyphname($glyphsContainer, tGglyphname, glyphname);
            $glyphsContainer.append(', ');
          });
        });
      }

      $ligaturesInfo.empty();
      const ligatures = sMuFLMetadata.fontMetadata().ligatures;
      const ligature = ligatures ? ligatures[glyphname] : undefined;

      addLigatureInfo($ligaturesInfo, `ligatures: `, ligature, glyphname);

      $setsInfo.empty();
      const fontInfo = sMuFLMetadata.getFontInfo();
      if (fontInfo) {
        const setsByAlternateForItem = fontInfo.setsByAlternateFor[glyphname];
        const setsByNameImte = fontInfo.setsByName[glyphname];
        let $setInfosContainer;
        let $setNames;
        if (setsByAlternateForItem || setsByNameImte) {
          $setsInfo.append('sets: ');
          $setNames = $('<span class="setNames"></span>');
          $setsInfo.append($setNames);
          $setInfosContainer = $('<div class="setInfosContainer"></div>');
          $setsInfo.append($setInfosContainer);
        }

        [setsByAlternateForItem, setsByNameImte].forEach(function(items) {
          if (!items) {
            return;
          }
          items.forEach(function(item) {
            const $setInfoContainer = $('<div class="setInfoContainer"></div>');
            $setInfosContainer.append(`${item.setName}: `);
            $setNames.append(`${item.setName}, `);
            const $setInfo = $('<div class="setInfo"></div>');
            $setInfo.append(`description: ${item.set.description}, type: ${item.set.type}`);
            $setInfo.append(`, alternateFor: `);
            appendGlyphname($setInfo, item.glyph.alternateFor, glyphname);
            $setInfo.append(`, codepoint: `);
            appendCodepointOrText($setInfo, item.glyph.codepoint);
            $setInfo.append(`, description: ${item.glyph.description}`);
            $setInfo.append(`, name: `);
            appendGlyphname($setInfo, item.glyph.name, glyphname);
            $setInfoContainer.append($setInfo);
            $setInfosContainer.append($setInfoContainer);
          });
        });
      }

      const anchors = sMuFLMetadata.fontMetadata().glyphsWithAnchors;
      const anchor = anchors ? anchors[glyphname] : undefined;
      hintLabels.hide();
      if (anchor) {
        for (const key in anchor) {
          $smuflGlyphHints.children(`#${toHintlabelIdStr(key)}`).show();
        }
      }

      currentGlyphData = {
        codepoint: codepoint,
        glyphname: glyphname,
        anchor: anchor
      };
      renderGlyph(currentGlyphData);

      var currentGlyphs = $('span.currentGlyph');
      currentGlyphs.each(function(idx, elm) {
        elm.scrollIntoView();
      });

      window.setTimeout(function() {
        document.firstElementChild.scrollIntoView(true);
      });
    }

    const resources = {
      smuflFontFace: false,
      smuflMetadata: false
    };

    this._handle_onResourceReady = function(type) {
      resources[type] = true;
      if (!resources.smuflFontFace || !resources.smuflMetadata) {
        return;
      }

      this.sSRenderer.init({
        sMuFLMetadata: sMuFLMetadata
      });

      const ranges = sMuFLMetadata.data.ranges;
      for (const rk in ranges) {
        const $option = $(`<option value="${rk}">${rk}</option>`);
        const elm = $option.get(0);
        const range = ranges[rk];
        elm.codepoint_ = sMuFLMetadata.uCodepoint2Codepoint(range.range_start);
        $rangeSelect.append($option);
      }

      let glyph = params.get('glyph') || 'E0A3';
      if (glyph) {
        var gd = _getGlyphData(glyph);
        if (!isNaN(gd.codepoint)) {
          glyph = formatCodepointNumber(gd.codepoint);
        }
        else {
          glyph = glyph.toUpperCase();
        }
        $codepointSelect_selectize.setValue(glyph);
      }

      _postDraw();
      if (options.has('showFontMetadata')) {
        $('#BFontMetadata').click();
      }
    };

  }
}
