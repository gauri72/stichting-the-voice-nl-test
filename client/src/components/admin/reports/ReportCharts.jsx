import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#3ecf9a", "#00a6b7", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316"];

function formatTooltipValue(value) {
  if (typeof value === "number" && value > 1000) {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value / 100);
  }
  return value;
}

export function ReportBarChart({ data, dataKey = "value", nameKey = "name", height = 280, valueIsMinor = false }) {
  if (!data?.length) return <p className="admin-reports__chart-empty">No chart data available.</p>;
  return (
    <div className="admin-reports__chart">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey={nameKey} tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (valueIsMinor ? `€${(v / 100).toFixed(0)}` : v)} />
          <Tooltip formatter={(v) => (valueIsMinor ? formatTooltipValue(v) : v)} />
          <Bar dataKey={dataKey} fill="#3ecf9a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportLineChart({ data, dataKey = "value", nameKey = "date", height = 280, valueIsMinor = false }) {
  if (!data?.length) return <p className="admin-reports__chart-empty">No chart data available.</p>;
  return (
    <div className="admin-reports__chart">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey={nameKey} tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (valueIsMinor ? `€${(v / 100).toFixed(0)}` : v)} />
          <Tooltip formatter={(v) => (valueIsMinor ? formatTooltipValue(v) : v)} />
          <Line type="monotone" dataKey={dataKey} stroke="#3ecf9a" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportPieChart({ data, dataKey = "value", nameKey = "name", height = 280 }) {
  if (!data?.length) return <p className="admin-reports__chart-empty">No chart data available.</p>;
  return (
    <div className="admin-reports__chart">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportSparkline({ data, height = 32 }) {
  if (!data?.length) return null;
  return (
    <div className="admin-reports__sparkline">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke="#3ecf9a" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportDataTable({ columns, rows, emptyMessage = "No data." }) {
  if (!rows?.length) return <p className="admin-reports__chart-empty">{emptyMessage}</p>;
  return (
    <div className="admin-reports__table-wrap">
      <table className="admin-reports__table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key || col}>{col.label || col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map((col) => {
                const key = col.key || col;
                const val = row[key];
                return <td key={key}>{val == null ? "—" : String(val)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
