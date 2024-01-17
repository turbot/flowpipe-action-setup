const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const {
  installFlowpipe,
} = require("../installer");

jest.mock('@actions/core');
jest.mock('@actions/tool-cache');

describe('installFlowpipe', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('returns cached tool path if found', async () => {
    const fakePath = '/path/to/cached/tool';
    tc.find.mockReturnValue(fakePath);

    const result = await installFlowpipe('1.0.0');

    expect(result).toBe(fakePath);
    expect(core.info).toHaveBeenCalledWith(`Found in cache @ ${fakePath}`);
  });

  describe('downloads and caches tool for different platforms and architectures', () => {
    const testCases = [
      { platform: 'linux', arch: 'x64', expectedFileName: 'linux.amd64.tar.gz' },
      { platform: 'linux', arch: 'arm64', expectedFileName: 'linux.arm64.tar.gz' },
      { platform: 'darwin', arch: 'x64', expectedFileName: 'darwin.amd64.zip' },
      { platform: 'darwin', arch: 'arm64', expectedFileName: 'darwin.arm64.zip' },
    ];

    testCases.forEach(({ platform, arch, expectedFileName }) => {
      test(`platform: ${platform}, arch: ${arch}`, async () => {
        const version = '1.0.0';
        const expectedUrl = `https://github.com/turbot/flowpipe/releases/download/${version}/flowpipe.${expectedFileName}`;
        const fakeExtractedPath = '/path/to/extracted';
        const fakeCachedPath = '/path/to/cached';
    
        // Mock implementations
        tc.find.mockReturnValueOnce('');
        tc.downloadTool.mockResolvedValue('/path/to/downloaded');
        tc.extractTar.mockResolvedValue(fakeExtractedPath);
        tc.extractZip.mockResolvedValue(fakeExtractedPath);
        tc.cacheDir.mockResolvedValue(fakeCachedPath);
    
        // Call the function
        const result = await installFlowpipe(version, arch, platform);
    
        // Assertions
        expect(tc.downloadTool).toHaveBeenCalledWith(expectedUrl);
        if (platform === 'linux') {
          expect(tc.extractTar).toHaveBeenCalledWith('/path/to/downloaded');
        } else {
          expect(tc.extractZip).toHaveBeenCalledWith('/path/to/downloaded');
        }
        expect(tc.cacheDir).toHaveBeenCalledWith(fakeExtractedPath, 'flowpipe', version, arch);
        expect(result).toBe(fakeCachedPath);
      });
    });
  });
});
