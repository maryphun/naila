import { describe, expect, it } from 'vitest';
import { MAX_MEDIA_BYTES, MENU_PHOTO_ASPECT } from '../app/lib/media';
import { cropRect, moveCrop } from '../app/lib/photo-crop';
import { readUploadBytes, UploadTooLargeError } from '../server/upload-bytes';

describe('merchant photo crop',()=>{
  it('matches the nail-menu frame and centers a portrait image',()=>{
    const rect=cropRect(1200,2000,{centerX:600,centerY:1000,zoom:1});
    expect(rect.width/rect.height).toBeCloseTo(MENU_PHOTO_ASPECT);
    expect(rect.x).toBe(0);
    expect(rect.y).toBeGreaterThan(0);
  });
  it('keeps a zoomed crop within the image while panning',()=>{
    const position=moveCrop(1200,900,{centerX:600,centerY:450,zoom:2},-10000,10000);
    const rect=cropRect(1200,900,position);
    expect(rect.x).toBe(0);
    expect(rect.y+rect.height).toBeCloseTo(900);
  });
});

describe('bounded media upload',()=>{
  const stream=(...chunks:number[][])=>new ReadableStream<Uint8Array>({start(controller){for(const chunk of chunks)controller.enqueue(new Uint8Array(chunk));controller.close();}});
  it('uses the requested 5 MB cap',()=>expect(MAX_MEDIA_BYTES).toBe(5*1024*1024));
  it('accepts a body exactly at its cap',async()=>expect(await readUploadBytes(stream([1,2],[3,4]),4)).toEqual(new Uint8Array([1,2,3,4])));
  it('rejects excess bytes even when streamed in later chunks',async()=>await expect(readUploadBytes(stream([1,2,3],[4,5]),4)).rejects.toBeInstanceOf(UploadTooLargeError));
});
