const fs = require('fs');
const path = require('path');
const core = require('@actions/core');

const { writeModCredentials } = require('../installer'); // Replace with the actual path to your module

jest.mock('@actions/core');

describe('writeModCredentials', () => {
  const originalEnv = process.env;
  let mkdirSpy, writeFileSpy, readdirSpy, unlinkSpy;

  beforeEach(() => {
    process.env = { ...originalEnv, HOME: '/mock/home' };

    // Spying on fs.promises methods
    mkdirSpy = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue();
    writeFileSpy = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
    readdirSpy = jest.spyOn(fs.promises, 'readdir').mockResolvedValue([]);
    unlinkSpy = jest.spyOn(fs.promises, 'unlink').mockResolvedValue();

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('should return early if credentials are empty', async () => {
    const credentials = "";
    await writeModCredentials(credentials);
    expect(core.debug).toHaveBeenCalledWith('No custom credentials found');
    expect(writeFileSpy).not.toHaveBeenCalled();
    expect(mkdirSpy).not.toHaveBeenCalled();
    expect(readdirSpy).not.toHaveBeenCalled();
    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it('should throw an error for invalid credentials format', async () => {
    const credentials = "invalid_credentials";
    await expect(writeModCredentials(credentials)).rejects.toThrow("Unknown credentials config format");
  });

  it('should create directory, delete existing credentials, and write new credentials for valid input', async () => {
    const credentials = `
    credential "aws" "aws_01" {
      credentials    = "~/.config/gcloud/application_default_credentials.json"
    }
    credential "aws" "aws_02" {
      credentials    = "~/.config/gcloud/application_default_credentials.json"
    }
    credential "gcp" "gcp_01" {
      credentials    = "~/.config/gcloud/application_default_credentials.json"
    }
    credential "slack" "slack" {
      token    = "xoxp-asd7f8fd0fake9890"
    }
    credential "slack" "slack2" {
      token    = "xoxp-asd7f8fd0fake9890"
    }`;

    await writeModCredentials(credentials);

    const flowpipeConfigPath = path.join(process.env.HOME, ".flowpipe", "config");
    const credentialPath = path.join(flowpipeConfigPath, "credentials.fpc");

    expect(mkdirSpy).toHaveBeenCalledWith(flowpipeConfigPath, { recursive: true });
    expect(writeFileSpy).toHaveBeenCalledWith(credentialPath, credentials);
    expect(core.info).toHaveBeenCalledWith(`Writing credentials into ${credentialPath}`);
  });

  // Add more test cases as needed
});
