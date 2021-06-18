import { Options } from './Viewer';

export type IHandle_onResourceReady = (type: string) => void;

export function _initFontFace(
  options: Options,
  handle_onResourceReady: IHandle_onResourceReady,
): void {
  const fontFace = {
    fontUrl: options.get('fontUrl'),
  };

  /**
   Since, no FontFace(still Working Draft) interface is
   supported by typescript
   use 'any' for window and document.
  */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyWin: any = window;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDoc: any = document;
  ////////////////////////////////////////////////////////////////////////

  if (!anyWin.FontFace) {
    alert('no window.FontFace. This browser is not supported.');
  }

  const smuflFontFace = new anyWin.FontFace('SMuFLFont', `url(${fontFace.fontUrl})`);

  smuflFontFace
    .load()
    .then(function (loaded_face: unknown) {
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
    .catch(function (error: unknown) {
      // error occurred
      alert(error + ': ' + fontFace.fontUrl);
    });
}
