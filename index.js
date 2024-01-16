const core = require("@actions/core");
const fs = require("fs");
const path = require('path');
const exec = require("@actions/exec");
const {
  checkPlatform,
  getFlowpipeReleases,
  getVersionFromSpec,
  installFlowpipe,
  getModsToInstall,
  writeModCredentials,
} = require("./installer");

async function run() {
  try {
    core.debug("Starting Flowpipe CLI setup");
    checkPlatform();

    const version = core.getInput("flowpipe-version", { required: false });
    const modCredentials = core.getInput("mod-credentials", { required: false });
    var pluginsToInstall, uniquePluginsToInstall;

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

    core.addPath(flowpipePath);
    core.debug(`Added Flowpipe CLI to path`);

    // // Create default.spc with "update_check = false" before initialization
    // // to prevent the CLI update check too
    // await createDefaultFpc();

    // Check if the the release was correctly installed
    if (!fs.existsSync(path.join(flowpipePath, "flowpipe"))) {
      core.setFailed(`The binary flowpipe is not in the expected location using the version ${version} of flowpipe`);
      return
    }

    // Run a simple query to start the Steampipe service and initialize the DB
    
    const options = { silent: false };
    core.debug(`Executing Flowpipe initialization check Pipeline`);
    await exec.exec("flowpipe", ["pipeline", "run", "local.pipeline.checker", "--mod-location", "./pipelines"], options);
    core.debug(`Executing Flowpipe version information`);
    await exec.exec("flowpipe", ["-v"], options);

    modsRequired = getModsToInstall(modCredentials);

    if (modsRequired.length > 0) {
      core.debug(`Installing required mods`);
      await exec.exec("flowpipe", ["mod", "install", ...modsRequired], options);
      core.debug(`Writing credentials for installed mods`);
      writeModCredentials(modCredentials);
    }

    core.setOutput("steampipe-version", foundVersion);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
