export default function StatusPill({ connected }) {
  return (
    <span className={`status-pill ${connected ? "live" : "offline"}`}>
      {connected ? "Live Socket Connected" : "Socket Offline"}
    </span>
  );
}
