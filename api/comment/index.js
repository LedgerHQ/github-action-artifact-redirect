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
    installationId: process.env.GHBOT_INSTALLATIONID,
  });
  const { body } = req;

  console.log(GHBOT_INSTALLATIONID);

  const baseUrl = `https://api.github.com/repos/${req.query.owner}/${req.query.repo}`;

  try {
    const result = await axios
      .post(
        `${baseUrl}/issues/${req.query.issueId}/comments`,
        JSON.stringify({
          body: req.body.comment
        }),
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    res.status(200).json(result.data);
  } catch(e) {
    res.status(500).json(e);
  }
}