/**
 * Copyright (c) 2020 h-sug1no
 */

export class UCodePoint {
  cpNumber_: number;

  constructor(cpNumber: number) {
    this.cpNumber_ = cpNumber;
  }

  public static fromCpNumber(cpNumber: number): UCodePoint {
    return new UCodePoint(cpNumber);
  }

  public static fromUString(uString: string): UCodePoint {
    const codepoint = Number.parseInt(uString.replace('U+', ''), 16);
    return new UCodePoint(codepoint);
  }

  public toUString(addPrefix = true): string {
    const str = this.cpNumber_.toString(16).toUpperCase();
    return (addPrefix ? 'U+' : '') + str.padStart(4, '0');
  }

  public toCharString(): string {
    return isNaN(this.cpNumber_) ? '?' : String.fromCodePoint(this.cpNumber_);
  }

  public toNumber(): number {
    return this.cpNumber_;
  }
}

export function codepoint2UString(codepoint: string): string {
  return `U+${codepoint}`;
}
