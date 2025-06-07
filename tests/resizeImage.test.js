import { resizeImage } from '../app.js';

const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/58BAgMCo4nRgfsAAAAASUVORK5CYII=';

test('resizeImage output width does not exceed maxWidth', async () => {
  const maxWidth = 20;
  const result = await resizeImage(sampleBase64, maxWidth);
  const img = new Image();
  img.src = result;
  await new Promise(resolve => { img.onload = resolve; });
  expect(img.width).toBeLessThanOrEqual(maxWidth);
});
