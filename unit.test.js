const https = require("https");
const { Readable } = require('stream'); // Import Readable from the 'stream' module
const { checkPlatform, getFlowpipeReleases} = require("./installer");

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

describe('getFlowpipeReleases', () => {
  it('should return 5 items with 1 per page', async () => {
    // Create dummy data with 100 items
    const dummyData = new Array(100).fill(null).map((_, index) => ({
      id: index,
      url: `https://api.github.com/repos/turbot/flowpipe/releases/${index}`,
    }));

    // Mock implementation to simulate pagination
    https.get.mockImplementation((url, _, callback) => {
      const urlObj = new URL(url);
      const page = parseInt(urlObj.searchParams.get('page'));
      const perPage = parseInt(urlObj.searchParams.get('per_page'));

      const totalItems = 100;
      const totalPages = Math.ceil(totalItems / perPage);
      const start = (page - 1) * perPage;
      const end = start + perPage;

      const res = new Readable({
        read() {}
      });
      res.headers = {
        link: `<${urlObj.origin}${urlObj.pathname}?per_page=${perPage}&page=${page + 1}>; rel="next", <${urlObj.origin}${urlObj.pathname}?per_page=${perPage}&page=${totalPages}>; rel="last"`,
      };

      process.nextTick(() => {
        res.emit('data', JSON.stringify(dummyData.slice(start, end)));
        res.emit('end');
      });

      callback(res);
      return res;
    });

    const releases = await getFlowpipeReleases(1, 5);
    expect(releases.length).toEqual(5);
    expect(releases).toEqual(dummyData.slice(0, 5));
  });

  it('should return 5 items with 5 per page', async () => {
    // Create dummy data with 100 items
    const dummyData = new Array(100).fill(null).map((_, index) => ({
      id: index,
      url: `https://api.github.com/repos/turbot/flowpipe/releases/${index}`,
    }));

    // Mock implementation to simulate pagination
    https.get.mockImplementation((url, _, callback) => {
      const urlObj = new URL(url);
      const page = parseInt(urlObj.searchParams.get('page'));
      const perPage = parseInt(urlObj.searchParams.get('per_page'));

      const totalItems = 100;
      const totalPages = Math.ceil(totalItems / perPage);
      const start = (page - 1) * perPage;
      const end = start + perPage;

      const res = new Readable({
        read() {}
      });
      res.headers = {
        link: `<${urlObj.origin}${urlObj.pathname}?per_page=${perPage}&page=${page + 1}>; rel="next", <${urlObj.origin}${urlObj.pathname}?per_page=${perPage}&page=${totalPages}>; rel="last"`,
      };

      process.nextTick(() => {
        res.emit('data', JSON.stringify(dummyData.slice(start, end)));
        res.emit('end');
      });

      callback(res);
      return res;
    });

    const releases = await getFlowpipeReleases(5, 5);
    expect(releases.length).toEqual(5);
    expect(releases).toEqual(dummyData.slice(0, 5));
  });

  it('should return 5 items with 10 items per page since max is set to 5', async () => {
    // Create dummy data with 100 items
    const dummyData = new Array(100).fill(null).map((_, index) => ({
      id: index,
      url: `https://api.github.com/repos/turbot/flowpipe/releases/${index}`,
    }));

    // Mock implementation to simulate pagination
    https.get.mockImplementation((url, _, callback) => {
      const urlObj = new URL(url);
      const page = parseInt(urlObj.searchParams.get('page'));
      const perPage = parseInt(urlObj.searchParams.get('per_page'));

      const totalItems = 100;
      const totalPages = Math.ceil(totalItems / perPage);
      const start = (page - 1) * perPage;
      const end = start + perPage;

      const res = new Readable({
        read() {}
      });
      res.headers = {
        link: `<${urlObj.origin}${urlObj.pathname}?per_page=${perPage}&page=${page + 1}>; rel="next", <${urlObj.origin}${urlObj.pathname}?per_page=${perPage}&page=${totalPages}>; rel="last"`,
      };

      process.nextTick(() => {
        res.emit('data', JSON.stringify(dummyData.slice(start, end)));
        res.emit('end');
      });

      callback(res);
      return res;
    });

    const releases = await getFlowpipeReleases(10, 5);
    expect(releases.length).toEqual(5);
    expect(releases).toEqual(dummyData.slice(0, 5));
  });

  it('should return 100 items with 100 per page', async () => {
    // Create dummy data with 100 items
    const dummyData = new Array(100).fill(null).map((_, index) => ({
      id: index,
      url: `https://api.github.com/repos/turbot/flowpipe/releases/${index}`,
    }));

    // Mock implementation to simulate pagination
    https.get.mockImplementation((url, _, callback) => {
      const urlObj = new URL(url);
      const page = parseInt(urlObj.searchParams.get('page'));
      const perPage = parseInt(urlObj.searchParams.get('per_page'));

      const totalItems = dummyData.length;
      const totalPages = Math.ceil(totalItems / perPage);
      const start = (page - 1) * perPage;
      const end = start + perPage;

      const res = new Readable({
        read() {}
      });
      res.headers = {
        link: end < totalItems ? `<${urlObj.origin}${urlObj.pathname}?per_page=${perPage}&page=${page + 1}>; rel="next", <${urlObj.origin}${urlObj.pathname}?per_page=${perPage}&page=${totalPages}>; rel="last"`: undefined,
      };

      process.nextTick(() => {
        res.emit('data', JSON.stringify(dummyData.slice(start, end)));
        res.emit('end');
      });

      callback(res);
      return res;
    });

    const releases = await getFlowpipeReleases(100);
    expect(releases.length).toEqual(100);
    expect(releases).toEqual(dummyData);
  });

  it('should return 100 items with 200 per page since there is only 100 items', async () => {
    // Create dummy data with 100 items
    const dummyData = new Array(100).fill(null).map((_, index) => ({
      id: index,
      url: `https://api.github.com/repos/turbot/flowpipe/releases/${index}`,
    }));

    // Mock implementation to simulate pagination
    https.get.mockImplementation((url, _, callback) => {
      const urlObj = new URL(url);
      const page = parseInt(urlObj.searchParams.get('page'));
      const perPage = parseInt(urlObj.searchParams.get('per_page'));

      const totalItems = dummyData.length;
      const totalPages = Math.ceil(totalItems / perPage);
      const start = (page - 1) * perPage;
      const end = start + perPage;

      const res = new Readable({
        read() {}
      });
      res.headers = {
        link: end < totalItems ? `<${urlObj.origin}${urlObj.pathname}?per_page=${perPage}&page=${page + 1}>; rel="next", <${urlObj.origin}${urlObj.pathname}?per_page=${perPage}&page=${totalPages}>; rel="last"`: undefined,
      };

      process.nextTick(() => {
        res.emit('data', JSON.stringify(dummyData.slice(start, end)));
        res.emit('end');
      });

      callback(res);
      return res;
    });

    const releases = await getFlowpipeReleases(200);
    expect(releases.length).toEqual(100);
    expect(releases).toEqual(dummyData);
  });
});