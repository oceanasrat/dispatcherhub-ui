export default function StatusBadge({ value = "" }) {
  const map = {
    booked: "bg-yellow-100 text-yellow-800 border-yellow-300",
    in_transit: "bg-blue-100 text-blue-800 border-blue-300",
    delivered: "bg-green-100 text-green-800 border-green-300",
    invoiced: "bg-purple-100 text-purple-800 border-purple-300",
    paid: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };
  const cls = map[value] || "bg-gray-100 text-gray-700 border-gray-300";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${cls}`}>
      {value || "unknown"}
    </span>
  );
}
