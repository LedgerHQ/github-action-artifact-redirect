const axios = require("axios");
const { createAppAuth } = require("@octokit/auth-app");
const atob = require("atob");

module.exports = async (req, res) => {
  const auth = createAppAuth({
    appId: process.env.GHBOT_APPID,
    privateKey: atob(process.env.GHBOT_PRIVATEKEY),
    installationId: process.env.GHBOT_INSTALLATIONID,
    clientId: process.env.GHBOT_CLIENTID,
    clientSecret: process.env.GHBOT_SECRET,
  });
  const { token } = await auth({
    type: "installation",
    repositories: ["LedgerHQ/ledger-live-desktop"],
  });

  const baseUrl = `https://api.github.com/repos/${req.query.owner}/${req.query.repo}`;

  axios
    .get(
      `${baseUrl}/actions/runs/${req.query.runId}/artifacts`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${token}`
        }
      }
    )
    .then(r => axios
      .get(
        r.data.artifacts[req.query.artifactIndex || 0].archive_download_url,
        {
          maxRedirects: 0,
          validateStatus: s => s === 302,
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${token}`
          }
        }
      )
    )
    .then(
      r => {
        res.status(301).redirect(r.headers.location);
      },
      (e) => {
        res.status(500).json({ message: e.message });
      }
    );
}