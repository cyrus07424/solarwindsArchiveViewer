// ANSI escape code to React-renderable segments
import type { CSSProperties } from 'react';

export interface AnsiSegment {
  text: string;
  style: CSSProperties;
}

const ANSI_COLORS_FG: Record<number, string> = {
  30: '#000000',
  31: '#cc0000',
  32: '#00aa00',
  33: '#aaaa00',
  34: '#0000cc',
  35: '#aa00aa',
  36: '#00aaaa',
  37: '#555555',
  90: '#555555',
  91: '#cc2222',
  92: '#007700',
  93: '#888800',
  94: '#2222cc',
  95: '#cc00cc',
  96: '#008888',
  97: '#333333',
};

const ANSI_COLORS_BG: Record<number, string> = {
  40: '#000000',
  41: '#cc0000',
  42: '#00aa00',
  43: '#aaaa00',
  44: '#0000cc',
  45: '#aa00aa',
  46: '#00aaaa',
  47: '#aaaaaa',
  100: '#555555',
  101: '#ff5555',
  102: '#55ff55',
  103: '#ffff55',
  104: '#5555ff',
  105: '#ff55ff',
  106: '#55ffff',
  107: '#ffffff',
};

interface AnsiState {
  color?: string;
  backgroundColor?: string;
  fontWeight?: 'bold';
  fontStyle?: 'italic';
  textDecoration?: 'underline';
}

export function parseAnsiString(input: string): AnsiSegment[] {
  const segments: AnsiSegment[] = [];
  // Match ESC[ ... m sequences
  const ansiRegex = /\x1b\[([0-9;]*)m/g;
  let state: AnsiState = {};
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ansiRegex.exec(input)) !== null) {
    // Text before this escape sequence
    if (match.index > lastIndex) {
      segments.push({ text: input.slice(lastIndex, match.index), style: stateToStyle(state) });
    }
    lastIndex = match.index + match[0].length;

    // Process codes
    const codes = match[1] === '' ? [0] : match[1].split(';').map(Number);
    let i = 0;
    while (i < codes.length) {
      const code = codes[i];
      if (code === 0) {
        state = {};
      } else if (code === 1) {
        state = { ...state, fontWeight: 'bold' };
      } else if (code === 3) {
        state = { ...state, fontStyle: 'italic' };
      } else if (code === 4) {
        state = { ...state, textDecoration: 'underline' };
      } else if (code === 22) {
        const { fontWeight: _, ...rest } = state;
        state = rest;
      } else if (code >= 30 && code <= 37) {
        state = { ...state, color: ANSI_COLORS_FG[code] };
      } else if (code === 38 && codes[i + 1] === 5 && i + 2 < codes.length) {
        // 256 color fg
        const idx = codes[i + 2];
        state = { ...state, color: xterm256ToHex(idx) };
        i += 2;
      } else if (code === 38 && codes[i + 1] === 2 && i + 4 < codes.length) {
        // RGB fg
        state = { ...state, color: `rgb(${codes[i+2]},${codes[i+3]},${codes[i+4]})` };
        i += 4;
      } else if (code === 39) {
        const { color: _, ...rest } = state;
        state = rest;
      } else if (code >= 40 && code <= 47) {
        state = { ...state, backgroundColor: ANSI_COLORS_BG[code] };
      } else if (code === 48 && codes[i + 1] === 5 && i + 2 < codes.length) {
        const idx = codes[i + 2];
        state = { ...state, backgroundColor: xterm256ToHex(idx) };
        i += 2;
      } else if (code === 48 && codes[i + 1] === 2 && i + 4 < codes.length) {
        state = { ...state, backgroundColor: `rgb(${codes[i+2]},${codes[i+3]},${codes[i+4]})` };
        i += 4;
      } else if (code === 49) {
        const { backgroundColor: _, ...rest } = state;
        state = rest;
      } else if (code >= 90 && code <= 97) {
        state = { ...state, color: ANSI_COLORS_FG[code] };
      } else if (code >= 100 && code <= 107) {
        state = { ...state, backgroundColor: ANSI_COLORS_BG[code] };
      }
      i++;
    }
  }

  // Remaining text
  if (lastIndex < input.length) {
    segments.push({ text: input.slice(lastIndex), style: stateToStyle(state) });
  }

  return segments;
}

function stateToStyle(state: AnsiState): CSSProperties {
  const style: CSSProperties = {};
  if (state.color) style.color = state.color;
  if (state.backgroundColor) style.backgroundColor = state.backgroundColor;
  if (state.fontWeight) style.fontWeight = state.fontWeight;
  if (state.fontStyle) style.fontStyle = state.fontStyle;
  if (state.textDecoration) style.textDecoration = state.textDecoration;
  return style;
}

// Convert xterm 256-color index to hex
function xterm256ToHex(index: number): string {
  if (index < 16) {
    const basic: string[] = [
      '#000000','#cc0000','#00aa00','#aaaa00','#0000cc','#aa00aa','#00aaaa','#555555',
      '#555555','#cc2222','#007700','#888800','#2222cc','#cc00cc','#008888','#333333',
    ];
    return basic[index] || '#aaaaaa';
  }
  if (index >= 232) {
    const v = (index - 232) * 10 + 8;
    return `rgb(${v},${v},${v})`;
  }
  index -= 16;
  const r = Math.floor(index / 36);
  const g = Math.floor((index % 36) / 6);
  const b = index % 6;
  const toVal = (x: number) => x === 0 ? 0 : 55 + x * 40;
  return `rgb(${toVal(r)},${toVal(g)},${toVal(b)})`;
}

export function hasAnsiCodes(text: string): boolean {
  return /\x1b\[/.test(text);
}

export function stripAnsiCodes(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}
