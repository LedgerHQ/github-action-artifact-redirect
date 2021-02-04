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

  const { runId, owner, repo, branch, headSha } = req.query;

  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

  try {
    let result;

    result = await axios
      .get(
        `${baseUrl}/actions/runs/${runId}`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    const currentRun = result.data;
    const workflowId = currentRun.workflow_id;
    result = await axios
      .get(
        `${baseUrl}/actions/workflows/${workflowId}/runs`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    const branchWorkflows = result.data.workflow_runs.filter(run => run.head_branch === branch);
    const runningWorkflows = branchWorkflows.filter(run =>
      (run.head_sha !== headSha) &&
      run.status !== 'completed' &&
      new Date(run.created_at) < new Date(currentRun.created_at)
    );
    for (const {id, head_sha, status, html_url} of runningWorkflows) {
      console.log('Canceling run: ', {id, head_sha, status, html_url});
      result = await axios
        .post(
          `${baseUrl}/actions/runs/${runId}/cancel`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      console.log(`Cancel run ${id} responded with status ${result.status}`);
    }

  } catch(e) {
    res.status(500).json(e);
  }
}