const https = require("https");
const process = require("process");

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

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'setup-flowpipe' // Use your app name or GitHub username
      }
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

async function getFlowpipeReleases(perPage = 100, maxResults = Infinity) {
  const url = 'https://api.github.com/repos/turbot/flowpipe/releases';
  let releases = [];
  let page = 1;
  let hasNextPage = true;
  let totalCollected = 0;

  while (hasNextPage && totalCollected < maxResults) {
    try {
      const fullUrl = `${url}?per_page=${perPage}&page=${page}`;
      const { body: releasesData, headers: responseHeaders } = await httpsGet(fullUrl);
      
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

module.exports = {
  checkPlatform,
  getFlowpipeReleases,
  httpsGet
};
