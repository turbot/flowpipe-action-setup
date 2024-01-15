const core = require("@actions/core");
const tc = require("@actions/tool-cache");
const exec = require("@actions/exec");
const {
  checkPlatform,
  getFlowpipeReleases,
  getVersionFromSpec,
  installFlowpipe,
  // configureSteampipePlugins,
  // createDefaultSpc,
  // deletePluginConfigs,
  // getPluginsToInstall,
  // getSteampipeVersions,
  // installSteampipe,
  // installSteampipePlugins,
  // writePluginConnections,
} = require("./installer");

async function run() {
  try {
    core.info("Starting Flowpipe CLI setup");
    checkPlatform();

    const version = core.getInput("flowpipe-version", { required: false });
    const pluginConns = core.getInput("plugin-connections");
    var pluginsToInstall, uniquePluginsToInstall;

    // Limit to last 300 releases to reduce API calls
    core.info("Retrieving last 300 Flowpipe releases");
    const flowpipeReleases = await getFlowpipeReleases(undefined, 300, false);
    core.info("Checking for requested version");
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

    // Run a simple query to start the Steampipe service and initialize the DB
    core.debug(`Executing Flowpipe initialization check Pipeline`);
    
    const options = { silent: false };
    await exec.exec("flowpipe", ["pipeline", "run", "local.pipeline.initialization", "--mod-location", "./initialization-mod"], options);

    // Plugin installation and configuration is optional
    if (pluginConns != "") {
      pluginsToInstall = getPluginsToInstall(pluginConns);
      uniquePluginsToInstall = [...new Set(pluginsToInstall)];
      await installSteampipePlugins(uniquePluginsToInstall, foundVersion);
      // Remove default spc files created by plugin installation
      await deletePluginConfigs();
      await writePluginConnections(pluginConns);
    }

    core.setOutput("steampipe-version", foundVersion);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
