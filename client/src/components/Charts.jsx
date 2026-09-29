// Chart.js を使ってカテゴリ別の円グラフと月別の棒グラフを表示するコンポーネント
import { useMemo } from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { CATEGORIES, colorFor } from "../utils/categories.js";

// 使用する Chart.js の要素を登録する
ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function Charts({ records }) {
  // カテゴリ別の合計金額を集計
  const categoryTotals = useMemo(() => {
    const totals = {};
    for (const rec of records) {
      for (const it of rec.items) {
        const cat = it.category || "その他";
        totals[cat] = (totals[cat] || 0) + (it.price || 0);
      }
    }
    return totals;
  }, [records]);

  // 月別（YYYY-MM）の合計金額を集計
  const monthlyTotals = useMemo(() => {
    const totals = {};
    for (const rec of records) {
      const month = (rec.date || "").slice(0, 7); // YYYY-MM
      if (!month) continue;
      totals[month] = (totals[month] || 0) + (rec.total || 0);
    }
    return totals;
  }, [records]);

  if (records.length === 0) {
    return null;
  }

  // 円グラフ用データ（値が 0 より大きいカテゴリのみ）
  const pieLabels = CATEGORIES.filter((c) => (categoryTotals[c] || 0) > 0);
  const pieData = {
    labels: pieLabels,
    datasets: [
      {
        data: pieLabels.map((c) => categoryTotals[c]),
        backgroundColor: pieLabels.map((c) => colorFor(c)),
      },
    ],
  };

  // 棒グラフ用データ（月順にソート）
  const months = Object.keys(monthlyTotals).sort();
  const barData = {
    labels: months,
    datasets: [
      {
        label: "月別支出",
        data: months.map((m) => monthlyTotals[m]),
        backgroundColor: "#4dabf7",
      },
    ],
  };

  // 通貨表示用の共通ツールチップ設定
  const yenTooltip = {
    callbacks: {
      label: (ctx) => {
        const value = ctx.parsed.y ?? ctx.parsed;
        return `¥${Number(value).toLocaleString()}`;
      },
    },
  };

  return (
    <section className="charts">
      <div className="card chart-card">
        <h2>カテゴリ別の割合</h2>
        <Pie
          data={pieData}
          options={{
            responsive: true,
            plugins: {
              legend: { position: "bottom" },
              tooltip: {
                callbacks: {
                  label: (ctx) =>
                    `${ctx.label}: ¥${Number(ctx.parsed).toLocaleString()}`,
                },
              },
            },
          }}
        />
      </div>

      <div className="card chart-card">
        <h2>月別の支出</h2>
        <Bar
          data={barData}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: yenTooltip,
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (v) => `¥${Number(v).toLocaleString()}`,
                },
              },
            },
          }}
        />
      </div>
    </section>
  );
}
