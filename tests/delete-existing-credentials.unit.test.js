const fs = require('fs');
const core = require('@actions/core');
const { deleteExistingCredentials } = require('../installer');

jest.mock('@actions/core');

describe('deleteExistingCredentials', () => {
  let readdirSpy, unlinkSpy;

  beforeEach(() => {
    // Set up spies
    readdirSpy = jest.spyOn(fs.promises, 'readdir').mockResolvedValue([]);
    unlinkSpy = jest.spyOn(fs.promises, 'unlink').mockResolvedValue();

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should delete all files except workspaces.fpc', async () => {
    const testPath = '/test/path';
    const files = ['file1.fp', 'workspaces.fpc', 'file2.fp'];
  
    readdirSpy.mockResolvedValue(files);
  
    await deleteExistingCredentials(testPath);
  
    expect(core.info).toHaveBeenCalledWith('Deleting existing files in Flowpipe config directory');
    expect(readdirSpy).toHaveBeenCalledWith(testPath);
    expect(unlinkSpy).toHaveBeenCalledWith('/test/path/file1.fp');
    expect(unlinkSpy).toHaveBeenCalledWith('/test/path/file2.fp');
    expect(unlinkSpy).not.toHaveBeenCalledWith('/test/path/workspaces.fpc');
  });

  it('should handle empty directories without deleting files', async () => {
    const testPath = '/empty/path';
    readdirSpy.mockResolvedValue([]);

    await deleteExistingCredentials(testPath);

    expect(readdirSpy).toHaveBeenCalledWith(testPath);
    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it('should handle errors thrown by readdir', async () => {
    const testPath = '/error/path';
    const error = new Error('Filesystem error');
    readdirSpy.mockRejectedValue(error);

    await expect(deleteExistingCredentials(testPath)).rejects.toThrow('Filesystem error');

    expect(readdirSpy).toHaveBeenCalledWith(testPath);
    expect(unlinkSpy).not.toHaveBeenCalled();
  });
});
