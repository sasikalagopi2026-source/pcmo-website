import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

type TableValue = string | number | boolean | null | undefined;
type ChartValue = string | number;

type TableChart = {
  data: Array<Record<string, ChartValue>>;
  xKey: string;
  series: Array<{ key: string; label: string; color: string }>;
};

type AdminDataTableProps<T extends Record<string, TableValue>> = {
  title: string;
  description: string;
  columns: { key: keyof T; label: string }[];
  rows: T[];
  exportName: string;
  chart?: TableChart;
};

const displayValue = (value: TableValue) => value == null ? "" : String(value);

const escapeHtml = (value: TableValue) =>
  displayValue(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const AdminDataTable = <T extends Record<string, TableValue>>({
  title,
  description,
  columns,
  rows,
  exportName,
  chart,
}: AdminDataTableProps<T>) => {
  const downloadExcel = () => {
    const worksheet = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8"></head>
        <body>
          <table>
            <thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead>
            <tbody>
              ${rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column.key])}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>
        </body>
      </html>`;
    const blob = new Blob([worksheet], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportName}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 32;
    const tableWidth = pageWidth - margin * 2;
    const columnWidth = tableWidth / columns.length;
    const lineHeight = 11;
    const cellPadding = 5;
    const headerHeight = 24;
    let y = 62;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(title, margin, 30);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(description, margin, 45, { maxWidth: tableWidth });

    const drawHeader = () => {
      pdf.setFillColor(236, 239, 244);
      pdf.rect(margin, y, tableWidth, headerHeight, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      columns.forEach((column, index) => {
        pdf.text(column.label, margin + index * columnWidth + cellPadding, y + 15, {
          maxWidth: columnWidth - cellPadding * 2,
        });
      });
      y += headerHeight;
    };

    drawHeader();
    pdf.setFont("helvetica", "normal");

    rows.forEach((row) => {
      const cells = columns.map((column) =>
        pdf.splitTextToSize(displayValue(row[column.key]), columnWidth - cellPadding * 2)
      );
      const rowHeight = Math.max(22, Math.max(...cells.map((cell) => cell.length)) * lineHeight + cellPadding * 2);

      if (y + rowHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
        drawHeader();
        pdf.setFont("helvetica", "normal");
      }

      pdf.setDrawColor(215, 219, 225);
      pdf.line(margin, y + rowHeight, margin + tableWidth, y + rowHeight);
      cells.forEach((cell, index) => {
        pdf.text(cell, margin + index * columnWidth + cellPadding, y + cellPadding + 8, {
          maxWidth: columnWidth - cellPadding * 2,
        });
      });
      y += rowHeight;
    });

    pdf.save(`${exportName}.pdf`);
  };

  const chartConfig = (chart?.series ?? []).reduce<ChartConfig>((config, series) => {
    config[series.key] = { label: series.label, color: series.color };
    return config;
  }, {});

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={downloadExcel}>
            <Download className="h-4 w-4" /> Excel
          </Button>
          <Button size="sm" variant="outline" onClick={downloadPdf}>
            <FileDown className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>
      {chart && chart.data.length > 0 && chart.series.length > 0 && (
        <div className="border-b border-border px-4 py-5">
          <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto">
            <BarChart data={chart.data} margin={{ left: 0, right: 12, top: 8, bottom: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey={chart.xKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                tickFormatter={(value) => String(value).length > 18 ? `${String(value).slice(0, 18)}...` : String(value)}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {chart.series.map((series) => (
                <Bar
                  key={series.key}
                  dataKey={series.key}
                  fill={`var(--color-${series.key})`}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ChartContainer>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)} className="whitespace-nowrap">{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={String(column.key)}>{displayValue(row[column.key])}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

export default AdminDataTable;
