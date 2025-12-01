// Script to generate a root index page listing all test reports without overwriting Playwright's own report entry.
const fs = require('fs');
const path = require('path');

const runNumber = process.env.GITHUB_RUN_NUMBER || 'latest';
const repository = process.env.GITHUB_REPOSITORY || '';
const repoName = repository.split('/')[1] || repository || '';
const outputDir = process.env.OUTPUT_DIR || '.';
const reportsDir = path.join(outputDir, 'reports');

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return 'N/A';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

// Read stats and commit info from report.json in a run directory.
function loadStats(runDir) {
  const file = path.join(runDir, 'report.json');
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const stats = data.stats;
    if (!stats) return null;
    const metadata = data.metadata || (data.config && data.config.metadata) || null;
    const total =
      Number(stats.expected ?? 0) +
      Number(stats.unexpected ?? 0) +
      Number(stats.flaky ?? 0) +
      Number(stats.skipped ?? 0);
    const gitMeta = metadata && metadata.gitCommit;
    const ciMeta = metadata && metadata.ci;
    const commitHash =
      (gitMeta && (gitMeta.shortHash || gitMeta.hash)) ||
      (ciMeta && ciMeta.commitHash) ||
      '';
    const commitHref =
      (gitMeta && gitMeta.commitHref) ||
      (ciMeta && ciMeta.commitHref) ||
      (commitHash && repository
        ? `https://github.com/${repository}/commit/${commitHash}`
        : '');
    return {
      passed: Number(stats.expected ?? 0),
      failed: Number(stats.unexpected ?? 0),
      skipped: Number(stats.skipped ?? 0),
      flaky: Number(stats.flaky ?? 0),
      total,
      commitHash,
      commitHref,
      startTime: stats.startTime ? new Date(stats.startTime) : null,
      durationMs: Number.isFinite(stats.duration) ? Number(stats.duration) : null,
    };
  } catch {
    return null;
  }
}

// Collect existing run directories for the list (descending by numeric run number when possible).
let runs = [];
if (fs.existsSync(reportsDir)) {
  runs = fs
    .readdirSync(reportsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return nb - na;
      return a > b ? -1 : 1;
    });
}

const cards = runs
  .map((run) => {
    const isLatest = String(run) === String(runNumber);
    const stats = loadStats(path.join(reportsDir, run));
    const statusState = stats
      ? stats.failed > 0
        ? 'failed'
        : stats.total > 0
        ? 'passed'
        : 'unknown'
      : 'unknown';
    const statusLabel =
      statusState === 'passed'
        ? 'Passed'
        : statusState === 'failed'
        ? 'Failed'
        : 'Unknown';
    const iconHtml =
      statusState === 'passed'
        ? '&check;'
        : statusState === 'failed'
        ? '&times;'
        : '?';
    const timeText = stats?.startTime
      ? stats.startTime.toISOString().replace('T', ' ').replace('Z', ' UTC')
      : 'N/A';
    const durationText = stats?.durationMs
      ? formatDuration(stats.durationMs)
      : 'N/A';
    const commitText =
      stats?.commitHash && stats?.commitHref
        ? `<a class="commit-link" href="${stats.commitHref}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">${stats.commitHash}</a>`
        : stats?.commitHash
        ? stats.commitHash
        : '';
    const statsLine = stats
      ? `Total ${stats.total} · Pass ${stats.passed} · Fail ${stats.failed}` +
        (stats.skipped ? ` · Skip ${stats.skipped}` : '') +
        (stats.flaky ? ` · Flaky ${stats.flaky}` : '')
      : 'Status: unknown';
    return `
        <div class="card" onclick="location.href='./reports/${run}/'">
            <div class="report-link">
                <div class="card-header">
                    <div>
                        <h3>Run #${run}</h3>
                        <div class="subtitle">
                            <span>Time: ${timeText}</span>
                            <span class="dot">•</span>
                            <span>Duration: ${durationText}</span>
                            ${
                              commitText
                                ? '<span class="dot">•</span><span>Commit: ' +
                                  commitText +
                                  '</span>'
                                : ''
                            }
                        </div>
                    </div>
                    <div class="badge-group">
                        <span class="status-badge ${statusState}">${iconHtml} ${statusLabel}</span>
                        ${
                          isLatest
                            ? '<span class="badge latest">Latest</span>'
                            : '<span class="badge view">View</span>'
                        }
                    </div>
                </div>
                <div class="report-info">
                    <p>${statsLine}</p>
                </div>
            </div>
        </div>`;
  })
  .join('\n');

const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Playwright Test Reports - ${repoName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            margin-bottom: 30px;
            text-align: center;
        }
        h1 {
            color: #2d3748;
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        .header-subtitle {
            color: #718096;
            font-size: 1.1rem;
            display: block;
            text-align: center;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            transition: transform 0.2s;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 50px rgba(0,0,0,0.15);
        }
        .card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
        }
        .report-link {
            display: flex;
            flex-direction: column;
            gap: 12px;
            text-decoration: none;
            color: inherit;
        }
        .report-info h3 {
            color: #2d3748;
            font-size: 1.5rem;
            margin-bottom: 8px;
        }
        .report-info p { color: #4a5568; font-size: 0.95rem; }
        .badge {
            background: #48bb78;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
        }
        .latest { background: #667eea; }
        .view { background: #38a169; }
        .badge-group { display: flex; gap: 8px; align-items: center; }
        .card .subtitle {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
            color: #718096;
            font-size: 0.95rem;
        }
        .dot { color: #cbd5e0; }
        .status-badge {
            padding: 8px 14px;
            border-radius: 16px;
            font-size: 0.9rem;
            font-weight: 700;
        }
        .status-badge.passed { background: #48bb78; color: #fff; }
        .status-badge.failed { background: #f56565; color: #fff; }
        .status-badge.unknown { background: #a0aec0; color: #fff; }
        .commit-link { color: #2b6cb0; text-decoration: underline; }
        .commit-link:hover { text-decoration: none; }
        .footer {
            text-align: center;
            color: white;
            margin-top: 40px;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎭 Playwright Test Reports</h1>
            <p class="header-subtitle">${repoName} - Automated Test Results</p>
        </div>

        ${cards || '<p style="color: white; text-align: center;">No reports found.</p>'}

        <div class="footer">
            <p>Generated by GitHub Actions · Powered by Playwright</p>
        </div>
    </div>
</body>
</html>
`;

// Ensure output directory exists and write root index.html
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml);
console.log(`Generated root index.html in ${outputDir} for run #${runNumber}`);
