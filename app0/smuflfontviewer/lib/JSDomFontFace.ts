// Since, no FontFace(still Working Draft) interface is supported by typescript
// use 'any'...
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Options } from './Viewer';

export type IHandle_onResourceReady = (type: string) => void;

export function _initFontFace(
  options: Options,
  handle_onResourceReady: IHandle_onResourceReady,
): void {
  const fontFace = {
    fontUrl: options.get('fontUrl'),
  };

  const anyWin: any = window;
  const anyDoc: any = document;
  if (!anyWin.FontFace) {
    alert('no window.FontFace. This browser is not supported.');
  }

  const smuflFontFace = new anyWin.FontFace('SMuFLFont', `url(${fontFace.fontUrl})`);

  smuflFontFace
    .load()
    .then(function (loaded_face: any) {
      // loaded_face holds the loaded FontFace
      anyDoc.fonts.add(loaded_face);
      let fontUrlItems = fontFace.fontUrl.split('/');
      if (fontUrlItems.length < 1) {
        fontUrlItems = ['?'];
      }
      document.title = `${fontUrlItems[fontUrlItems.length - 1]}: ${document.title}`;
      window.setTimeout(function () {
        handle_onResourceReady('smuflFontFace');
      });
    })
    .catch(function (error: any) {
      // error occurred
      alert(error + ': ' + fontFace.fontUrl);
    });
}
