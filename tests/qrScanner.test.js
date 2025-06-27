/**
 * @jest-environment jsdom
 */


import { jest } from '@jest/globals';
import { fireEvent } from "@testing-library/dom";

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
jest.unstable_mockModule("../firestore-web.js", () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn()
}));

let Html5Qrcode;
beforeAll(async () => {
  ({ Html5Qrcode } = await import('html5-qrcode'));
  Html5Qrcode.getCameras = jest.fn().mockResolvedValue(mockCameras);
  await import('../firebase-init.js');
});

describe("QR Scanner", () => {
  beforeEach(async () => {
    document.body.innerHTML = `
      <button id="btnScanQR">Escanear QR</button>
      <div id="qrModal" class="hidden"></div>
      <div id="qr-reader"></div>
    `;
    await import("../app.js");
  });

  it("debería seleccionar la cámara trasera si está disponible", async () => {
    const button = document.getElementById("btnScanQR");
    fireEvent.click(button);

    await Promise.resolve(); // Espera a que se resuelva la promesa
    expect(Html5Qrcode.getCameras).toHaveBeenCalled();
    const qrScannerInstance = Html5Qrcode.mock.instances[0];
    expect(qrScannerInstance.start).toHaveBeenCalledWith(
      { deviceId: { exact: "cam2" } }, // ID de cámara trasera
      expect.any(Object),
      expect.any(Function),
      expect.any(Function)
    );
  });

});
