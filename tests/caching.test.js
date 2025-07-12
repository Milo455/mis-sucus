import { jest } from '@jest/globals';

const mockCollection = jest.fn();
const mockAddDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockQuery = jest.fn();
const mockOrderBy = jest.fn();
const mockDeleteDoc = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();

const flushPromises = () => new Promise(res => setTimeout(res, 0));

describe('caching fallbacks', () => {
  beforeEach(() => {
    jest.resetModules();
    const newDoc = document.implementation.createHTMLDocument('');
    global.window = newDoc.defaultView;
    global.document = newDoc;
    global.localStorage = window.localStorage;
    mockCollection.mockReset();
    mockAddDoc.mockReset();
    mockGetDocs.mockReset();
    mockQuery.mockReset();
    mockOrderBy.mockReset();
    mockDeleteDoc.mockReset();
    mockDoc.mockReset();
    mockGetDoc.mockReset();

    jest.unstable_mockModule('../firestore-web.js', () => ({
      collection: mockCollection,
      addDoc: mockAddDoc,
      getDocs: mockGetDocs,
      query: mockQuery,
      orderBy: mockOrderBy,
      deleteDoc: mockDeleteDoc,
      doc: mockDoc,
      getDoc: mockGetDoc
    }));

    jest.unstable_mockModule('../firebase-init.js', () => ({ db: {} }));

    document.body.innerHTML = `
      <button id="btnAddSpecies"></button>
      <button id="open-calendar"></button>
      <button id="scan-qr"></button>
      <div id="species-list"></div>
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
      <button id="scan-event-qr"></button>
      <div id="selected-plants"></div>
      <div id="eventos-dia"></div>
      <div id="add-event-modal"></div>
      <button id="open-event-modal"></button>
      <button id="close-add-event"></button>
      <div id="qr-reader"></div>
    `;
  });

  test('species render even when caching fails', async () => {
    const docs = [{ id: 's1', data: () => ({ name: 'Aloe', photo: 'url' }) }];
    mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs,
      forEach: cb => docs.forEach(cb)
    });
    window.localStorage.getItem = jest.fn(() => null);
    window.localStorage.setItem = jest.fn(() => { throw new DOMException('fail'); });

    await jest.isolateModulesAsync(() => import('../app.js'));
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await flushPromises();

    expect(document.querySelectorAll('.species-card').length).toBe(1);
  });
});
