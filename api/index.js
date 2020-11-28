import axios from "axios";

module.exports = (req, res) => {
  const baseUrl = `https://api.github.com/repos/${req.query.owner}/${req.query.repo}`;

  axios
    .get(
      `${baseUrl}/actions/runs/${req.query.runId}/artifacts`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${process.env.GHTOKEN}`
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
            'Authorization': `token ${process.env.GHTOKEN}`
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