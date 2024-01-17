const {
  getFlowpipeReleases,
} = require("../installer");

describe("getFlowpipeReleases Integration", () => {
  it("should fetch data from GitHub API and limit the returned results", async () => {
    const data = await getFlowpipeReleases(1, 5);

    // Data check
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBe(5);

    // Data structure check
    if (data.length > 0) {
      expect(data[0]).toHaveProperty("url");
      expect(data[0]).toHaveProperty("tag_name");
    }
  });

  it("should fetch data from GitHub API and not limit the returned results", async () => {
    const data = await getFlowpipeReleases(1);

    // Data check
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(5);

    // Data structure check
    if (data.length > 0) {
      expect(data[0]).toHaveProperty("url");
      expect(data[0]).toHaveProperty("tag_name");
    }
  });

  it("should fetch data from GitHub API and not page", async () => {
    const data = await getFlowpipeReleases(5, 5);

    // Data check
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBe(5);

    // Data structure check
    if (data.length > 0) {
      expect(data[0]).toHaveProperty("url");
      expect(data[0]).toHaveProperty("tag_name");
    }
  });
});
