/**
 * Copyright (c) 2020 h-sug1no
 */

export class UCodePoint {
  codepoint_: number;

  constructor(codepoint: number) {
    this.codepoint_ = codepoint;
  }

  public static fromUString(uString: string): UCodePoint {
    const codepoint = Number.parseInt(uString.replace('U+', ''), 16);
    return new UCodePoint(codepoint);
  }

  public toUString(addPrefix = true): string {
    const str = this.codepoint_.toString(16).toUpperCase();
    return (addPrefix ? 'U+' : '') + str.padStart(4, '0');
  }

  public toCharString(): string {
    return isNaN(this.codepoint_) ? '?' : String.fromCodePoint(this.codepoint_);
  }

  public toNumber(): number {
    return this.codepoint_;
  }
}
