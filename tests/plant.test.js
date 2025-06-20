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
const mockAddDoc = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockGetDocs = jest.fn();


const flushPromises = () => new Promise(res => setTimeout(res, 0));

describe('plant.js', () => {
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
    mockAddDoc.mockReset();
    mockCollection.mockReset();
    mockQuery.mockReset();
    mockWhere.mockReset();
    mockOrderBy.mockReset();
    mockLimit.mockReset();

    jest.unstable_mockModule('../firestore-web.js', () => ({
      doc: mockDoc,
      getDoc: mockGetDoc,
      deleteDoc: mockDeleteDoc,
      updateDoc: mockUpdateDoc,
      addDoc: mockAddDoc,
      collection: mockCollection,
      query: mockQuery,
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
      getDocs: mockGetDocs
    }));

    jest.unstable_mockModule('../firebase-init.js', () => ({
      db: {}
    }));
    mockGetDocs.mockResolvedValue({ empty: true, docs: [], forEach: () => {} });
    document.body.innerHTML = `
      <img id="plant-photo" />
      <span id="plant-name"></span>
      <span id="last-watering-count"></span>
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
      <button id="add-photo-record"></button>
      <input id="new-photo-input" type="file" />
      <div id="photo-album"></div>
      <div id="viewer-modal" class="hidden">
        <button id="prev-photo"></button>
        <img id="viewer-img" />
        <button id="next-photo"></button>
        <span id="close-viewer"></span>
      </div>
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
          notes: 'note'
        })
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ name: 'SpeciesName' })
      });
    mockGetDocs
      .mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            data: () => ({ base64: 'img-url', createdAt: { toDate: () => new Date('2020-01-02') } })
          }
        ]
      })
      .mockResolvedValueOnce({ empty: true, docs: [], forEach: () => {} });

    await import('../plant.js');
    await flushPromises();

    expect(document.getElementById('plant-name').textContent).toBe('Plant1');
    expect(document.getElementById('plant-photo').src).toContain('img-url');
    expect(document.getElementById('species-name').textContent).toBe('Especie: SpeciesName');
  });

  test('shows latest album photo', async () => {
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          name: 'Plant1',
          speciesId: 'spec1',
          createdAt: { toDate: () => new Date('2020-01-02') },
          notes: 'note'
        })
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ name: 'SpeciesName' })
      });
    mockGetDocs
      .mockResolvedValueOnce({
        empty: false,
        docs: [
          { data: () => ({ base64: 'img-new', createdAt: { toDate: () => new Date('2020-01-03') } }) },
          { data: () => ({ base64: 'img-old', createdAt: { toDate: () => new Date('2020-01-02') } }) }
        ]
      })
      .mockResolvedValueOnce({ empty: true, docs: [], forEach: () => {} });

    await import('../plant.js');
    await flushPromises();

    expect(document.getElementById('plant-photo').src).toContain('img-new');
    expect(document.getElementById('photo-album').children.length).toBe(2);
  });

  test('delete button removes plant and redirects', async () => {
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          name: 'Plant1',
          speciesId: 'spec1',
          createdAt: { toDate: () => new Date('2020-01-02') },
          notes: 'note'
        })
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ name: 'SpeciesName' })
      });
    mockGetDocs
      .mockResolvedValueOnce({ empty: true, docs: [], forEach: () => {} })
      .mockResolvedValueOnce({ empty: true, docs: [], forEach: () => {} });
    mockDeleteDoc.mockResolvedValue();

    await import('../plant.js');
    await flushPromises();

    document.getElementById('delete-plant-inside').click();
    await flushPromises();

    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  test('next and previous buttons navigate viewer', async () => {
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          name: 'Plant1',
          speciesId: 'spec1',
          createdAt: { toDate: () => new Date('2020-01-02') },
          photo: 'img1',
          notes: 'note',
          album: [
            { photo: 'img1', date: { toDate: () => new Date('2020-01-01') } },
            { photo: 'img2', date: { toDate: () => new Date('2020-01-02') } }
          ]
        })
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ name: 'SpeciesName' })
      });

    await import('../plant.js');
    await flushPromises();

    const firstImg = document.querySelector('#photo-album img');
    firstImg.click();

    expect(document.getElementById('viewer-img').src).toContain('img2');

    document.getElementById('next-photo').click();
    expect(document.getElementById('viewer-img').src).toContain('img1');

    document.getElementById('prev-photo').click();
    expect(document.getElementById('viewer-img').src).toContain('img2');
  });
});
