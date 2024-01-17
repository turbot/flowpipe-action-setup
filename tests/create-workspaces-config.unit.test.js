const fs = require('fs');
const path = require('path');
const { createWorkspacesConfig } = require('../installer');

describe('createWorkspacesConfig', () => {
  let mkdirSpy, writeFileSpy;
  const originalEnv = process.env;

  beforeEach(() => {
    // Set up environment variable
    process.env = { ...originalEnv, HOME: '/mock/home' };

    // Set up spies
    mkdirSpy = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue();
    writeFileSpy = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('should create the workspaces config file with correct content', async () => {
    await createWorkspacesConfig();

    const flowpipeConfigPath = path.join(process.env.HOME, ".flowpipe", "config");
    const workspacesPath = path.join(flowpipeConfigPath, "workspaces.fpc");
    const expectedContent = `
  workspace "default" {
    update_check = false
  }`;

    expect(mkdirSpy).toHaveBeenCalledWith(flowpipeConfigPath, { recursive: true });
    expect(writeFileSpy).toHaveBeenCalledWith(workspacesPath, expectedContent);
  });
});
