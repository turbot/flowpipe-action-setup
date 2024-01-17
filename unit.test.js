const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const fsPromises = require('fs').promises;
const https = require("https");
const { Readable } = require("stream");
const {
  checkPlatform,
  getFlowpipeReleases,
  getVersionFromSpec,
  getModsToInstall,
  installFlowpipe,

  createFlowpipeConfigDir,
  deleteExistingCredentials
} = require("./installer");

jest.mock('@actions/core');
jest.mock('@actions/tool-cache');

jest.mock("https", () => ({
  get: jest.fn(),
}));

describe("checkPlatform", () => {
  const workingPlatforms = ["linux", "darwin"];
  const nonWorkingPlatforms = ["aix", "freebsd", "openbsd", "sunos", "win32"];
  const workingArchitectures = ["x64", "arm64"];
  const nonWorkingArchitectures = [
    "arm",
    "ia32",
    "mips",
    "mipsel",
    "ppc",
    "ppc64",
    "s390",
    "s390x",
  ];
  const errorMessage =
    "turbot/flowpipe-action-setup currently supports the platforms linux, darwin using architectures x64, arm64";

  // Test for working combinations
  workingPlatforms.forEach((platform) => {
    workingArchitectures.forEach((arch) => {
      test(`should work on supported platform/architecture: ${platform}/${arch}`, () => {
        expect(() => {
          checkPlatform({ platform, arch });
        }).not.toThrow();
      });
    });
  });

  // Test for non-working combinations due to architecture
  workingPlatforms.forEach((platform) => {
    nonWorkingArchitectures.forEach((arch) => {
      test(`should not work on supported platform with unsupported architecture: ${platform}/${arch}`, () => {
        expect(() => {
          checkPlatform({ platform, arch });
        }).toThrow(errorMessage);
      });
    });
  });

  // Test for non-working combinations due to platform
  nonWorkingPlatforms.forEach((platform) => {
    [...workingArchitectures, ...nonWorkingArchitectures].forEach((arch) => {
      test(`should not work on unsupported platform regardless of architecture: ${platform}/${arch}`, () => {
        expect(() => {
          checkPlatform({ platform, arch });
        }).toThrow(errorMessage);
      });
    });
  });
});

describe("getFlowpipeReleases", () => {
  let dummyData;

  beforeEach(() => {
    // Create dummy data with 100 items
    dummyData = new Array(100).fill(null).map((_, index) => ({
      id: index,
      url: `https://api.github.com/repos/turbot/flowpipe/releases/${index}`,
      tag_name: `v${index % 5}.0.${Math.floor(Math.random() * (3000000000 - 1000000000 + 1)) + 1000000000
        }`,
    }));

    // Mock implementation to simulate pagination
    https.get.mockImplementation((url, _, callback) => {
      const urlObj = new URL(url);
      const page = parseInt(urlObj.searchParams.get("page"));
      const perPage = parseInt(urlObj.searchParams.get("per_page"));

      const totalItems = 100;
      const totalPages = Math.ceil(totalItems / perPage);
      const start = (page - 1) * perPage;
      const end = start + perPage;

      const res = new Readable({
        read() { },
      });
      res.headers = {
        link:
          end < totalItems
            ? `<${urlObj.origin}${urlObj.pathname}?per_page=${perPage}&page=${page + 1
            }>; rel="next", <${urlObj.origin}${urlObj.pathname
            }?per_page=${perPage}&page=${totalPages}>; rel="last"`
            : undefined,
      };

      process.nextTick(() => {
        res.emit("data", JSON.stringify(dummyData.slice(start, end)));
        res.emit("end");
      });

      callback(res);
      return res;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 5 items with 1 per page", async () => {
    const releases = await getFlowpipeReleases(1, 5);
    expect(releases.length).toEqual(5);
    expect(releases).toEqual(dummyData.slice(0, 5));
  });

  it("should return 5 items with 5 per page", async () => {
    const releases = await getFlowpipeReleases(5, 5);
    expect(releases.length).toEqual(5);
    expect(releases).toEqual(dummyData.slice(0, 5));
  });

  it("should return 5 items with 10 items per page since max is set to 5", async () => {
    const releases = await getFlowpipeReleases(10, 5);
    expect(releases.length).toEqual(5);
    expect(releases).toEqual(dummyData.slice(0, 5));
  });

  it("should return 100 items with 100 per page", async () => {
    const releases = await getFlowpipeReleases(100);
    expect(releases.length).toEqual(100);
    expect(releases).toEqual(dummyData);
  });

  it("should return 100 items with 200 per page since there is only 100 items", async () => {
    const releases = await getFlowpipeReleases(200);
    expect(releases.length).toEqual(100);
    expect(releases).toEqual(dummyData);
  });
});

describe("getVersionFromSpec", () => {
  let dummyData;

  beforeEach(() => {
    // Create dummy data with 100 items
    dummyData = new Array(100).fill(null).map((_, index) => ({
      id: index,
      url: `https://api.github.com/repos/turbot/flowpipe/releases/${index}`,
      tag_name: `v${index % 5}.0.${Math.floor(Math.random() * (9000000000 - 1000000000 + 1)) + 1000000000
        }`,
    }));

    dummyData[50].tag_name = 'v5.0.0';

    // Mock implementation to simulate pagination
    https.get.mockImplementation((url, _, callback) => {
      const urlObj = new URL(url);
      const page = parseInt(urlObj.searchParams.get("page"));
      const perPage = parseInt(urlObj.searchParams.get("per_page"));

      const totalItems = 100;
      const totalPages = Math.ceil(totalItems / perPage);
      const start = (page - 1) * perPage;
      const end = start + perPage;

      const res = new Readable({
        read() { },
      });
      res.headers = {
        link:
          end < totalItems
            ? `<${urlObj.origin}${urlObj.pathname}?per_page=${perPage}&page=${page + 1
            }>; rel="next", <${urlObj.origin}${urlObj.pathname
            }?per_page=${perPage}&page=${totalPages}>; rel="last"`
            : undefined,
      };

      process.nextTick(() => {
        res.emit("data", JSON.stringify(dummyData.slice(start, end)));
        res.emit("end");
      });

      callback(res);
      return res;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("return latest release if desired version is not passed in", async () => {
    const flowpipeReleases = await getFlowpipeReleases(200);
    const versionToInstall = getVersionFromSpec(flowpipeReleases);
    expect(versionToInstall).toEqual(dummyData[50]);
  });

  it("return latest release if desired version is undefined", async () => {
    const flowpipeReleases = await getFlowpipeReleases(200);
    const versionToInstall = getVersionFromSpec(flowpipeReleases);
    expect(versionToInstall).toEqual(dummyData[50]);
  });

  it("return latest release if desired version is an empty string", async () => {
    const flowpipeReleases = await getFlowpipeReleases(200);
    const versionToInstall = getVersionFromSpec(flowpipeReleases);
    expect(versionToInstall).toEqual(dummyData[50]);
  });

  it("return latest release if desired version is a specified version", async () => {
    const flowpipeReleases = await getFlowpipeReleases(200);
    const versionToInstall = getVersionFromSpec(flowpipeReleases, dummyData[25].tag_name);
    expect(versionToInstall).toEqual(dummyData[25]);
  });

  it("return latest release if desired version is a not a known version", async () => {
    const flowpipeReleases = await getFlowpipeReleases(200);
    const versionToInstall = getVersionFromSpec(flowpipeReleases, 'unknown');
    expect(versionToInstall).toBeUndefined();
  });
});

describe('createFlowpipeConfigDir', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('successfully creates a directory', async () => {
    const path = '/path/to/config';
    jest.spyOn(fsPromises, 'mkdir').mockResolvedValue();

    await createFlowpipeConfigDir(path);

    expect(fsPromises.mkdir).toHaveBeenCalledWith(path, { recursive: true });
    expect(core.debug).toHaveBeenCalledWith('Create Flowpipe config directory');
  });

  test('handles errors during directory creation', async () => {
    const path = '/path/to/config';
    const error = new Error('Mocked error');
    jest.spyOn(fsPromises, 'mkdir').mockRejectedValue(error);

    await expect(createFlowpipeConfigDir(path)).rejects.toThrow(error);

    expect(fsPromises.mkdir).toHaveBeenCalledWith(path, { recursive: true });
    expect(core.debug).toHaveBeenCalledWith('Create Flowpipe config directory');
  });
});

describe('deleteExistingCredentials', () => {
  const originalHome = process.env.HOME;

  beforeEach(() => {
    process.env.HOME = '/mocked/home';
    jest.spyOn(fsPromises, 'readdir').mockResolvedValue([]);
    jest.spyOn(fsPromises, 'unlink').mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.HOME = originalHome;
  });

  test('successfully deletes files, excluding specified file', async () => {
    const mockFiles = ['credentials.toml', 'config.toml', 'workspaces.fpc.sample'];
    fsPromises.readdir.mockResolvedValue(mockFiles);

    await deleteExistingCredentials();

    expect(core.info).toHaveBeenCalledWith('Deleting existing files in Flowpipe config directory');
    expect(fsPromises.readdir).toHaveBeenCalledWith('/mocked/home/.steampipe/config');
    expect(fsPromises.unlink).toHaveBeenCalledWith('/mocked/home/.steampipe/config/credentials.toml');
    expect(fsPromises.unlink).toHaveBeenCalledWith('/mocked/home/.steampipe/config/config.toml');
    expect(fsPromises.unlink).not.toHaveBeenCalledWith('/mocked/home/.steampipe/config/workspaces.fpc.sample');
  });

  test('handles errors during directory reading', async () => {
    const readdirError = new Error('Failed to read directory');
    fsPromises.readdir.mockRejectedValue(readdirError);

    await expect(deleteExistingCredentials()).rejects.toThrow(readdirError);
  });

  test('handles errors during file deletion', async () => {
    fsPromises.readdir.mockResolvedValue(['credentials.toml']);
    const unlinkError = new Error('Failed to delete file');
    fsPromises.unlink.mockRejectedValueOnce(unlinkError);

    await expect(deleteExistingCredentials()).rejects.toThrow(unlinkError);
  });
});

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

describe('getModsToInstall', () => {
  it('should return "empty" for empty credentials', () => {
    expect(getModsToInstall("")).toEqual([]);
  });

  it('should throw an error for invalid HCL format', () => {
    expect(() => getModsToInstall("invalid HCL")).toThrow("Unknown credentials config format");
  });

  // This test assumes that 'hcl.parse' will throw an error for invalid JSON format
  it('should throw an error for valid HCL but invalid JSON format', () => {
    const invalidJsonHcl = `
    credential "slack" "slack" {
      token = "xoxp-asd7f8fd0fake9890"
      extra = { "channel": "general", "active": }
    }`;

    expect(() => getModsToInstall(invalidJsonHcl)).toThrow();
  });

  it('should throw an error if "credential" key is missing in JSON', () => {
    const validHclWithoutCredential = `
    config "gcp" {
      project_id = "my-gcp-project"
      region     = "us-central1"
    }
    
    config "aws" {
      access_key = "AKIAIOSFODNN7EXAMPLE"
      secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
    }`;

    expect(() => getModsToInstall(validHclWithoutCredential)).toThrow("Missing 'credential' key in mod-credentials input");
  });

  it('should return connection data for valid input', () => {
    const validCredentials = `
    credential "aws" "aws_01" {
      credentials    = "~/.config/gcloud/application_default_credentials.json"
    }
    credential "aws" "aws_02" {
      credentials    = "~/.config/gcloud/application_default_credentials.json"
    }
    credential "gcp" "gcp_01" {
      credentials    = "~/.config/gcloud/application_default_credentials.json"
    }
    credential "slack" "slack" {
      token    = "xoxp-asd7f8fd0fake9890"
    }
    credential "slack" "slack2" {
      token    = "xoxp-asd7f8fd0fake9890"
    }`;

    const expectedConnectionData = ["aws", "gcp", "slack"]; // Expected sorted array
    expect(getModsToInstall(validCredentials).sort()).toEqual(expectedConnectionData);
  });
});