const https = require("https");
const { Readable } = require("stream");
const {
  getFlowpipeReleases,
  getVersionFromSpec,
} = require("../installer");

jest.mock("https", () => ({
  get: jest.fn(),
}));

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
