import {
  FileSpreadsheet,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReportExportButtonsProps {
  onExportCSV: () => void;
  onExportExcel: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function ReportExportButtons({
  onExportCSV,
  onExportExcel,
  disabled = false,
  loading = false,
}: ReportExportButtonsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="rounded-xl"
          disabled={disabled || loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExportCSV}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
