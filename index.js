import { chmodSync } from 'fs';
import { join } from 'path';
import { getInput, addPath, setFailed, info } from '@actions/core';
import { downloadTool } from '@actions/tool-cache';
import { getOctokit } from '@actions/github';
const os = require('os');

// Leverage the GitHub Action environment variables to authenticate with GitHub
const octokit = new getOctokit(process.env.GITHUB_TOKEN);

// getRelease returns the octokit release object for the given version
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

// arch in [arm, x32, x64...] (https://nodejs.org/api/os.html#os_os_arch)
// return value in [amd64, 386, arm]
function mapArch(arch) {
  const mappings = {
    x32: '386',
    x64: 'amd64'
  };
  return mappings[arch] || arch;
}

// os in [darwin, linux, win32...] (https://nodejs.org/api/os.html#os_os_platform)
// return value in [darwin, linux, windows]
function mapOS(os) {
  const mappings = {
    darwin: 'macOS',
    win32: 'windows'
  };
  return mappings[os] || os;
}

// getDownloadObject returns an object with the following properties:
//   url: the url to download the tool from
//   binPath: the local path to the downloaded tool
async function getDownloadObject(version) {
  const release = await getRelease(version);
  const asset = release.data.assets.find(asset => asset.name.endsWith(`gomplate_${ mapOS(os.platform()) }-${ mapArch(os.arch()) }`));
  const url = asset.browser_download_url;
  const binPath = join("gomplate_linux-amd64");
  info("url: " + url);
  info("binPath: " + binPath);
  return { url, binPath };
}

// setup downloads the tool and installs it to the given path
async function setup() {
  try {
    // Get version of tool to be installed
    const version = getInput('gomplate-version');

    // Download the specific version of the tool.
    const download = await getDownloadObject(version);
    const pathToCLI = await downloadTool(download.url,process.env.RUNNER_TEMP+"/gomplate");
    chmodSync(pathToCLI, 0o755); // make the binary executable
    info("pathToCLI: " + pathToCLI);

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
