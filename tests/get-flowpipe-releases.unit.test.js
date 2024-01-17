const https = require("https");
const { Readable } = require("stream");
const {
  getFlowpipeReleases,
} = require("../installer");

jest.mock("https", () => ({
  get: jest.fn(),
}));

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
