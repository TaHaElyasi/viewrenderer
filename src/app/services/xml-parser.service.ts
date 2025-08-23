import { Injectable } from '@angular/core';

export interface XmlParseResult {
  root: Element | null;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class XmlParserService {
  parse(xml: string): XmlParseResult {
    const wrapped = `<root>${xml || ''}</root>`;
    const parser = new DOMParser();
    const doc = parser.parseFromString(wrapped, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      const errText = parseError.textContent || 'XML parse error';
      return { root: null, error: errText };
    }
    return { root: doc.documentElement, error: null };
  }
}