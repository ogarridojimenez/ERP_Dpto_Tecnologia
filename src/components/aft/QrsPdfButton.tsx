"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export interface QrMb {
  mb: string;
  descripcion: string | null;
}

function safeMb(mb: string | null | undefined): string {
  return (mb ?? "").trim() || "SIN-MB";
}

interface QrsPdfButtonProps {
  areaCodigo: string;
  areaNombre: string;
  mbs: QrMb[];
  className?: string;
}

const COLS = 3;
const ROWS = 5;
const PER_PAGE = COLS * ROWS;
const PAGE_MARGIN_MM = 12;
const HEADER_HEIGHT_MM = 14;
const FOOTER_HEIGHT_MM = 8;

export function QrsPdfButton({ areaCodigo, areaNombre, mbs, className }: QrsPdfButtonProps) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");

  const handleGenerate = async () => {
    if (mbs.length === 0) {
      alert("Esta área no tiene MBs cargados.");
      return;
    }
    setGenerating(true);
    setProgress(`Generando QRs (0/${mbs.length})...`);
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      const usableW = pageW - PAGE_MARGIN_MM * 2;
      const usableH = pageH - PAGE_MARGIN_MM * 2 - HEADER_HEIGHT_MM - FOOTER_HEIGHT_MM;
      const cellW = usableW / COLS;
      const cellH = usableH / ROWS;
      const qrSize = Math.min(cellW, cellH) * 0.65;

      const totalPages = Math.ceil(mbs.length / PER_PAGE);
      const title = `${areaCodigo} - ${areaNombre}`;

      for (let i = 0; i < mbs.length; i++) {
        if (i > 0 && i % PER_PAGE === 0) {
          doc.addPage();
        }
        const pageIndex = Math.floor(i / PER_PAGE);
        if (i % PER_PAGE === 0) {
          drawHeader(doc, pageW, title, mbs.length, pageIndex + 1, totalPages);
        }
        const posInPage = i % PER_PAGE;
        const col = posInPage % COLS;
        const row = Math.floor(posInPage / COLS);
        const cellX = PAGE_MARGIN_MM + col * cellW;
        const cellY = PAGE_MARGIN_MM + HEADER_HEIGHT_MM + row * cellH;
        const qrX = cellX + (cellW - qrSize) / 2;
        const qrY = cellY;

        const mbValue = safeMb(mbs[i].mb);
        const dataUrl = await QRCode.toDataURL(mbValue, {
          errorCorrectionLevel: "M",
          margin: 0,
          width: 400,
        });
        doc.addImage(dataUrl, "PNG", qrX, qrY, qrSize, qrSize);

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(mbValue, cellX + cellW / 2, qrY + qrSize + 4, {
          align: "center",
          maxWidth: cellW - 2,
        });
        const descripcion = mbs[i].descripcion;
        if (descripcion) {
          doc.setFontSize(6);
          doc.setFont("helvetica", "normal");
          const descLines = doc.splitTextToSize(descripcion, cellW - 2);
          doc.text(descLines.slice(0, 2), cellX + cellW / 2, qrY + qrSize + 8, {
            align: "center",
            maxWidth: cellW - 2,
          });
        }

        if ((i + 1) % 5 === 0 || i === mbs.length - 1) {
          setProgress(`Generando QRs (${i + 1}/${mbs.length})...`);
        }
      }

      const safeNombre = areaNombre.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `QR_${areaCodigo}_${safeNombre}.pdf`;
      doc.save(filename);
      setProgress(`✅ ${mbs.length} QRs exportados.`);
      setTimeout(() => setProgress(""), 4000);
    } catch (err) {
      console.error("Error generando PDF:", err);
      setProgress(`❌ ${(err as Error).message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating}
        className={
          className ??
          "rounded-xl bg-gradient-to-r from-purple-600 to-purple-800 px-4 py-2 text-sm font-bold text-white shadow-sm hover:from-purple-700 hover:to-purple-900 disabled:opacity-50"
        }
      >
        {generating ? "⏳ Generando..." : `🏷️ Descargar QRs PDF (${mbs.length})`}
      </button>
      {progress && <span className="text-xs font-medium text-purple-700">{progress}</span>}
    </div>
  );
}

function drawHeader(
  doc: jsPDF,
  pageW: number,
  title: string,
  totalMbs: number,
  pageNum: number,
  totalPages: number
) {
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageW / 2, PAGE_MARGIN_MM + 5, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(
    `Total MBs: ${totalMbs}    ·    Página ${pageNum} de ${totalPages}`,
    pageW / 2,
    PAGE_MARGIN_MM + 10,
    { align: "center" }
  );
  doc.setTextColor(0);
  doc.setDrawColor(200);
  doc.line(PAGE_MARGIN_MM, PAGE_MARGIN_MM + HEADER_HEIGHT_MM - 2, pageW - PAGE_MARGIN_MM, PAGE_MARGIN_MM + HEADER_HEIGHT_MM - 2);
}
