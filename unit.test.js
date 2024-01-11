const exec = require("@actions/exec");
const fs = require("fs");
const {
  checkPlatform,
  getFlowpipeReleases,
  getVersionFromSpec,
  installSteampipePlugins,
  configureSteampipePlugins,
  getSteampipePluginConfig,
} = require("./installer");

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


// NOT MINE

// describe('getFlowpipeVersions', () => {
//   const mockGet = require('module-containing-get-function').get;

//   it('should return sorted version tags from a successful response', async () => {
//     // Mocking a successful response
//     const mockedResponse = [
//       JSON.stringify([
//         { tag_name: 'v1.0.2' },
//         { tag_name: 'v1.0.1' },
//         { tag_name: 'v1.0.3' },
//       ]),
//     ];
//     mockGet.mockResolvedValue(mockedResponse);

//     const versions = await getFlowpipeVersions();
//     expect(versions).toEqual(['v1.0.1', 'v1.0.2', 'v1.0.3']);
//   });

//   it('should handle an empty response', async () => {
//     // Mocking an empty response
//     mockGet.mockResolvedValue([]);

//     const versions = await getFlowpipeVersions();
//     expect(versions).toEqual([]);
//   });

//   it('should throw an error when the get function fails', async () => {
//     // Mocking a failure
//     mockGet.mockRejectedValue(new Error('Network error'));

//     await expect(getFlowpipeVersions()).rejects.toThrow('Network error');
//   });

//   // Add any other relevant test cases
// });

// describe('getFlowpipeVersions Integration Test', () => {
//   it('should fetch version tags from the actual GitHub API', async () => {
//     const versions = await getFlowpipeVersions();

//     // Check if the response is an array
//     expect(Array.isArray(versions)).toBeTruthy();

//     // Optionally check if the array is not empty (assuming there are always releases)
//     expect(versions.length).toBeGreaterThan(0);

//     // Optionally, check the format of the version tags (assuming they follow semantic versioning)
//     versions.forEach(version => {
//       expect(version).toMatch(/v\d+\.\d+\.\d+/);
//     });
//   });

// Add any other relevant integration tests
// });

// describe("getVersionFromSpec", () => {
//   const steampipeVersions = [
//     "v0.10.0",
//     "v0.10.0-beta.0",
//     "v0.10.0-beta.1",
//     "v0.10.0-beta.2",
//     "v0.10.0-beta.4",
//     "v0.10.0-beta.5",
//     "v0.10.0-dev.1",
//     "v0.10.0-dev.2",
//     "v0.11.0",
//     "v0.11.0-dev.0",
//     "v0.11.0-dev.1",
//     "v0.11.0-dev.2",
//     "v0.11.0-dev.3",
//     "v0.11.0-dev.4",
//     "v0.11.0-dev.5",
//     "v0.11.0-rc.0",
//     "v0.11.0-rc.1",
//     "v0.11.0-rc.2",
//     "v0.11.1",
//     "v0.11.2",
//     "v0.12.0",
//     "v0.12.0-rc.0",
//     "v0.12.0-rc.1",
//     "v0.12.1",
//     "v0.13.0-rc.0",
//   ];

//   it("returns the version", () => {
//     expect(getVersionFromSpec("", steampipeVersions)).toEqual("v0.12.1");
//     expect(getVersionFromSpec("v0.10.0", steampipeVersions)).toEqual("v0.10.0");
//     expect(getVersionFromSpec("latest", steampipeVersions)).toEqual("v0.12.1");
//     expect(getVersionFromSpec("^v0.11", steampipeVersions)).toEqual("v0.11.2");
//     expect(getVersionFromSpec("^v0.13", stjesteampipeVersions)).toEqual("");
//   });
// });

// jest.mock("@actions/exec");

// describe("installSteampipePlugins", () => {
//   beforeEach(() => {
//     exec.exec = jest.fn();
//   });

//   it("install the specified plugins without --progress=false", async () => {
//     await installSteampipePlugins(
//       ["github", "francois2metz/scalingo"],
//       "0.19.4"
//     );
//     expect(exec.exec).toHaveBeenCalledWith("steampipe", [
//       "plugin",
//       "install",
//       "github",
//       "francois2metz/scalingo",
//     ]);
//   });

//   it("install the specified plugins with --progress=false", async () => {
//     await installSteampipePlugins(
//       ["github", "francois2metz/scalingo"],
//       "0.20.8"
//     );
//     expect(exec.exec).toHaveBeenCalledWith("steampipe", [
//       "plugin",
//       "install",
//       "github",
//       "francois2metz/scalingo",
//       "--progress=false",
//     ]);
//   });

//   it("install nothing with undefined", async () => {
//     await installSteampipePlugins(undefined, "0.20.8");
//     expect(exec.exec).not.toHaveBeenCalled();
//   });

//   it("install nothing with empty plugins", async () => {
//     await installSteampipePlugins([], "0.20.8");
//     expect(exec.exec).not.toHaveBeenCalled();
//   });
// });

// jest.mock("fs");

// describe("configureSteampipePlugins", () => {
//   beforeEach(() => {
//     fs.promises.mkdir = jest.fn().mockResolvedValue();
//     fs.promises.writeFile = jest.fn().mockResolvedValue();
//     fs.promises.unlink = jest.fn().mockResolvedValue();
//   });

//   it("configure the plugins", async () => {
//     await configureSteampipePlugins({
//       github: { token: "test" },
//       "francois2metz/scalingo": { token: "test2" },
//     });
//     expect(fs.promises.mkdir).toHaveBeenCalledWith(
//       process.env.HOME + "/.steampipe/config",
//       { recursive: true }
//     );
//     expect(fs.promises.writeFile).toHaveBeenCalledWith(
//       process.env.HOME + "/.steampipe/config/github.json",
//       '{"connection":{"github":{"token":"test","plugin":"github"}}}'
//     );
//     expect(fs.promises.writeFile).toHaveBeenCalledWith(
//       process.env.HOME + "/.steampipe/config/scalingo.json",
//       '{"connection":{"scalingo":{"token":"test2","plugin":"francois2metz/scalingo"}}}'
//     );
//     expect(fs.promises.unlink).toHaveBeenCalledWith(
//       process.env.HOME + "/.steampipe/config/github.spc"
//     );
//     expect(fs.promises.unlink).toHaveBeenCalledWith(
//       process.env.HOME + "/.steampipe/config/scalingo.spc"
//     );
//   });
// });

// describe("getSteampipePluginConfig", () => {
//   it("returns the config for the plugin", async () => {
//     const config = getSteampipePluginConfig("github", { token: "test" });
//     expect(config).toEqual({
//       connection: {
//         github: {
//           plugin: "github",
//           token: "test",
//         },
//       },
//     });
//   });

//   it("returns multiple connections per plugin", async () => {
//     const config = getSteampipePluginConfig("github", [
//       { token: "test" },
//       { token: "test2" },
//     ]);
//     expect(config).toEqual({
//       connection: {
//         github1: {
//           plugin: "github",
//           token: "test",
//         },
//         github2: {
//           plugin: "github",
//           token: "test2",
//         },
//       },
//     });
//   });

//   it("returns config for third party plugins", async () => {
//     const config = await getSteampipePluginConfig("francois2metz/scalingo", {
//       token: "test",
//     });
//     expect(config).toEqual({
//       connection: {
//         scalingo: {
//           plugin: "francois2metz/scalingo",
//           token: "test",
//         },
//       },
//     });
//   });

//   it("returns config for plugins with specific version", async () => {
//     const config = await getSteampipePluginConfig("github:0.1", {
//       token: "test",
//     });
//     expect(config).toEqual({
//       connection: {
//         github: {
//           plugin: "github:0.1",
//           token: "test",
//         },
//       },
//     });
//   });
// });
