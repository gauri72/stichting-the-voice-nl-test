/**
 * One-time migration: merges the legacy plannedIncomeLines/actualIncomeLines and
 * plannedExpenseLines/actualExpenseLines array pairs on EventBudget documents into
 * the new unified incomeLines/expenseLines arrays (each line already carries both
 * plannedAmount and actualAmount on the same object — see EventBudget.js).
 *
 * Planned and actual entries are paired by array index (matching how the old UI/
 * exports displayed them); any actual entry beyond the planned array's length
 * (e.g. from "Import from Modules") is kept as its own actual-only line instead
 * of being silently dropped.
 *
 * Reads/writes the raw collection directly (not the Mongoose model) since the
 * model no longer declares the legacy fields once this migration ships.
 *
 * Dry-run by default — prints what would change without writing anything.
 * Pass --apply to actually write the new fields.
 *
 * Usage:
 *   npm run migrate:event-budget-lines            # dry run
 *   npm run migrate:event-budget-lines -- --apply  # real migration
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import env from "../src/config/env.js";
import { connectDb } from "../src/db/connectDb.js";

dotenv.config();

const APPLY = process.argv.includes("--apply");

function mergeLines(plannedLines, actualLines) {
  const planned = plannedLines || [];
  const actual = actualLines || [];
  const merged = planned.map((line, i) => {
    const { _id, ...plannedRest } = line;
    const match = actual[i];
    if (!match) return plannedRest;
    const { _id: matchId, plannedAmount, ...actualRest } = match;
    return { ...plannedRest, ...actualRest };
  });
  for (let i = planned.length; i < actual.length; i++) {
    const { _id, ...rest } = actual[i];
    merged.push({ plannedAmount: 0, ...rest });
  }
  return merged;
}

async function main() {
  await connectDb(env.mongoUri, env.mongoDbName);
  const collection = mongoose.connection.db.collection("event_budgets");

  const docs = await collection
    .find({
      $or: [
        { plannedIncomeLines: { $exists: true } },
        { plannedExpenseLines: { $exists: true } },
      ],
    })
    .toArray();

  console.log(
    APPLY
      ? "Running migration (writes will be made)..."
      : "Dry run — no writes will be made. Pass --apply to migrate for real."
  );

  for (const doc of docs) {
    const incomeLines = mergeLines(doc.plannedIncomeLines, doc.actualIncomeLines);
    const expenseLines = mergeLines(doc.plannedExpenseLines, doc.actualExpenseLines);

    console.log(
      `  -> ${doc.budgetId || doc._id} "${doc.eventName}": ` +
        `${doc.plannedIncomeLines?.length || 0}+${doc.actualIncomeLines?.length || 0} income lines -> ${incomeLines.length}, ` +
        `${doc.plannedExpenseLines?.length || 0}+${doc.actualExpenseLines?.length || 0} expense lines -> ${expenseLines.length}`
    );

    if (APPLY) {
      await collection.updateOne(
        { _id: doc._id },
        {
          $set: { incomeLines, expenseLines },
          $unset: {
            plannedIncomeLines: "",
            actualIncomeLines: "",
            plannedExpenseLines: "",
            actualExpenseLines: "",
          },
        }
      );
    }
  }

  console.log(`\n${APPLY ? "Migrated" : "Would migrate"} ${docs.length} EventBudget document(s).`);
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("[migrate-event-budget-lines] Failed:", err);
  process.exit(1);
});
