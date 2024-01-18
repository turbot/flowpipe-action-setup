# Setup Flowpipe for GitHub Actions

<p align="center">
  <a href="https://github.com/turbot/flowpipe-action-setup/actions"><img alt="flowpipe-action status" src="https://github.com/turbot/flowpipe-action-setup/workflows/units-test/badge.svg"></a>
</p>

This action installs [Flowpipe](https://github.com/turbot/flowpipe/) and optionally sets up Flowpipe credential configurations.

## Usage

See [action.yml](action.yml).

## Examples

### Install the latest version Flowpipe

```yaml
- name: Install Flowpipe
  uses: turbot/flowpipe-action-setup@v1
```

### Install a specific version of Flowpipe

```yaml
- name: Install Flowpipe v0.19.4
  uses: turbot/flowpipe-action-setup@v1
  with:
    flowpipe-version: 0.19.4
```

### Configure multiple AWS credentials

```yaml
- name: Setup Flowpipe
  uses: turbot/flowpipe-action-setup@v1
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

### Run a Flowpipe Github Mod pipeline

```yaml
steps:
  - uses: actions/checkout@v3
  - name: Setup Flowpipe
    uses: turbot/flowpipe-action-setup@main
    with:
      flowpipe-version: 'latest'
      mod-credentials: |
        credential "github" "default" {
          token = "${{ secrets.GH_TOKEN }}"
        }
  - name: Install mod and run pipeline
    run: |
        mkdir pipelines
        cd pipelines
        flowpipe mod install github.com/turbot/flowpipe-mod-github
        flowpipe pipeline run github.pipeline.search_repositories --arg 'search_value=owner:turbot'
```

Pipeline that searches for GitHub repositories owned by 'turbot', extracting information such as creation date and popularity metrics.

## Helpful Links

- [Flowpipe docs](https://flowpipe.io/docs)
- [Flowpipe mods](https://hub.flowpipe.io/)
