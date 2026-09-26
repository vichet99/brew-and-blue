// Serialisable row builders shared by server pages that hand data to client tables.
import type { ActionRow } from "@/components/ActionsTable";
import { actionStatus, actions, clusterLabel, ministries, ministryShort } from "./cashew";

export function actionRows(): ActionRow[] {
  return actions.map((a) => ({
    code: a.code,
    no: a.no,
    title: a.title,
    cluster: a.cluster,
    clusterLabel: clusterLabel[a.cluster],
    lead: ministryShort(a.lead),
    ministries: a.ministries.map(ministryShort),
    pct: a.y2025.avgCappedPct,
    status: actionStatus(a),
    mtrProgress: a.mtrProgress,
    indicators: a.indicators.length,
  }));
}

export const ministryOptions = () => ministries.map((m) => ({ code: m.code, short: m.short }));
