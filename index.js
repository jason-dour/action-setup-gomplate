const fs = require("fs");
const path = require("path");
const core = require("@actions/core");
const tc = require("@actions/tool-cache");
const gh = require("@actions/github");
const os = require('os');

// Leverage the GitHub Action environment variables to authenticate with GitHub
const octokit = new gh.getOctokit(process.env.GITHUB_TOKEN);

// getRelease returns the octokit release object for the given version
async function getRelease(version) {
    if (version === 'latest') {
        return octokit.repos.getLatestRelease({
            owner: 'hairyhenderson',
            repo: 'gomplate'
        });
    } else {
      try {
        release = await octokit.repos.getReleaseByTag({
          owner: 'hairyhenderson',
          repo: 'gomplate',
          tag: version
        });
      } catch(e) {
        core.setFailed(e);
      }
      return release;
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
  core.debug("release: " + release);
  const asset = release.data.assets.find(asset => asset.name.endsWith(`gomplate_${ mapOS(os.platform()) }-${ mapArch(os.arch()) }`));
  const url = asset.browser_download_url;
  const binPath = path.join("gomplate_linux-amd64");
  core.info("url: " + url);
  core.info("binPath: " + binPath);
  return { url, binPath };
}

// setup downloads the tool and installs it to the given path
async function setup() {
  try {
    // Get version of tool to be installed
    const version = core.getInput('gomplate-version');
    core.debug("version: " + version);
 
    // Download the specific version of the tool.
    const download = await getDownloadObject(version);
    const pathToCLI = await tc.downloadTool(download.url,process.env.RUNNER_TEMP+"/gomplate");
    fs.chmodSync(pathToCLI, 0o755); // make the binary executable
    console.log("pathToCLI: " + pathToCLI);

    // Expose the tool by adding it to the PATH
    core.addPath(process.env.RUNNER_TEMP);
  } catch (e) {
    core.setFailed(e);
  }
}

export default setup

if (require.main === module) {
  setup();
}

setup();
