import { ipcMain, dialog } from "electron";
import { writeFileSync } from "fs";

/**
 * §8: hardware (receipt printer) access happens ONLY in the main process.
 * The renderer asks via IPC (`printer:*`), never talks to the device itself.
 *
 * `electron-pos-printer` (spec choice) is wired through `printWithPosPrinter`
 * once a real printer/port is configured (env `POS_PRINTER_PORT`). Until then
 * receipts fall back to a save-as-text dialog so the flow stays testable
 * without hardware.
 */

export interface PrinterStatus {
  model: string;
  status: "ready" | "offline";
  driver: "electron-pos-printer" | "text-fallback";
}

export type ReceiptLine = string;

const PRINTER_PORT = process.env.POS_PRINTER_PORT || "";

async function printWithPosPrinter(lines: ReceiptLine[]): Promise<boolean> {
  if (!PRINTER_PORT) return false;
  try {
    // Lazy require: the package talks to USB/serial hardware at runtime.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PosPrinter } = require("electron-pos-printer");
    const printer = new PosPrinter();
    await printer.print([{ value: lines.join("\n"), type: "text" }]);
    return true;
  } catch (err) {
    console.error("[printer] electron-pos-printer failed:", err);
    return false;
  }
}

async function printToTextFile(lines: ReceiptLine[]): Promise<{ cancelled: boolean; path?: string }> {
  const text = lines.join("\n") + "\n";
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Print receipt",
    defaultPath: `receipt-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.txt`,
    filters: [{ name: "Text", extensions: ["txt"] }],
  });
  if (canceled || !filePath) return { cancelled: true };
  writeFileSync(filePath, text, "utf8");
  return { cancelled: false, path: filePath };
}

ipcMain.handle("printer:get-status", async (): Promise<PrinterStatus> => {
  if (PRINTER_PORT) {
    return { model: `POS printer (${PRINTER_PORT})`, status: "ready", driver: "electron-pos-printer" };
  }
  return { model: "No POS printer configured", status: "offline", driver: "text-fallback" };
});

ipcMain.handle("printer:print", async (_event, lines: ReceiptLine[]) => {
  const safeLines = Array.isArray(lines) ? lines : [];
  if (safeLines.length === 0) return { cancelled: true, reason: "empty receipt" };
  if (await printWithPosPrinter(safeLines)) return { cancelled: false, driver: "electron-pos-printer" };
  return printToTextFile(safeLines);
});

