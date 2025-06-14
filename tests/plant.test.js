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

const mockUploadString = jest.fn(() => Promise.resolve());
const mockGetDownloadURL = jest.fn(() => Promise.resolve('url'));


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
      <button id="open-album"></button>
      <div id="album-modal" class="hidden">
        <button id="close-album"></button>
        <div id="photo-album"></div>
      </div>
      <div id="viewer-modal" class="hidden">
        <img id="viewer-img" />
        <button id="close-viewer"></button>
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

  test('shows latest album photo', async () => {
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          name: 'Plant1',
          speciesId: 'spec1',
          createdAt: { toDate: () => new Date('2020-01-02') },
          photo: 'img-old',
          notes: 'note',
          album: [
            { url: 'img-old', date: { toDate: () => new Date('2020-01-02') } },
            { url: 'img-new', date: { toDate: () => new Date('2020-01-03') } }
          ]
        })
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ name: 'SpeciesName' })
      });

    await import('../plant.js');
    await flushPromises();

    expect(document.getElementById('plant-photo').src).toContain('img-new');
    expect(document.getElementById('photo-album').children.length).toBe(2);
  });

  test('adds a new album photo on file selection', async () => {
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          name: 'Plant1',
          speciesId: 'spec1',
          createdAt: { toDate: () => new Date('2020-01-02') },
          photo: 'img-old',
          notes: 'note',
          album: [
            { url: 'img-old', date: { toDate: () => new Date('2020-01-02') } }
          ]
        })
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ name: 'SpeciesName' })
      });

    await import('../plant.js');
    await flushPromises();

    const input = document.getElementById('new-photo-input');
    Object.defineProperty(input, 'files', { value: [{}], writable: false });
    input.dispatchEvent(new Event('change'));
    await flushPromises();
    await flushPromises();

    const updateData = mockUpdateDoc.mock.calls[0][1];
    expect(updateData.album.length).toBe(2);
    expect(updateData.album[0].url).toBe('url');
    const album = document.getElementById('photo-album');
    expect(album.children.length).toBe(2);
    expect(album.children[0].querySelector('img').src).toContain('url');
  });

  test('editing the photo adds it to the album', async () => {
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          name: 'Plant1',
          speciesId: 'spec1',
          createdAt: { toDate: () => new Date('2020-01-02') },
          photo: 'img-old',
          notes: 'note',
          album: [
            { url: 'img-old', date: { toDate: () => new Date('2020-01-02') } }
          ]
        })
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ name: 'SpeciesName' })
      });

    await import('../plant.js');
    await flushPromises();

    const photoInput = document.getElementById('edit-plant-photo');
    const nameInput = document.getElementById('edit-plant-name');
    nameInput.value = 'Plant1';
    Object.defineProperty(photoInput, 'files', { value: [{}], writable: false });
    document.getElementById('edit-plant-form').dispatchEvent(new Event('submit'));
    await flushPromises();
    await flushPromises();

    const updateData = mockUpdateDoc.mock.calls[0][1];
    expect(updateData.album.length).toBe(2);
    expect(updateData.album[0].url).toBe('resized-image');
    const album = document.getElementById('photo-album');
    expect(album.children.length).toBe(2);
    expect(album.children[0].querySelector('img').src).toContain('resized-image');
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

  test('open and close album modal', async () => {
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

    const albumModal = document.getElementById('album-modal');
    const openBtn = document.getElementById('open-album');
    const closeBtn = document.getElementById('close-album');

    expect(albumModal.classList.contains('hidden')).toBe(true);

    openBtn.click();
    expect(albumModal.classList.contains('hidden')).toBe(false);

    closeBtn.click();
    expect(albumModal.classList.contains('hidden')).toBe(true);
  });

  test('viewer modal shows clicked album photo', async () => {
    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          name: 'Plant1',
          speciesId: 'spec1',
          createdAt: { toDate: () => new Date('2020-01-02') },
          photo: 'img-old',
          notes: 'note',
          album: [
            { url: 'img-old', date: { toDate: () => new Date('2020-01-02') } },
            { url: 'img-new', date: { toDate: () => new Date('2020-01-03') } }
          ]
        })
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ name: 'SpeciesName' })
      });

    await import('../plant.js');
    await flushPromises();

    const albumEl = document.getElementById('photo-album');
    const firstImg = albumEl.querySelector('img');
    const viewerModal = document.getElementById('viewer-modal');
    const viewerImg = document.getElementById('viewer-img');

    firstImg.click();

    expect(viewerModal.classList.contains('hidden')).toBe(false);
    expect(viewerImg.src).toBe(firstImg.src);
  });
});
