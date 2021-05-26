import { ParsedUrlQuery } from 'querystring';

export class Settings {
  static keys = ['cutOutOrigin_BBL'];
  static prefKey(idx: number): string {
    return `settings.${Settings.keys[idx]}`;
  }

  cutOutOrigin_BBL: boolean;

  constructor(cutOutOrigin_BBL = false) {
    this.cutOutOrigin_BBL = cutOutOrigin_BBL;
  }

  toQuery(ret: URLSearchParams): void {
    ret.set(Settings.prefKey(0), this.cutOutOrigin_BBL.toString());
  }

  static fromQuery(query: ParsedUrlQuery): Settings {
    let cutOutOrigin_BBL = false;
    const key0 = this.prefKey(0);
    if (key0 in query) {
      cutOutOrigin_BBL = (query[key0] || 'false') === 'true';
    }
    return new Settings(cutOutOrigin_BBL);
  }
}

export class Options {
  static keys = ['fontUrl', 'fontMetadataUrl', 'glyphnamesUrl', 'classesUrl', 'rangesUrl', 'glyph'];
  params: Record<string, string>;
  settings: Settings;

  constructor(params = {}, settings: Settings = new Settings()) {
    this.params = params;
    this.settings = settings;
  }

  toURLSearchParams(): URLSearchParams {
    const ret = new URLSearchParams(this.params);
    this.settings.toQuery(ret);
    return ret;
  }

  get(key: string): string {
    return this.params[key];
  }

  static fromValues(
    fontUrl: string,
    fontMetadataUrl: string,
    glyphnamesUrl: string,
    classesUrl: string,
    rangesUrl: string,
    settings: Settings = new Settings(),
    glyph?: string,
  ): Options {
    const params: Record<string, string> = {};
    params.fontUrl = fontUrl;
    params.fontMetadataUrl = fontMetadataUrl;
    params.glyphnamesUrl = glyphnamesUrl;
    params.classesUrl = classesUrl;
    params.rangesUrl = rangesUrl;
    if (glyph) {
      params.glyph = glyph;
    }

    return new Options(params, settings);
  }

  static fromQuery(query: ParsedUrlQuery): Options {
    const settings = Settings.fromQuery(query);
    return new Options(query, settings);
  }
}
