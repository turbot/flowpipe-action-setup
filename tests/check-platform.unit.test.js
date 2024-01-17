const {
  checkPlatform,
} = require("../installer");

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
