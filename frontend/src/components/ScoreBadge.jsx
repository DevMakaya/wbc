export default function ScoreBadge({ score }) {
  const color =
    score >= 80
      ? "bg-emerald-900/50 text-emerald-300 border-emerald-700"
      : score >= 65
        ? "bg-teal-900/50 text-teal-300 border-teal-700"
        : "bg-navy-800 text-navy-300 border-navy-700";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {score} pts
    </span>
  );
}
