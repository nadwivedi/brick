import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fmtNum = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

// Categorical colours in a fixed order (validated for colour-blind separation on white).
// A brick type keeps its slot by creation order, so filtering never repaints it.
const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
const OTHER = { key: 'other', name: 'Other types', color: '#8a8985' };
const AXIS_TICK = { fontSize: 11, fill: '#64748b' };

/** Builds one series per brick type (types past the eighth fold into "Other"). */
const seriesFor = (types, rows) => {
  const series = types.slice(0, SERIES.length).map((t, i) => ({ key: t._id, name: t.name, color: SERIES[i] }));
  const extra = types.slice(SERIES.length).map(t => t._id);
  const data = rows.map(r => {
    if (!extra.length) return r;
    return { ...r, other: extra.reduce((s, id) => s + (r[id] || 0), 0) };
  });
  if (extra.length) series.push(OTHER);
  // Only types produced in this period are drawn and listed
  const totals = Object.fromEntries(series.map(s => [s.key, data.reduce((t, r) => t + (r[s.key] || 0), 0)]));
  return { data, series: series.filter(s => totals[s.key] > 0), totals };
};

function TrendTooltip({ active, payload, label, labelFormat, series }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-slate-200">
      <p className="mb-1 font-semibold text-slate-800">{labelFormat(label)}</p>
      {/* Same order as the stack, top first */}
      {[...series].reverse().map(s => (
        <p key={s.key} className="flex items-center justify-between gap-4 text-slate-600">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />{s.name}</span>
          <span className="font-semibold text-slate-800">{fmtNum(row[s.key])} pcs</span>
        </p>
      ))}
      <p className="mt-1 flex justify-between gap-4 border-t border-slate-100 pt-1 font-bold text-slate-900">
        <span>Total</span><span>{fmtNum(row.total)} pcs</span>
      </p>
    </div>
  );
}

/**
 * Bricks produced per day/month as stacked bars, one colour per brick type; the bar height is the total.
 * - rows: [{ _id: period, total, [productId]: qty }], types: [{ _id, name }] in creation order
 * - note: replaces the subtitle, e.g. when the chart shows more days than the selected range
 */
export default function ProductionTrendChart({ rows = [], types = [], byMonth, tickFormat, labelFormat, note }) {
  const { data, series, totals } = seriesFor(types, rows);
  const grandTotal = rows.reduce((t, r) => t + (r.total || 0), 0);

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Production Trend</h3>
            <p className="text-xs text-slate-500">{note || `Bricks produced ${byMonth ? 'by month' : 'by day'}, by brick type`}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold leading-tight text-slate-900">{fmtNum(grandTotal)} <span className="text-xs font-semibold text-slate-500">pcs</span></p>
            <p className="text-[11px] font-medium text-slate-500">Total produced</p>
          </div>
        </div>
        {/* Legend with each type's total: the names are always visible, never colour alone */}
        {series.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {series.map(s => (
              <span key={s.key} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                {s.name} <span className="font-semibold text-slate-800">{fmtNum(totals[s.key])}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="p-3 md:p-4">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="_id" tick={AXIS_TICK} tickFormatter={tickFormat} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={44} />
            <Tooltip cursor={{ fill: '#f1f5f9' }} content={<TrendTooltip labelFormat={labelFormat} series={series} />} />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                stackId="production"
                fill={s.color}
                // A white edge leaves a thin gap between the stacked pieces
                stroke="#ffffff"
                strokeWidth={1}
                radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
                maxBarSize={36}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
