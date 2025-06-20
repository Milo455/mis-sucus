import { jest } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';

const flushPromises = () => new Promise(res => setTimeout(res, 0));

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

describe('QR scanner initialization', () => {
  let startMock;

  beforeEach(async () => {
    jest.resetModules();
    const newDoc = document.implementation.createHTMLDocument('');
    global.window = newDoc.defaultView;
    global.document = newDoc;

    document.body.innerHTML = `
      <button id="btnAddSpecies"></button>
      <button id="open-calendar"></button>
      <button id="scan-qr"></button>
      <ul id="species-list"></ul>
      <div id="species-modal"></div>
      <button id="close-species-modal"></button>
      <button id="save-species"></button>
      <div id="calendar-modal"></div>
      <button id="close-calendar"></button>
      <div id="calendar-container"></div>
      <input id="event-date" />
      <select id="event-type"></select>
      <button id="save-event"></button>
      <div id="qr-modal" class="hidden"></div>
      <button id="close-qr-modal"></button>
      <div id="plant-checkboxes"></div>
      <div id="qr-reader"></div>
      <button id="open-event-modal"></button>
      <button id="close-add-event"></button>
      <div id="add-event-modal" class="hidden"></div>
      <div id="eventos-dia"></div>
    `;

    startMock = jest.fn(() => Promise.resolve());
    class Html5QrcodeMock {
      constructor() {
        this.start = startMock;
        this.stop = jest.fn();
      }
      static getCameras() {
        return Promise.resolve([
          { id: 'front1', label: 'Front Camera' },
          { id: 'rear1', label: 'Back Camera' }
        ]);
      }
    }
    global.Html5Qrcode = Html5QrcodeMock;

    jest.unstable_mockModule('../firestore-web.js', () => ({
      collection: jest.fn(),
      addDoc: jest.fn(),
      getDocs: jest.fn().mockResolvedValue({ empty: true, docs: [], forEach: () => {} }),
      query: jest.fn(),
      orderBy: jest.fn(),
      deleteDoc: jest.fn(),
      doc: jest.fn(),
      getDoc: jest.fn()
    }));


    jest.unstable_mockModule('../firebase-init.js', () => ({ db: {} }));

    await import('../app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await flushPromises();
  });

  test('starts scanner with rear camera', async () => {
    document.getElementById('scan-qr').click();
    await flushPromises();

    const [cameraArg, configArg, successCb, errorCb] = startMock.mock.calls[0];
    expect(cameraArg).toEqual({ deviceId: { exact: 'rear1' } });
    expect(typeof successCb).toBe('function');
    expect(typeof errorCb).toBe('function');
    expect(configArg.qrbox).toBeUndefined();
  });

  test('falls back to environment facing mode when cameras unavailable', async () => {
    startMock.mockClear();
    delete global.Html5Qrcode.getCameras;
    document.getElementById('scan-qr').click();
    await flushPromises();

    const [cameraArg] = startMock.mock.calls[0];
    expect(cameraArg).toEqual({ facingMode: { exact: 'environment' } });
  });
});
