/**
 * @jest-environment jsdom
 */


import { jest } from '@jest/globals';
import { fireEvent } from "@testing-library/dom";

const flushPromises = () => new Promise(res => setTimeout(res, 0));

// Mock de cámaras
const mockCameras = [
  { id: "cam1", label: "Front Camera" },
  { id: "cam2", label: "Back Camera" },
];

// Mock de funciones
jest.unstable_mockModule("html5-qrcode", () => {
  return {
    Html5Qrcode: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      applyVideoConstraints: jest.fn(),
    })),
    Html5QrcodeSupportedFormats: {},
    Html5QrcodeScanner: jest.fn(),
    Html5QrcodeScannerState: {},
    Html5QrcodeError: {},
    Html5QrcodeResult: {},
    Html5QrcodeResultFormats: {},
    Html5QrcodeSupportedScanTypes: {},
    Html5QrcodeScanType: {},
    Html5QrcodeCameraScanConfig: {},
    Html5QrcodeFileScanConfig: {},
    Html5QrcodeConfig: {},
    Html5QrcodeDefaultScanType: {},
    Html5QrcodeSupportedResolutions: {},
    Html5QrcodeLocalMediaStreamConstraints: {},
    Html5QrcodeCameraPermissions: {},
    Html5QrcodeSupportedAspectRatios: {},
    Html5QrcodeCameraScanConfigBuilder: {},
    Html5QrcodeLogger: {},
    Html5QrcodeSupportedBarCodeTypes: {},
    Html5QrcodeScannerLogger: {},
    Html5QrcodeScanResultLogger: {},
    Html5QrcodeScanResultManager: {},
    Html5QrcodeDeviceManager: {},
    Html5QrcodeUtils: {},
    Html5QrcodeBrowserCompatibility: {},
    Html5QrcodeSupportedPlatform: {},
    Html5QrcodeErrorLogger: {},
    Html5QrcodeErrorTypes: {},
    Html5QrcodeScanResult: {},
    Html5QrcodeResultParser: {},
    Html5QrcodeUtils: {},
    Html5QrcodeSupportChecker: {},
    Html5QrcodePermissionsChecker: {},
    Html5QrcodeSupportedDevices: {},
    Html5QrcodeSupportedConstraints: {},
    Html5QrcodeSupportedFeatures: {},
    Html5QrcodeBrowserApiWrapper: {},
    Html5QrcodeScannerConfig: {},
    Html5QrcodeErrorReporter: {},
    Html5QrcodeErrorLoggerTypes: {},
    Html5QrcodePlatformChecker: {},
    Html5QrcodePlatformInfo: {},
    Html5QrcodeScannerTypes: {},
    Html5QrcodeScannerDeviceManager: {},
    Html5QrcodeScannerRenderers: {},
    Html5QrcodeScannerView: {},
    Html5QrcodeScannerComponents: {},
    Html5QrcodeScannerUi: {},
    Html5QrcodeScannerUiManager: {},
    Html5QrcodeScannerViewManager: {},
    Html5QrcodeUi: {},
    Html5QrcodeUiBuilder: {},
    Html5QrcodeUiManager: {},
    Html5QrcodeVideoStreamManager: {},
    Html5QrcodeVideoStreamSettings: {},
    Html5QrcodeCameraSelection: {},
    Html5QrcodeCameraType: {},
    Html5QrcodeScanTypeManager: {},
    Html5QrcodeStreamConstraintsManager: {},
    Html5QrcodeSession: {},
    Html5QrcodeSessionManager: {},
    Html5QrcodeSessionState: {},
    Html5QrcodeScannerSession: {},
    Html5QrcodeApp: {},
    Html5QrcodeScannerConfigBuilder: {},
    Html5QrcodeErrorHandler: {},
    Html5QrcodeCompatibility: {},
    Html5QrcodeFeatures: {},
    Html5QrcodeAnalytics: {},
    Html5QrcodeScanModes: {},
    Html5QrcodeResultConfig: {},
    Html5QrcodeLoggerConfig: {},
    Html5QrcodeDevTools: {},
    Html5QrcodeMeta: {},
    Html5QrcodeTimer: {},
    Html5QrcodeTimerHandler: {},
    Html5QrcodePerformanceLogger: {},
    Html5QrcodePerformanceData: {},
    Html5QrcodeErrorHandlerBuilder: {},
    Html5QrcodeAppSession: {},
    Html5QrcodeTestUtils: {},
    Html5QrcodeTestLogger: {},
    Html5QrcodeFakeStream: {},
    Html5QrcodeFakeConstraints: {},
    Html5QrcodeFakeElement: {},
    Html5QrcodeFakeApp: {},
    Html5QrcodeFakeHtml5Qrcode: {},
    Html5QrcodeFakeHtml5QrcodeScanner: {},
    Html5QrcodeFakeCamera: {},
    Html5QrcodeFakeDevices: {},
    Html5QrcodeFakeElementUtils: {},
    Html5QrcodeFakeLogger: {},
    Html5QrcodeFakeTest: {},
    Html5QrcodeFakeScan: {},
    Html5QrcodeFakeScanManager: {},
    Html5QrcodeFakeScanSession: {},
    Html5QrcodeFakeScanType: {},
    Html5QrcodeFakeStreamConfig: {},
    Html5QrcodeFakeSupportChecker: {},
    Html5QrcodeFakeUi: {},
    Html5QrcodeFakeUiManager: {},
    Html5QrcodeFakeView: {},
    Html5QrcodeFakeViewManager: {},
    Html5QrcodeFakeWindow: {},
    Html5QrcodeFakeWorker: {},
  };
}, { virtual: true });
jest.unstable_mockModule("../firebase-init.js", () => ({ db: {} }));
const mockCollection = jest.fn();
const mockAddDoc = jest.fn();
const mockGetDocs = jest.fn().mockResolvedValue({ empty: true, docs: [], forEach: () => {} });
const mockQuery = jest.fn();
const mockOrderBy = jest.fn();
const mockDeleteDoc = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn().mockResolvedValue({ exists: () => false });

jest.unstable_mockModule("../firestore-web.js", () => ({
  collection: mockCollection,
  addDoc: mockAddDoc,
  getDocs: mockGetDocs,
  query: mockQuery,
  orderBy: mockOrderBy,
  deleteDoc: mockDeleteDoc,
  doc: mockDoc,
  getDoc: mockGetDoc
}));

let Html5Qrcode;
beforeAll(async () => {
  ({ Html5Qrcode } = await import('html5-qrcode'));
  Html5Qrcode.getCameras = jest.fn().mockResolvedValue(mockCameras);
  global.Html5Qrcode = Html5Qrcode;
  await import('../firebase-init.js');
});

describe("QR Scanner", () => {
  beforeEach(async () => {
    document.body.innerHTML = `
      <button id="btnAddSpecies"></button>
      <button id="open-calendar"></button>
      <button id="scan-qr">Escanear QR</button>
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
      <div id="plant-checkboxes"></div>
      <div id="eventos-dia"></div>
      <div id="add-event-modal"></div>
      <button id="open-event-modal"></button>
      <button id="close-add-event"></button>
      <div id="qr-reader"></div>
    `;
    await jest.isolateModulesAsync(() => import("../app.js"));
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  it("debería seleccionar la cámara trasera si está disponible", async () => {
    const button = document.getElementById("scan-qr");
    fireEvent.click(button);

    await flushPromises();
    expect(Html5Qrcode.getCameras).toHaveBeenCalled();
    expect(Html5Qrcode).toHaveBeenCalledWith('qr-reader');
    const instance = Html5Qrcode.mock.results[0].value;
    expect(instance.start).toHaveBeenCalledWith(
      { deviceId: { exact: 'cam2' } },
      expect.any(Object),
      expect.any(Function),
      expect.any(Function)
    );
    expect(instance.applyVideoConstraints).toHaveBeenCalledWith({
      advanced: [{ focusMode: 'continuous' }]
    });
  });

});
