const {
  getModsToInstall,
} = require("../installer");

describe('getModsToInstall', () => {
  it('should return "empty" for empty credentials', () => {
    expect(getModsToInstall("")).toEqual([]);
  });

  it('should throw an error for invalid HCL format', () => {
    expect(() => getModsToInstall("invalid HCL")).toThrow("Unknown credentials config format");
  });

  // This test assumes that 'hcl.parse' will throw an error for invalid JSON format
  it('should throw an error for valid HCL but invalid JSON format', () => {
    const invalidJsonHcl = `
    credential "slack" "slack" {
      token = "xoxp-asd7f8fd0fake9890"
      extra = { "channel": "general", "active": }
    }`;

    expect(() => getModsToInstall(invalidJsonHcl)).toThrow();
  });

  it('should throw an error if "credential" key is missing in JSON', () => {
    const validHclWithoutCredential = `
    config "gcp" {
      project_id = "my-gcp-project"
      region     = "us-central1"
    }
    
    config "aws" {
      access_key = "AKIAIOSFODNN7EXAMPLE"
      secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
    }`;

    expect(() => getModsToInstall(validHclWithoutCredential)).toThrow("Missing 'credential' key in flowpipe-config input");
  });

  it('should return connection data for valid input', () => {
    const validCredentials = `
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

    const expectedConnectionData = ["aws", "gcp", "slack"]; // Expected sorted array
    expect(getModsToInstall(validCredentials).sort()).toEqual(expectedConnectionData);
  });
});