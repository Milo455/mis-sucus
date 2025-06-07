import { resizeImage } from '../resizeImage.js';
import { jest } from '@jest/globals';

// Basic stubs for Image and canvas APIs used in resizeImage.
class FakeCanvas {
  constructor() {
    this.width = 0;
    this.height = 0;
  }
  getContext() {
    return {
      drawImage: () => {}
    };
  }
  toDataURL() {
    return 'data:image/jpeg;base64,fake';
  }
}

class FakeImage {
  constructor() {
    this.width = 10;
    this.height = 10;
  }
  set src(_val) {
    if (this.onload) this.onload();
  }
}

beforeAll(() => {
  global.Image = FakeImage;
  document.createElement = jest.fn((tag) => {
    if (tag === 'canvas') return new FakeCanvas();
    return {};
  });
});

const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/58BAgMCo4nRgfsAAAAASUVORK5CYII=';

test('resizeImage returns a JPEG base64 string', async () => {
  const result = await resizeImage(sampleBase64, 20);
  expect(result.startsWith('data:image/jpeg;base64,')).toBe(true);
});
