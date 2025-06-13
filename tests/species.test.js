import { jest } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

const mockDoc = jest.fn((...args) => ({ args }));
const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockCollection = jest.fn();
const mockAddDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockUploadString = jest.fn(() => Promise.resolve());
const mockGetDownloadURL = jest.fn(() => Promise.resolve('url'));


const flushPromises = () => new Promise(res => setTimeout(res, 0));

describe('species.js', () => {
  beforeEach(() => {
    jest.resetModules();
    const newDoc = document.implementation.createHTMLDocument('');
    global.window = newDoc.defaultView;
    global.document = newDoc;
    global.TextEncoder = global.TextEncoder || require('util').TextEncoder;
    global.TextDecoder = global.TextDecoder || require('util').TextDecoder;
    mockGetDoc.mockReset();
    mockGetDocs.mockReset();
    mockDeleteDoc.mockReset();
    mockUpdateDoc.mockReset();
    mockCollection.mockReset();
    mockAddDoc.mockReset();
    mockQuery.mockReset();
    mockWhere.mockReset();

    jest.unstable_mockModule('../firestore-web.js', () => ({
      doc: mockDoc,
      getDoc: mockGetDoc,
      updateDoc: mockUpdateDoc,
      deleteDoc: mockDeleteDoc,
      collection: mockCollection,
      addDoc: mockAddDoc,
      getDocs: mockGetDocs,
      query: mockQuery,
      where: mockWhere
    }));

    jest.unstable_mockModule('../storage-web.js', () => ({
      ref: jest.fn(() => 'ref'),
      uploadString: mockUploadString,
      getDownloadURL: mockGetDownloadURL
    }));

    jest.unstable_mockModule('../resizeImage.js', () => ({
      resizeImage: jest.fn(async () => 'resized-image')
    }));

    jest.unstable_mockModule('../firebase-init.js', () => ({
      db: {},
      storage: {}
    }));
    global.FileReader = class {
      readAsDataURL() {
        if (this.onload) {
          this.onload({ target: { result: 'data-url' } });
        }
      }
    };
    // default return
    mockGetDocs.mockImplementation(() => Promise.resolve({ empty: true, docs: [], forEach: () => {} }));
    document.body.innerHTML = `
      <img id="species-photo-display" />
      <span id="species-name-display"></span>
      <button id="edit-species-btn"></button>
      <form id="edit-species-form" class="hidden"></form>
      <input id="edit-species-name" />
      <input id="edit-species-photo" type="file" />
      <button id="save-species-edit"></button>
      <button id="delete-species"></button>
      <ul id="plant-list"></ul>
      <button id="add-plant-btn"></button>
      <div id="plant-modal" class="hidden"></div>
      <button id="close-plant-modal"></button>
      <button id="save-plant"></button>
      <input id="plant-name" />
      <input id="plant-notes-input" />
      <input id="plant-photo" type="file" />
    `;
    window.history.pushState({}, '', '/species.html?id=spec1');
    window.alert = jest.fn();
    window.confirm = jest.fn(() => true);
  });

  test('loads species data on DOMContentLoaded', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: 'Aloe', photo: 'photo-url' })
    });

    await jest.isolateModulesAsync(() => import('../species.js'));
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await flushPromises();

    expect(document.getElementById('species-name-display').textContent).toBe('Aloe');
    expect(document.getElementById('species-photo-display').src).toContain('photo-url');
  });

  test('deleting species removes plants and redirects', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: 'Aloe', photo: 'photo-url' })
    });
    mockGetDocs
      .mockResolvedValueOnce({ empty: true, docs: [], forEach: () => {} })
      .mockResolvedValueOnce({ docs: [{ id: 'p1' }, { id: 'p2' }], forEach: () => {}, empty: false });
    mockDeleteDoc.mockResolvedValue();

    await jest.isolateModulesAsync(() => import('../species.js'));
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await flushPromises();

    document.getElementById('delete-species').click();
    await flushPromises();

    expect(mockDeleteDoc.mock.calls.length).toBeGreaterThan(0);
  });

  test('adds a plant and closes modal', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: 'Aloe', photo: 'photo-url' })
    });
    mockAddDoc.mockResolvedValue({ id: 'newPlant' });

    await jest.isolateModulesAsync(() => import('../species.js'));
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await flushPromises();

    document.getElementById('add-plant-btn').click();
    const nameInput = document.getElementById('plant-name');
    const notesInput = document.getElementById('plant-notes');
    const photoInput = document.getElementById('plant-photo');
    nameInput.value = 'My Plant';
    notesInput.value = 'notes';
    Object.defineProperty(photoInput, 'files', { value: [{}], writable: false });

    document.getElementById('save-plant').click();
    await flushPromises();
    await flushPromises();

    expect(mockAddDoc).toHaveBeenCalled();
    const addData = mockAddDoc.mock.calls[0][1];
    expect(addData).toEqual(
      expect.objectContaining({
        name: 'My Plant',
        notes: 'notes',
        speciesId: 'spec1',
        createdAt: expect.any(Date)
      })
    );
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ args: [{}, 'plants', 'newPlant'] }),
      {
        photo: 'url',
        album: [{ url: 'url', date: addData.createdAt }]
      }
    );
    expect(document.getElementById('plant-modal').classList.contains('hidden')).toBe(true);
  });
});
