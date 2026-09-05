"use client";

import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { useT } from "@/i18n";
import { formaterCADSigne, formaterPourcentageSigne } from "@/lib/format";
import type { Scenario } from "@/lib/types";

const FAVORABLE = "var(--statut-vert)";
const DEFAVORABLE = "var(--statut-rouge)";

/**
 * Graphique divergent autour de zéro : les deux directions occupent le même
 * espace visuel, de part et d'autre du même axe. La symétrie n'est pas une
 * décoration, c'est la garantie qu'aucune lecture directionnelle n'est suggérée.
 */
export function GraphiqueScenarios({ scenarios }: { scenarios: Scenario[] }) {
  const t = useT();

  return (
    <div className="mt-8">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={scenarios}
          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          barCategoryGap="28%"
        >
          <XAxis
            dataKey="mouvementPct"
            tickFormatter={(valeur: number) =>
              formaterPourcentageSigne(valeur, valeur % 1 === 0 ? 0 : 1)
            }
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={{ fill: "var(--muted-foreground)", fontSize: 13 }}
          />
          <YAxis
            tickFormatter={(valeur: number) => formaterCADSigne(valeur)}
            tickLine={false}
            axisLine={false}
            width={90}
            tick={{ fill: "var(--muted-foreground)", fontSize: 13 }}
          />
          <ReferenceLine y={0} stroke="var(--foreground)" strokeWidth={1} />
          <Bar dataKey="ecartCAD" isAnimationActive={false}>
            {scenarios.map((scenario) => (
              <Cell
                key={scenario.mouvementPct}
                fill={scenario.favorable ? FAVORABLE : DEFAVORABLE}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full bg-statut-vert"
          />
          {t.detail.scenarios.legendeFavorable}
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full bg-statut-rouge"
          />
          {t.detail.scenarios.legendeDefavorable}
        </span>
      </div>
    </div>
  );
}
