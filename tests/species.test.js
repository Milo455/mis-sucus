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
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();


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
    mockOrderBy.mockReset();
    mockLimit.mockReset();

    jest.unstable_mockModule('../firestore-web.js', () => ({
      doc: mockDoc,
      getDoc: mockGetDoc,
      updateDoc: mockUpdateDoc,
      deleteDoc: mockDeleteDoc,
      collection: mockCollection,
      addDoc: mockAddDoc,
      getDocs: mockGetDocs,
      query: mockQuery,
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit
    }));

    jest.unstable_mockModule('../firebase-init.js', () => ({
      db: {}
    }));
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
      <input id="plant-notes" />
      <input id="plant-photo" type="file" />
    `;
    window.history.pushState({}, '', '/species.html?id=spec1');
    window.alert = jest.fn();
    window.confirm = jest.fn(() => true);
  });

  test('loads species data on DOMContentLoaded', async () => {
    mockGetDoc.mockResolvedValue({
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
      .mockResolvedValueOnce({
        docs: [
          { id: 'p1', data: () => ({}) },
          { id: 'p2', data: () => ({}) }
        ],
        forEach: () => {},
        empty: false
      });
    mockDeleteDoc.mockResolvedValue();

    await jest.isolateModulesAsync(() => import('../species.js'));
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await flushPromises();

    document.getElementById('delete-species').click();
    await flushPromises();

    expect(mockDeleteDoc.mock.calls.length).toBeGreaterThan(0);
  });

  test('renders plants even if caching fails', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: 'Aloe', photo: 'photo-url' })
    });
    const plantDocs = [{ id: 'p1', data: () => ({ name: 'Planta1' }) }];
    mockGetDocs
      .mockResolvedValueOnce({
        empty: false,
        docs: plantDocs,
        forEach: cb => plantDocs.forEach(cb)
      })
      .mockResolvedValueOnce({ empty: true, docs: [], forEach: () => {} });

    window.localStorage.getItem = jest.fn(() => null);
    window.localStorage.setItem = jest.fn(() => { throw new DOMException('fail'); });

    await jest.isolateModulesAsync(() => import('../species.js'));
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await flushPromises();
    expect(document.querySelectorAll('.plant-item').length).toBe(1);
  });
});
