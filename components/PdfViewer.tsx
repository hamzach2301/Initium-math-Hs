"use client";

import { ChangeEvent, PointerEvent, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Highlighter, PenLine, RotateCcw, Upload } from "lucide-react";
import { googleDriveEmbedUrl } from "../lib/googleDrive";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Tool = "highlight" | "pen";
export type PdfSource = File | string;

type PdfViewerProps = {
  source?: PdfSource;
  title?: string;
  /** Enables temporary in-browser annotations and a local-file picker. */
  workspace?: boolean;
  allowUpload?: boolean;
  className?: string;
};

function isGoogleDriveUrl(source: PdfSource): source is string {
  return typeof source === "string" && /drive\.google\.com/.test(source);
}

/** Shared viewer for Drive links, direct PDF URLs, and local PDF files. */
export function PdfViewer({ source, title = "PDF document", workspace = false, allowUpload = false, className = "" }: PdfViewerProps) {
  const [file, setFile] = useState<PdfSource | null>(source ?? null);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [containerWidth, setContainerWidth] = useState(0);
  const [tool, setTool] = useState<Tool>("highlight");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layers = useRef<Map<number, ImageData>>(new Map());
  const start = useRef<{ x: number; y: number } | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    layers.current.clear();
    setFile(source ?? null);
    setPages(0);
    setPage(1);
    setPageSize({ width: 0, height: 0 });
  }, [source]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || !file || isGoogleDriveUrl(file)) return;
    const observer = new ResizeObserver(() => setContainerWidth(Math.floor(element.clientWidth)));
    observer.observe(element);
    setContainerWidth(Math.floor(element.clientWidth));
    return () => observer.disconnect();
  }, [file]);

  const persistLayer = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    layers.current.set(page, context.getImageData(0, 0, canvas.width, canvas.height));
  };

  const restoreLayer = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const saved = layers.current.get(page);
    if (saved) context.putImageData(saved, 0, 0);
  };

  useEffect(() => {
    if (workspace) restoreLayer();
  }, [page, pageSize.width, pageSize.height, containerWidth, workspace]);

  const draw = (event: PointerEvent<HTMLCanvasElement>, type: "start" | "move" | "end") => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const point = { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
    if (type === "start") {
      event.currentTarget.setPointerCapture(event.pointerId);
      start.current = point;
      drawing.current = true;
      if (tool === "pen") { context.beginPath(); context.moveTo(point.x, point.y); }
      return;
    }
    if (!drawing.current || !start.current) return;
    if (tool === "pen" && type === "move") {
      context.lineTo(point.x, point.y);
      context.strokeStyle = "#e4a400";
      context.lineWidth = 3 * scaleX;
      context.lineCap = "round";
      context.stroke();
    }
    if (type === "end" && tool === "highlight") {
      const { x, y } = start.current;
      context.fillStyle = "rgba(255, 217, 66, 0.4)";
      context.fillRect(Math.min(x, point.x), Math.min(y, point.y), Math.abs(point.x - x), Math.abs(point.y - y));
    }
    if (type === "end") { drawing.current = false; start.current = null; persistLayer(); }
  };

  const clear = () => {
    layers.current.delete(page);
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected || selected.type !== "application/pdf") return;
    layers.current.clear();
    setFile(selected);
    setPages(0);
    setPage(1);
    setPageSize({ width: 0, height: 0 });
    event.target.value = "";
  };

  const width = Math.max(260, Math.min(containerWidth || 320, 900));
  const height = pageSize.width ? Math.round((width * pageSize.height) / pageSize.width) : 0;

  return <div className={`w-full ${className}`}>
    {workspace && <div className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10"><div><h1 className="text-2xl font-medium tracking-[-.045em] sm:text-3xl">PDF workspace</h1><p className="mt-1 text-sm text-current/55">Highlighter, ink, and reset stay in this session. The source PDF is never modified.</p></div>{allowUpload && <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"><Upload size={16} />Choose PDF<input type="file" accept="application/pdf" onChange={chooseFile} className="sr-only" /></label>}</div>}
    {!file ? <div className="mt-8 grid min-h-72 place-items-center rounded-xl border border-dashed border-black/15 px-5 text-center dark:border-white/15"><div><Upload size={23} className="mx-auto text-current/40" /><p className="mt-3 text-sm font-medium">Choose a PDF to start viewing</p><p className="mt-1 text-xs text-current/45">Documents are never changed by this viewer.</p></div></div> : isGoogleDriveUrl(file) ? <iframe title={title} src={googleDriveEmbedUrl(file)} className="block min-h-[58vh] w-full bg-white sm:min-h-[70vh]" style={{ border: 0 }} /> : <>
      {workspace && <div className="mt-5 flex flex-wrap items-center gap-2"><button onClick={() => setTool("highlight")} className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm ${tool === "highlight" ? "bg-[#f1d85b] text-black" : "bg-black/5 dark:bg-white/10"}`}><Highlighter size={15} />Highlight</button><button onClick={() => setTool("pen")} className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm ${tool === "pen" ? "bg-[#f1d85b] text-black" : "bg-black/5 dark:bg-white/10"}`}><PenLine size={15} />Pen</button><button onClick={clear} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-current/60 hover:bg-black/5 dark:hover:bg-white/10"><RotateCcw size={15} />Clear annotations</button>{pages > 1 && <div className="ms-auto flex items-center gap-2"><button disabled={page <= 1} onClick={() => { persistLayer(); setPage((value) => Math.max(1, value - 1)); }} className="grid h-8 w-8 place-items-center rounded-full bg-black/5 disabled:opacity-40 dark:bg-white/10"><ChevronLeft size={16} /></button><span className="text-xs text-current/55">{page} / {pages}</span><button disabled={page >= pages} onClick={() => { persistLayer(); setPage((value) => Math.min(pages, value + 1)); }} className="grid h-8 w-8 place-items-center rounded-full bg-black/5 disabled:opacity-40 dark:bg-white/10"><ChevronRight size={16} /></button></div>}</div>}
      <div ref={containerRef} className="mt-3 w-full overflow-x-hidden rounded-xl border border-black/10 bg-[#e9e9e6] p-2 dark:border-white/10 dark:bg-[#202020]"><div className="relative mx-auto w-full max-w-full" style={{ width }}><Document file={file} onLoadSuccess={({ numPages }) => { setPages(numPages); setPage((current) => Math.min(current, numPages)); }} loading={<p className="p-8 text-sm">Loading PDF…</p>} error={<p className="p-8 text-sm">This PDF could not be displayed.</p>}><Page pageNumber={page} width={width} renderTextLayer={false} renderAnnotationLayer={false} onLoadSuccess={(loaded) => setPageSize({ width: loaded.width, height: loaded.height })} /></Document>{workspace && height > 0 && <canvas ref={canvasRef} width={width} height={height} onPointerDown={(event) => draw(event, "start")} onPointerMove={(event) => draw(event, "move")} onPointerUp={(event) => draw(event, "end")} onPointerCancel={(event) => draw(event, "end")} className="absolute left-0 top-0 max-w-full touch-none" style={{ width, height }} />}</div></div>
    </>}
  </div>;
}
