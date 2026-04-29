import React from "react";
import { Skull, Crosshair } from "lucide-react";

export default function KillReport({ report }) {
  if (!report) return null;
  const sections = [
    { title: "Combat Statistics", rows: report.combat },
    { title: "Tactical Performance", rows: report.tactical },
    { title: "Strategic Assessment", rows: report.strategic },
  ];

  return (
    <div className="kill-report" data-testid="kill-report">
      <div className="kr-target" aria-hidden="true">
        <Crosshair className="kr-target-ring" size={56} strokeWidth={1.4} />
        <Skull className="kr-target-skull" size={26} strokeWidth={2} />
      </div>

      <div className="kr-head">
        <span className="kr-stamp">KILL REPORT</span>
        <span className="kr-line"><span className="kr-key">Victim</span> <span className="kr-val">{report.victim}</span></span>
        <span className="kr-line"><span className="kr-key">Ship</span> <span className="kr-val">Wifter</span></span>
      </div>

      <div className="kr-grid">
        {sections.map((sec) => (
          <section key={sec.title} className="kr-section">
            <h4 className="kr-title">{sec.title}</h4>
            <ul className="kr-list">
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
          <h4 className="kr-title">Loss Breakdown</h4>
          <ul className="kr-list kr-list--loss">
            {report.loss.map((l, i) => (
              <li key={i}><span className="kr-val">{l}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
