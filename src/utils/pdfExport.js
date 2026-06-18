// Generates a weekly activity PDF report using the browser's print API
// with a custom print stylesheet — no external PDF library needed.

export const exportWeeklyReport = async (teamName, memberName, weekData) => {
  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const totalHours   = weekData.reduce((s, d) => s + (d.hours || 0), 0).toFixed(1);
  const totalTasks   = weekData.reduce((s, d) => s + (d.tasks || 0), 0);
  const totalMeet    = weekData.reduce((s, d) => s + (d.meetings || 0), 0);
  const avgProd      = weekData.length
    ? (weekData.reduce((s, d) => s + (d.productivity || 0), 0) / weekData.length).toFixed(0)
    : 0;

  const rows = weekData.map(d => `
    <tr>
      <td>${new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}</td>
      <td style="text-align:center">${d.hours || 0}h</td>
      <td style="text-align:center">${d.tasks || 0}</td>
      <td style="text-align:center">${d.meetings || 0}</td>
      <td style="text-align:center">${d.productivity || 0}%</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html><html><head>
  <meta charset="UTF-8"/>
  <title>Weekly Report – ${teamName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; padding: 40px; }
    h1 { font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .meta { font-size: 13px; color: #64748b; margin-bottom: 28px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center; }
    .stat-val { font-size: 26px; font-weight: 800; color: #1e293b; }
    .stat-lbl { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1e293b; color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing:.05em; padding: 10px 12px; text-align: left; }
    td { padding: 9px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
    tr:hover td { background: #f8fafc; }
    .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    @media print { body { padding: 20px; } }
  </style>
  </head><body>
  <h1>Weekly Activity Report</h1>
  <p class="meta">${teamName} · ${memberName} · Generated ${formatDate(new Date())}</p>
  <div class="stats">
    <div class="stat"><div class="stat-val">${totalHours}h</div><div class="stat-lbl">Total Hours</div></div>
    <div class="stat"><div class="stat-val">${totalTasks}</div><div class="stat-lbl">Tasks Logged</div></div>
    <div class="stat"><div class="stat-val">${totalMeet}</div><div class="stat-lbl">Meetings</div></div>
    <div class="stat"><div class="stat-val">${avgProd}%</div><div class="stat-lbl">Avg Productivity</div></div>
  </div>
  <table>
    <thead><tr><th>Date</th><th>Hours</th><th>Tasks</th><th>Meetings</th><th>Productivity</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">AI Hub – Genpact Productivity Portal · This report was auto-generated and reflects self-logged activity data.</div>
  </body></html>`;

  const win = window.open('', '_blank', 'width=800,height=600');
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 400);
};
