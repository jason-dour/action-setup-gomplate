import { chmodSync } from 'fs';
import { join } from 'path';
import { getInput, addPath, setFailed } from '@actions/core';
import { downloadTool } from '@actions/tool-cache';
import { GitHub } from '@actions/github';

const octokit = new GitHub(process.env.GITHUB_TOKEN);

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
  const binPath = join("gomplate_linux-amd64");
  return { url, binPath };
}

async function setup() {
  try {
    // Get version of tool to be installed
    const version = getInput('gomplate-version');

    // Download the specific version of the tool.
    const download = await getDownloadObject(version);
    const pathToCLI = await downloadTool(download.url,process.env.RUNNER_TEMP+"/gomplate");
    chmodSync(pathToCLI, 0o755); // make the binary executable
    console.log("pathToCLI=" + pathToCLI);

    // Expose the tool by adding it to the PATH
    addPath(process.env.RUNNER_TEMP);
  } catch (e) {
    setFailed(e);
  }
}

export default setup

if (require.main === module) {
  setup();
}
