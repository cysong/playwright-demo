// Script to generate a root index page listing all test reports without overwriting Playwright's own report entry.
const fs = require('fs');
const path = require('path');

const runNumber = process.env.GITHUB_RUN_NUMBER || 'latest';
const repository = process.env.GITHUB_REPOSITORY || '';
const repoName = repository.split('/')[1] || 'playwright-demo';
const outputDir = process.env.OUTPUT_DIR || '.';
const reportsDir = path.join(outputDir, 'reports');

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return 'N/A';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

// Try to read Playwright stats from a run directory.
function loadStats(runDir) {
  const candidates = [
    path.join(runDir, 'report.json'),
    path.join(runDir, 'data', 'report.json'),
    path.join(runDir, 'data', 'test-results.json'),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const stats = data.stats || (data.summary && data.summary.stats) || data;
      const startTime = stats?.startTime
        ? new Date(stats.startTime)
        : data.startTime
        ? new Date(data.startTime)
        : null;
      const durationMs = Number.isFinite(stats?.duration)
        ? Number(stats.duration)
        : Number.isFinite(data.duration)
        ? Number(data.duration)
        : Number(
            data.json && data.json.stats && Number(data.json.stats.duration)
          );
      if (stats) {
        const total =
          Number(stats.total) ??
          Number(
            (stats.expected ?? 0) +
              (stats.unexpected ?? 0) +
              (stats.flaky ?? 0) +
              (stats.skipped ?? 0)
          );
        return {
          passed: Number(stats.expected ?? stats.passed ?? 0),
          failed: Number(stats.unexpected ?? stats.failed ?? 0),
          skipped: Number(stats.skipped ?? 0),
          flaky: Number(stats.flaky ?? 0),
          total: Number.isFinite(total) ? total : 0,
          startTime,
          durationMs: Number.isFinite(durationMs) ? durationMs : null,
        };
      }
    } catch (err) {
      // Ignore parse errors; fall through to next candidate.
    }
  }
  return null;
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
    const icon =
      statusState === 'passed' ? '✔' : statusState === 'failed' ? '✖' : '？';
    const timeText = stats?.startTime
      ? stats.startTime.toLocaleString()
      : 'N/A';
    const durationText = stats?.durationMs
      ? formatDuration(stats.durationMs)
      : 'N/A';
    const statsLine = stats
      ? `Total ${stats.total} · Pass ${stats.passed} · Fail ${stats.failed}` +
        (stats.skipped ? ` · Skip ${stats.skipped}` : '') +
        (stats.flaky ? ` · Flaky ${stats.flaky}` : '')
      : 'Status: unknown';
    return `
        <div class="card">
            <a href="./reports/${run}/" class="report-link">
                <div class="card-header">
                    <div>
                        <h3>Run #${run}</h3>
                        <div class="subtitle">
                            <span>Time: ${timeText}</span>
                            <span class="dot">•</span>
                            <span>Duration: ${durationText}</span>
                        </div>
                    </div>
                    <div class="badge-group">
                        <span class="status-badge ${statusState}">${iconHtml} ${statusLabel}</span>
                        ${isLatest ? '<span class="badge latest">Latest</span>' : '<span class="badge view">View</span>'}
                    </div>
                </div>
                <div class="report-info">
                    <p>${statsLine}</p>
                </div>
            </a>
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
        .subtitle {
            color: #718096;
            font-size: 1.1rem;
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
        .subtitle {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
            color: #718096;
            font-size: 0.95rem;
        }
        .dot { color: #cbd5e0; }
        .status-text { font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
        .status-icon { font-size: 1rem; }
        .status-text.passed { color: #2f855a; }
        .status-text.failed { color: #c53030; }
        .status-text.unknown { color: #718096; }
        .status-badge {
            padding: 8px 14px;
            border-radius: 16px;
            font-size: 0.9rem;
            font-weight: 700;
        }
        .status-badge.passed { background: #48bb78; color: #fff; }
        .status-badge.failed { background: #f56565; color: #fff; }
        .status-badge.unknown { background: #a0aec0; color: #fff; }
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
            <p class="subtitle">${repoName} - Automated Test Results</p>
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
