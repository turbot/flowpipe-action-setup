# Setup Flowpipe for GitHub Actions

<p align="center">
  <a href="https://github.com/turbot/flowpipe-action-setup/actions"><img alt="flowpipe-action status" src="https://github.com/turbot/flowpipe-action-setup/workflows/units-test/badge.svg"></a>
</p>

This action installs [Flowpipe](https://github.com/turbot/flowpipe/) and optionally installs plugins and creates plugin connection configurations.

## Usage

See [action.yml](action.yml).

## Examples

### Install the latest version Flowpipe

```yaml
- name: Install Steampipe
  uses: turbot/flowpipe-action-setup@v1
```

### Install a specific version of Flowpipe

```yaml
- name: Install Flowpipe v0.19.4
  uses: turbot/flowpipe-action-setup@v1
  with:
    flowpipe-version: 0.19.4
```

### Configure multiple AWS connections

```yaml
- name: Setup Steampipe
  uses: turbot/steampipe-action-setup@v1
  with:
    mod-credentials: |
      credential "aws" "aws_prod" {
        access_key = "${{ secrets.AWS_ACCESS_KEY }}"
        secret_key = "${{ secrets.AWS_SECRET_ACCESS_KEY }}"
      }

      credential "aws" "aws_dev" {
        access_key    = "${{ secrets.DEV_AWS_ACCESS_KEY }}"
        secret_key    = "${{ secrets.DEV_AWS_SECRET_ACCESS_KEY }}"
        session_token = "${{ secrets.DEV_AWS_SESSION_TOKEN }}"
      }
```
> For further information on credentials refer to [Managing Credentials](https://flowpipe.io/docs/run/credentials) or for available Flowpipe versions refer to [Flowpipe Releases](https://github.com/turbot/flowpipe/releases).

## Helpful Links

- [Flowpipe docs](https://flowpipe.io/docs)
- [Flowpipe mods](https://hub.flowpipe.io/)
