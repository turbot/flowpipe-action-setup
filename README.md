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

> For available Steampipe versions refer to [Flowpipe Releases](https://github.com/turbot/flowpipe/releases).

## Helpful Links

- [Flowpipe docs](https://flowpipe.io/docs)
- [Flowpipe mods](https://hub.flowpipe.io/)
