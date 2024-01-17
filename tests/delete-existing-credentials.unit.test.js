const core = require('@actions/core');
const fsPromises = require('fs').promises;
const {
  deleteExistingCredentials
} = require("../installer");

jest.mock('@actions/core');

describe('deleteExistingCredentials', () => {
  const originalHome = process.env.HOME;

  beforeEach(() => {
    process.env.HOME = '/mocked/home';
    jest.spyOn(fsPromises, 'readdir').mockResolvedValue([]);
    jest.spyOn(fsPromises, 'unlink').mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.HOME = originalHome;
  });

  test('successfully deletes files, excluding specified file', async () => {
    const mockFiles = ['credentials.toml', 'config.toml', 'workspaces.fpc.sample'];
    fsPromises.readdir.mockResolvedValue(mockFiles);

    await deleteExistingCredentials();

    expect(core.info).toHaveBeenCalledWith('Deleting existing files in Flowpipe config directory');
    expect(fsPromises.readdir).toHaveBeenCalledWith('/mocked/home/.steampipe/config');
    expect(fsPromises.unlink).toHaveBeenCalledWith('/mocked/home/.steampipe/config/credentials.toml');
    expect(fsPromises.unlink).toHaveBeenCalledWith('/mocked/home/.steampipe/config/config.toml');
    expect(fsPromises.unlink).not.toHaveBeenCalledWith('/mocked/home/.steampipe/config/workspaces.fpc.sample');
  });

  test('handles errors during directory reading', async () => {
    const readdirError = new Error('Failed to read directory');
    fsPromises.readdir.mockRejectedValue(readdirError);

    await expect(deleteExistingCredentials()).rejects.toThrow(readdirError);
  });

  test('handles errors during file deletion', async () => {
    fsPromises.readdir.mockResolvedValue(['credentials.toml']);
    const unlinkError = new Error('Failed to delete file');
    fsPromises.unlink.mockRejectedValueOnce(unlinkError);

    await expect(deleteExistingCredentials()).rejects.toThrow(unlinkError);
  });
});
