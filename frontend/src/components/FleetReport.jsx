import React from "react";
import { Trophy, Crosshair } from "lucide-react";

export default function FleetReport({ report }) {
  if (!report) return null;
  const sections = [
    { title: "Fleet Statistics", rows: report.stats },
    { title: "Tactical Performance", rows: report.tactical },
    { title: "Strategic Assessment", rows: report.strategic },
  ];

  return (
    <div className="kill-report fleet-report" data-testid="fleet-report">
      <div className="kr-target fr-target" aria-hidden="true">
        <Crosshair className="kr-target-ring" size={56} strokeWidth={1.4} />
        <Trophy className="kr-target-skull fr-target-trophy" size={24} strokeWidth={2} />
      </div>

      <div className="kr-head">
        <span className="kr-stamp fr-stamp">FLEET REPORT</span>
        <span className="kr-line">
          <span className="kr-key">Operation</span>
          <span className="kr-val fr-op">{report.operation}</span>
        </span>
        <span className="kr-line">
          <span className="kr-key">Status</span>
          <span className="kr-val fr-status">SUCCESS</span>
        </span>
      </div>

      <div className="kr-grid">
        {sections.map((sec) => (
          <section key={sec.title} className="kr-section">
            <h4 className="kr-title fr-title">{sec.title}</h4>
            <ul className="kr-list fr-list">
              {sec.rows.map(([k, v]) => (
                <li key={k}>
                  <span className="kr-key">{k}</span>
                  <span className="kr-val">{v}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section className="kr-section">
          <h4 className="kr-title fr-title">Fleet Losses</h4>
          <ul className="kr-list kr-list--loss fr-list fr-list--loss">
            {report.losses.map((l, i) => (
              <li key={i}><span className="kr-val">{l}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
