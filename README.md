# action-setup-gomplate

![Action Tests](https://github.com/jason-dour/action-setup-gomplate/actions/workflows/test.yml/badge.svg)

Set up your GitHub Actions workflow with a specific version of Gomplate.

## Usage

Input `gomplate-version` is optional; default is to install the latest version. See [Gomplate releases](https://github.com/hairyhenderson/gomplate/releases) for list of specific semver release tags.

### Basic

Add a step that calls `jason-dour/action-setup-gomplate`, providing the `GITHUB_TOKEN` from the workflow as an environment variable.  **This is required**.

```yaml
steps:
- uses: actions/checkout@v3
- uses: jason-dour/action-setup-gomplate@v1.0.0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
- run: gomplate --version
```

### Specific Gomplate Version

Optionally, you may also specify the semver release tag of a specific Gomplate release to be installed.

```yaml
steps:
- uses: actions/checkout@v3
- uses: jason-dour/action-setup-gomplate@v1.0.0
  with:
    gomplate-version: v3.10.0
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
- run: java -cp java HelloWorldApp
```
