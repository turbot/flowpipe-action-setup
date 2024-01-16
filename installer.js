const core = require("@actions/core");
const tc = require("@actions/tool-cache");
const hcl = require("js-hcl-parser");
const semver = require("semver");
const https = require("https");
const process = require("process");
const { stringify } = require("querystring");

const supportedPlatforms = ["linux", "darwin"];
const supportedArchitectures = ["x64", "arm64"];

function checkPlatform(p = process) {
  if (
    !supportedPlatforms.includes(p.platform) ||
    !supportedArchitectures.includes(p.arch)
  ) {
    throw new Error(
      `turbot/flowpipe-action-setup currently supports the platforms ${supportedPlatforms.join(
        ", "
      )} using architectures ${supportedArchitectures.join(", ")}`
    );
  }
}

function httpsGet(url, useReal = true) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'setup-flowpipe'
      },
      rejectUnauthorized: useReal
    };

    https.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          // Resolve with both the data and the headers
          resolve({
            body: JSON.parse(data),
            headers: res.headers
          });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (e) => {
      reject(e);
    });
  });
}

async function getFlowpipeReleases(perPage = 100, maxResults = Infinity, useReal = true) {
  var url = 'https://api.github.com/repos/turbot/flowpipe/releases';

  if (!useReal) {
    url = 'https://localhost:3000/repos/turbot/flowpipe/releases';
  }

  let releases = [];
  let page = 1;
  let hasNextPage = true;
  let totalCollected = 0;

  while (hasNextPage && totalCollected < maxResults) {
    try {
      const fullUrl = `${url}?per_page=${perPage}&page=${page}`;
      const { body: releasesData, headers: responseHeaders } = await httpsGet(fullUrl, useReal);

      // If maxResults is exceeded, trim the results
      if (totalCollected + releasesData.length > maxResults) {
        releases = releases.concat(releasesData.slice(0, maxResults - totalCollected));
        break;
      } else {
        releases = releases.concat(releasesData);
      }

      totalCollected += releasesData.length;

      // Check if paging
      const linkHeader = responseHeaders.link;
      hasNextPage = linkHeader && linkHeader.includes('rel="next"');
      page++;
    } catch (error) {
      console.error('Error fetching data:', error);
      break;
    }
  }

  return releases;
}

function getVersionFromSpec(releases, desiredVersion = undefined) {
  releases.sort((a, b) => semver.compare(b.tag_name, a.tag_name));

  let foundVersion;
  if (desiredVersion === "latest" || desiredVersion === "" || desiredVersion === undefined) {
    foundVersion = releases[0];
  } else if (semver.valid(desiredVersion)) {
    // Check if desiredVersion is a valid semantic version before finding
    foundVersion = releases.find((item) => semver.eq(item.tag_name, desiredVersion)) || undefined;
  } else {
    // If desiredVersion is not valid, return undefined
    foundVersion = undefined;
  }

  if (foundVersion) {
    core.debug(`Matched Flowpipe CLI version: ${foundVersion}`);
  } else {
    core.debug(`No matching Flowpipe CLI version found for ${desiredVersion}`);
  }

  return foundVersion;
}

async function installFlowpipe(flowpipeVersion) {
  const toolPath = tc.find("flowpipe", flowpipeVersion, process.arch);

  if (toolPath) {
    core.info(`Found in cache @ ${toolPath}`);
    return toolPath;
  } else {
    const targets = {
      linux: {
        x64: "linux.amd64.tar.gz",
        arm64: "linux.arm64.tar.gz",
      },
      darwin: {
        x64: "darwin.amd64.zip",
        arm64: "darwin.arm64.zip",
      },
    };
    const target = targets[process.platform][process.arch];

    const downloadUrl = `https://github.com/turbot/flowpipe/releases/download/${flowpipeVersion}/flowpipe.${target}`;
    core.info(`Flowpipe download URL: ${downloadUrl.toString()}`);

    const flowpipeArchivePath = await tc.downloadTool(downloadUrl);
    const extractFolder = await (async () => {
      if (process.platform === "linux") {
        return tc.extractTar(flowpipeArchivePath);
      } else {
        return tc.extractZip(flowpipeArchivePath);
      }
    })();

    return await tc.cacheDir(extractFolder, "flowpipe", flowpipeVersion, process.arch);
  }
}

function getModsToInstall(credentials) {
  if (credentials == ""){
    return []
  }
  res = hcl.stringify(credentials);
  if (res.startsWith("unable to parse HCL:")) {
    throw new Error("Unknown credentials config format");
  }

  let credentialsHclParsed = hcl.parse(credentials);
  let credentialsJsonParsed = JSON.parse(credentialsHclParsed);

  if (!Object.getOwnPropertyDescriptor(credentialsJsonParsed, "credential")) {
    throw new Error(
      "Missing 'credential' key in mod-credentials input"
    );
  }

  let uniqueCredentials = new Set();
  
  if (credentialsJsonParsed && Array.isArray(credentialsJsonParsed["credential"])) {
    for (const credential of credentialsJsonParsed["credential"]) {
      for (const key of Object.keys(credential)) {
        uniqueCredentials.add(key);
      }
    }
  }

  return (Array.from(uniqueCredentials).sort());
}


async function installFlowpipeMods(mods, steampipeVersion) {
  if (!plugins || plugins.length == 0) {
    return Promise.resolve();
  }

  core.info(`Installing plugins: ${plugins}`);

  const args = ["plugin", "install", ...plugins];

  // The progress flag is only available >=0.20.0 and helps hide noisy progress
  // bars
  if (semver.satisfies(steampipeVersion, ">=0.20.0")) {
    args.push("--progress=false");
  }

  await exec.exec("steampipe", args);
}

module.exports = {
  checkPlatform,
  getFlowpipeReleases,
  getVersionFromSpec,
  getModsToInstall,
  installFlowpipe
};
