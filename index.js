const core = require("@actions/core");
const fs = require("fs");
const path = require('path');
const exec = require("@actions/exec");
const {
  checkPlatform,
  getFlowpipeReleases,
  getVersionFromSpec,
  installFlowpipe,
  writeModCredentials,
  createWorkspacesConfig,
} = require("./installer");

async function run() {
  try {
    core.debug("Starting Flowpipe CLI setup");
    checkPlatform();

    const version = core.getInput("flowpipe-version", { required: false });
    const credentials = core.getInput("mod-credentials", { required: false });

    // Limit to last 300 releases to reduce API calls
    core.debug("Retrieving last 300 Flowpipe releases");
    const flowpipeReleases = await getFlowpipeReleases(undefined, 300, false);
    core.debug("Checking for requested version");
    const foundVersion = getVersionFromSpec(flowpipeReleases, version);

    if (!foundVersion) {
      throw new Error(`Unable to find Flowpipe version '${version}'.`);
    }

    const foundVersionNumber = foundVersion.tag_name;
    core.info(`Flowpipe CLI version: ${foundVersionNumber}`);
    const flowpipePath = await installFlowpipe(foundVersionNumber);

    // Check if the the release was correctly installed
    if (!fs.existsSync(path.join(flowpipePath, "flowpipe"))) {
      throw new Error(`The binary flowpipe is not in the expected location using the version ${version} of flowpipe`);
    }

    // Add Flowpipe CLI to path
    core.addPath(flowpipePath);
    core.debug(`Added Flowpipe CLI to path`);

    // // Create default.spc with "update_check = false" before initialization
    // // to prevent the CLI update check too
    await createWorkspacesConfig();

    core.debug(`Executing Flowpipe version information`);
    const options = { silent: false };
    await exec.exec("flowpipe", ["-v"], options);

    core.debug(`Checking for custom credentials`);
    writeModCredentials(credentials);

    core.setOutput("steampipe-version", foundVersion);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
