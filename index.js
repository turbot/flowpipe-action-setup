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

const workspaceContent = `workspace "default" {
  update_check = false
}`;

const useReal = true

async function run() {
  try {
    core.debug("Starting Flowpipe CLI setup");
    checkPlatform();

    const version = core.getInput("flowpipe-version", { required: false });
    const credentials = core.getInput("mod-credentials", { required: false });

    // Limit to last 100 releases to reduce API calls
    core.debug("Retrieving last 100 Flowpipe releases");
    const flowpipeReleases = await getFlowpipeReleases(undefined, 100, useReal);
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

    // // Create workspaces.fpc with "update_check = false" before initialization
    // // to prevent the CLI update check too
    await createWorkspacesConfig(workspaceContent);

    core.debug(`Executing Flowpipe version information`);
    const options = { silent: false };
    await exec.exec("flowpipe", ["-v"], options);

    core.debug(`Checking for custom credentials`);
    writeModCredentials(credentials);

    core.setOutput("flowpipe-url", foundVersion.html_url);
    core.setOutput("flowpipe-version", foundVersion.tag_name);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
