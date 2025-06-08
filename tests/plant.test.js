import { jest } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

const mockDoc = jest.fn((...args) => ({ args }));
const mockGetDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockUpdateDoc = jest.fn();


const flushPromises = () => new Promise(res => setTimeout(res, 0));

describe('plant.js', () => {
  beforeEach(() => {
    jest.resetModules();
    const newDoc = document.implementation.createHTMLDocument('');
    global.window = newDoc.defaultView;
    global.document = newDoc;
    global.TextEncoder = global.TextEncoder || require('util').TextEncoder;
    global.TextDecoder = global.TextDecoder || require('util').TextDecoder;
    jest.unstable_mockModule('../firestore-web.js', () => ({
      doc: mockDoc,
      getDoc: mockGetDoc,
      deleteDoc: mockDeleteDoc,
      updateDoc: mockUpdateDoc
    }));

    jest.unstable_mockModule('../firebase-init.js', () => ({
      db: {}
    }));
    document.body.innerHTML = `
      <img id="plant-photo" />
      <span id="plant-name"></span>
      <span id="plant-date"></span>
      <button id="edit-plant"></button>
      <button id="delete-plant-inside"></button>
      <button id="print-qr"></button>
      <button id="cancel-edit-plant"></button>
      <div id="edit-plant-modal"></div>
      <form id="edit-plant-form"></form>
      <input id="edit-plant-name" />
      <input id="edit-plant-notes" />
      <input id="edit-plant-photo" type="file" />
      <span id="plant-notes"></span>
      <span id="species-name"></span>
      <button id="back-to-species"></button>
    `;
    window.history.pushState({}, '', '/plant.html?id=plant1');
    window.alert = jest.fn();
    window.confirm = jest.fn(() => true);
  });

  test('loads plant data on import', async () => {
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          name: 'Plant1',
          speciesId: 'spec1',
          createdAt: { toDate: () => new Date('2020-01-02') },
          photo: 'img-url',
          notes: 'note'
        })
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ name: 'SpeciesName' })
      });

    await import('../plant.js');
    await flushPromises();

    expect(document.getElementById('plant-name').textContent).toBe('Plant1');
    expect(document.getElementById('plant-photo').src).toContain('img-url');
    expect(document.getElementById('species-name').textContent).toBe('Especie: SpeciesName');
  });

  test('delete button removes plant and redirects', async () => {
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          name: 'Plant1',
          speciesId: 'spec1',
          createdAt: { toDate: () => new Date('2020-01-02') },
          photo: 'img-url',
          notes: 'note'
        })
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ name: 'SpeciesName' })
      });
    mockDeleteDoc.mockResolvedValue();

    await import('../plant.js');
    await flushPromises();

    document.getElementById('delete-plant-inside').click();
    await flushPromises();

    expect(mockDeleteDoc).toHaveBeenCalled();
  });
});
