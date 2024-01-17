const core = require('@actions/core');
const fsPromises = require('fs').promises;
const {
  createFlowpipeConfigDir,
} = require("../installer");

jest.mock('@actions/core');

describe('createFlowpipeConfigDir', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('successfully creates a directory', async () => {
    const path = '/path/to/config';
    jest.spyOn(fsPromises, 'mkdir').mockResolvedValue();

    await createFlowpipeConfigDir(path);

    expect(fsPromises.mkdir).toHaveBeenCalledWith(path, { recursive: true });
    expect(core.debug).toHaveBeenCalledWith('Create Flowpipe config directory');
  });

  test('handles errors during directory creation', async () => {
    const path = '/path/to/config';
    const error = new Error('Mocked error');
    jest.spyOn(fsPromises, 'mkdir').mockRejectedValue(error);

    await expect(createFlowpipeConfigDir(path)).rejects.toThrow(error);

    expect(fsPromises.mkdir).toHaveBeenCalledWith(path, { recursive: true });
    expect(core.debug).toHaveBeenCalledWith('Create Flowpipe config directory');
  });
});