import { useId, useMemo, useState } from "react";

import { formatNumber, formatPercent, topSeries } from "../utils/journal";

const COLORS = ["#1688f8", "#ff9f43", "#ef5b5b", "#16c7d9", "#b53ee5", "#43bc7b", "#ffae00", "#e93676"];
const CHART = { width: 1000, height: 250, left: 52, right: 18, top: 18, bottom: 42 };

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function linePath(values, x, y) {
  return values.map((point, index) => `${index ? "L" : "M"}${x(point.year)} ${y(point.value)}`).join(" ");
}

function getTicks(max) {
  return Array.from({ length: 5 }, (_, index) => Math.round((max * index / 4) * 10) / 10);
}

export function LineChart({ title, description, years = [], series = [], area = false }) {
  const gradientId = useId().replace(/:/g, "");
  const [tooltip, setTooltip] = useState(null);
  const safeYears = useMemo(
    () => [...new Set(years.map(Number).filter(Number.isFinite))].sort((a, b) => a - b),
    [years],
  );
  const safeSeries = useMemo(
    () => series.filter((item) => item?.values?.length).map((item, index) => ({ ...item, color: item.color || COLORS[index % COLORS.length] })),
    [series],
  );

  if (!safeYears.length || !safeSeries.length) {
    return (
      <section className="journal-chart-card">
        <h3>{title}</h3>
        {description && <p className="chart-description">{description}</p>}
        <p className="chart-empty">Chưa có dữ liệu để hiển thị.</p>
      </section>
    );
  }

  const plotWidth = CHART.width - CHART.left - CHART.right;
  const plotHeight = CHART.height - CHART.top - CHART.bottom;
  const yearIndex = new Map(safeYears.map((year, index) => [year, index]));
  const x = (year) => CHART.left + ((yearIndex.get(Number(year)) || 0) / Math.max(safeYears.length - 1, 1)) * plotWidth;
  const rawMax = Math.max(...safeSeries.flatMap((item) => item.values.map((point) => numberValue(point.value))), 1);
  const max = rawMax * 1.08;
  const y = (value) => CHART.top + plotHeight - (numberValue(value) / max) * plotHeight;
  const ticks = getTicks(rawMax);
  const labelEvery = Math.max(1, Math.ceil(safeYears.length / 6));

  return (
    <section className="journal-chart-card">
      <div className="chart-heading">
        <div>
          <h3>{title}</h3>
          {description && <p className="chart-description">{description}</p>}
        </div>
        {safeSeries.length > 1 && (
          <ul className="chart-legend" aria-label="Chú giải biểu đồ">
            {safeSeries.map((item) => (
              <li key={item.key || item.name}><span style={{ background: item.color }} />{item.name}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="chart-canvas">
        <svg viewBox={`0 0 ${CHART.width} ${CHART.height}`} role="img" aria-label={title}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={safeSeries[0].color} stopOpacity="0.38" />
              <stop offset="100%" stopColor={safeSeries[0].color} stopOpacity="0.04" />
            </linearGradient>
          </defs>
          {ticks.map((tick) => (
            <g key={tick}>
              <line className="chart-grid" x1={CHART.left} x2={CHART.width - CHART.right} y1={y(tick)} y2={y(tick)} />
              <text className="chart-axis-label" x={CHART.left - 10} y={y(tick) + 4} textAnchor="end">{formatNumber(tick)}</text>
            </g>
          ))}
          {safeYears.map((year, index) => (index % labelEvery === 0 || index === safeYears.length - 1) && (
            <text key={year} className="chart-axis-label" x={x(year)} y={CHART.height - 14} textAnchor="middle">{year}</text>
          ))}
          {safeSeries.map((item, seriesIndex) => {
            const byYear = new Map(item.values.map((point) => [Number(point.year), numberValue(point.value)]));
            const values = safeYears.map((year) => ({ year, value: byYear.get(year) || 0 }));
            const path = linePath(values, x, y);
            const areaPath = `${path} L${x(values.at(-1).year)} ${CHART.top + plotHeight} L${x(values[0].year)} ${CHART.top + plotHeight} Z`;

            return (
              <g key={item.key || item.name}>
                {area && seriesIndex === 0 && <path d={areaPath} fill={`url(#${gradientId})`} />}
                <path className="chart-line" d={path} stroke={item.color} />
                {values.map((point) => (
                  <circle
                    key={`${item.key || item.name}-${point.year}`}
                    className="chart-point"
                    cx={x(point.year)}
                    cy={y(point.value)}
                    r="7"
                    fill={item.color}
                    tabIndex="0"
                    aria-label={`${item.name}, năm ${point.year}: ${formatNumber(point.value)}`}
                    onMouseEnter={() => setTooltip({ x: x(point.year), y: y(point.value), name: item.name, ...point })}
                    onMouseLeave={() => setTooltip(null)}
                    onFocus={() => setTooltip({ x: x(point.year), y: y(point.value), name: item.name, ...point })}
                    onBlur={() => setTooltip(null)}
                  />
                ))}
              </g>
            );
          })}
        </svg>
        {tooltip && (
          <div className="chart-tooltip" style={{ left: `${(tooltip.x / CHART.width) * 100}%`, top: `${(tooltip.y / CHART.height) * 100}%` }}>
            <strong>{tooltip.name}</strong><span>{tooltip.year}: {formatNumber(tooltip.value)}</span>
          </div>
        )}
      </div>
    </section>
  );
}

export function TopicDistribution({ topics = [] }) {
  const [expanded, setExpanded] = useState(false);
  const validTopics = topics.filter((topic) => numberValue(topic.worksPercent) > 0);
  if (!validTopics.length) return null;

  const total = validTopics.reduce((sum, topic) => sum + numberValue(topic.worksPercent), 0) || 1;
  const visibleTopics = expanded ? validTopics : validTopics.slice(0, 5);

  return (
    <section className="journal-chart-card topic-chart">
      <div className="chart-heading">
        <div>
          <h3>Tổng hợp chủ đề</h3>
          <p className="chart-description">{validTopics.length} chủ đề của OpenAlex</p>
        </div>
        {validTopics.length > 5 && <button type="button" className="text-button" onClick={() => setExpanded((value) => !value)}>{expanded ? "Thu gọn" : "Tất cả"}</button>}
      </div>
      <div className="topic-bar" aria-label="Phân bố chủ đề">
        {validTopics.map((topic, index) => (
          <span key={`${topic.name}-${index}`} title={`${topic.name}: ${formatPercent(topic.worksPercent)}`} style={{ width: `${(numberValue(topic.worksPercent) / total) * 100}%`, background: COLORS[index % COLORS.length] }} />
        ))}
      </div>
      <ul className="topic-legend">
        {visibleTopics.map((topic, index) => (
          <li key={`${topic.name}-${index}`}><span style={{ background: COLORS[index % COLORS.length] }} /><span>{topic.name}</span><strong>{formatPercent(topic.worksPercent)}</strong></li>
        ))}
      </ul>
    </section>
  );
}

function mapTrendSeries(items) {
  return topSeries(items).map((item, index) => ({
    key: item.key || item.name,
    name: item.name || item.key || `Nhóm ${index + 1}`,
    color: COLORS[index % COLORS.length],
    values: item.byYear || [],
  }));
}

export function TrendDashboard({ result }) {
  const [countryKey, setCountryKey] = useState("");
  const selectedCountry = result?.institutionsByCountry?.find((item) => item.countryKey === countryKey);
  const institutionItems = selectedCountry?.institutions || result?.institutions || [];
  const years = result?.years || [];

  return (
    <section className="trend-dashboard" aria-labelledby="trend-dashboard-title">
      <div className="trend-title-row">
        <div>
          <p className="eyebrow">Phân tích chuyên sâu</p>
          <h2 id="trend-dashboard-title">Xu hướng {result?.fromYear}–{result?.toYear}</h2>
        </div>
        <dl className="trend-summary">
          <div><dt>Tác phẩm</dt><dd>{formatNumber(result?.totalWorks)}</dd></div>
          <div><dt>Quốc gia</dt><dd>{formatNumber(result?.uniqueCountries)}</dd></div>
          <div><dt>Tổ chức</dt><dd>{formatNumber(result?.uniqueInstitutions)}</dd></div>
          <div><dt>Tác giả</dt><dd>{formatNumber(result?.uniqueAuthors)}</dd></div>
        </dl>
      </div>

      <LineChart title="Đóng góp theo quốc gia" description="5 quốc gia có tổng đóng góp cao nhất" years={years} series={mapTrendSeries(result?.countries || [])} />
      <div className="institution-heading">
        <div><h2>Đóng góp theo tổ chức</h2><p>Lọc tổ chức theo quốc gia hoặc xem toàn bộ.</p></div>
        <label>Quốc gia
          <select value={countryKey} onChange={(event) => setCountryKey(event.target.value)}>
            <option value="">Tất cả quốc gia</option>
            {(result?.institutionsByCountry || []).map((country) => <option key={country.countryKey} value={country.countryKey}>{country.countryName}</option>)}
          </select>
        </label>
      </div>
      <LineChart title="Tổ chức nổi bật" description="5 tổ chức có tổng đóng góp cao nhất" years={years} series={mapTrendSeries(institutionItems)} />
      <LineChart title="Tác giả nổi bật" description="5 tác giả có tổng đóng góp cao nhất" years={years} series={mapTrendSeries(result?.authors || [])} />
    </section>
  );
}
