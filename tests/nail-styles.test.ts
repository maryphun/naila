import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STYLES } from '../app/lib/types';
import { STYLE_EXAMPLES } from '../app/lib/nail-styles';

describe('nail-style picker photos', () => {
  it('has a distinct, optimized local photo for every style', () => {
    const images = STYLES.map(style => STYLE_EXAMPLES[style].image);
    expect(new Set(images).size).toBe(STYLES.length);
    for (const image of images) {
      expect(image).toMatch(/^\/images\/styles\/picker-[a-z0-9-]+\.webp$/);
      const file = resolve(process.cwd(), 'public', image.slice(1));
      expect(existsSync(file)).toBe(true);
      expect(statSync(file).size).toBeLessThan(100_000);
    }
  });
});
