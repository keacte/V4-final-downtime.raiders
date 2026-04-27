import React from "react";

export default function Leaderboard({ scores, onRefresh }) {
  return (
    <div className="lb-wrap" id="leaderboard-section" data-testid="leaderboard">
      <div className="lb-head">
        <h3 className="lb-title">// KILLBOARD &middot; TOP 10</h3>
        <button
          type="button"
          className="eve-btn eve-btn-icon"
          onClick={onRefresh}
          data-testid="refresh-leaderboard-btn"
        >
          REFRESH
        </button>
      </div>

      {(!scores || scores.length === 0) ? (
        <div className="lb-empty" data-testid="leaderboard-empty">
          No kills logged. Be the first to undock.
        </div>
      ) : (
        <div className="lb-table-wrap">
          <table className="lb-table" data-testid="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Pilot</th>
                <th>Score</th>
                <th>Wave</th>
                <th>Kills</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => (
                <tr key={s.id || i} data-testid={`leaderboard-row-${i}`}>
                  <td>{String(i + 1).padStart(2, "0")}</td>
                  <td>{s.pilot}</td>
                  <td>{(s.score || 0).toLocaleString()}</td>
                  <td>{s.wave || 1}</td>
                  <td>{s.kills || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
