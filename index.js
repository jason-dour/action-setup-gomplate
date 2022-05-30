const fs = require('fs');
const path = require('path');
const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const github = require('@actions/github');

const octokit = new github.GitHub(process.env.GITHUB_TOKEN);

async function getRelease(version) {
    if (version === 'latest') {
        return octokit.repos.getLatestRelease({
            owner: 'hairyhenderson',
            repo: 'gomplate'
        });
    } else {
        return octokit.repos.getReleaseByTag({
            owner: 'hairyhenderson',
            repo: 'gomplate',
            tag: version
        });
    }
}

async function getDownloadObject(version) {
  const release = await getRelease(version);
  const asset = release.data.assets.find(asset => asset.name.endsWith('_linux-amd64'));
  const url = asset.browser_download_url;
  console.log("download url: " + url);
  const binPath = path.join("gomplate_linux-amd64");
  return { url, binPath };
}

async function setup() {
  try {
    // Get version of tool to be installed
    const version = core.getInput('gomplate-version');

    // Download the specific version of the tool.
    const download = await getDownloadObject(version);
    const pathToCLI = await tc.downloadTool(download.url,process.env.RUNNER_TEMP+"/gomplate");
    fs.chmodSync(pathToCLI, 0o755); // make the binary executable
    console.log("pathToCLI=" + pathToCLI);

    // Expose the tool by adding it to the PATH
    core.addPath(process.env.RUNNER_TEMP);
  } catch (e) {
    core.setFailed(e);
  }
}

module.exports = setup

if (require.main === module) {
  setup();
}
