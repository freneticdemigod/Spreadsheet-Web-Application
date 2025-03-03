import { Component, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SpreadsheetService } from '../services/spreadsheet.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CellComponent } from './cell/cell.component';

@Component({
  selector: 'app-spreadsheet',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CellComponent
  ],
  templateUrl: './spreadsheet.component.html',
  styleUrls: ['./spreadsheet.component.css']
})
export class SpreadsheetComponent implements OnDestroy {
  // For simplicity, a 10x10 grid
  rows = Array.from({ length: 30 });
  cols = Array.from({ length: 26 });

  // Currently selected single cell (for formula bar)
  selectedCell: { row: number; col: number } | null = null;

  // Range selector input text (e.g., "A1:C5")
  rangeInput: string = '';

  // Parsed object for multi-cell selected range
  selectedRange: {
    start: { row: number; col: number };
    end: { row: number; col: number };
  } | null = null;

  // Drag-to-select state
  isSelecting = false;
  dragStart: { row: number; col: number } | null = null;

  // File menu state
  fileMenuVisible = false;
  
  // Browser detection
  private isBrowser: boolean;

  constructor(
    public spreadsheetService: SpreadsheetService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // Get column letter headers (A, B, C, ...)
  getColumnHeader(index: number): string {
    return String.fromCharCode(65 + index);
  }

  // Get row number headers (1, 2, 3, ...)
  getRowHeader(index: number): string {
    return (index + 1).toString();
  }

  // ----------------------------
  // Menu Handling
  // ----------------------------
  toggleFileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.fileMenuVisible = !this.fileMenuVisible;

    // Add a click handler to the document to close the menu when clicking outside
    if (this.fileMenuVisible && this.isBrowser) {
      setTimeout(() => {
        document.addEventListener('click', this.closeFileMenu);
      }, 0);
    }
  }

  hideFileMenu(): void {
    this.fileMenuVisible = false;
  }

  closeFileMenu = (event: MouseEvent): void => {
    this.fileMenuVisible = false;
    if (this.isBrowser) {
      document.removeEventListener('click', this.closeFileMenu);
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      document.removeEventListener('click', this.closeFileMenu);
    }
  }

  // ----------------------------
  // Single-Cell & Formula Bar Logic
  // ----------------------------

  onSelectCell(rowIndex: number, colIndex: number): void {
    this.selectedCell = { row: rowIndex, col: colIndex };
  }

  onFormulaChange(newFormula: string): void {
    if (this.selectedCell) {
      const { row, col } = this.selectedCell;
      // Update rawValue and recalc
      this.spreadsheetService.data[row][col].rawValue = newFormula;
      this.recalculateSheet();
    }
  }

  onCellBlur({ row, col }: { row: number; col: number }): void {
    this.recalculateSheet();
  }

  recalculateSheet(): void {
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        this.spreadsheetService.data[r][c].computedValue =
          this.spreadsheetService.evaluateCell(r, c);
      }
    }
  }

  getSelectedCellRawValue(): string {
    if (!this.selectedCell) return '';
    const { row, col } = this.selectedCell;
    return this.spreadsheetService.data[row][col].rawValue;
  }

  isCellSelected(row: number, col: number): boolean {
    return this.selectedCell?.row === row && this.selectedCell?.col === col;
  }

  // ----------------------------
  // Range Selector via Drag & Input
  // ----------------------------

  // Called when user types in the Range input box
  onRangeInputChange(newRangeValue: string): void {
    this.rangeInput = newRangeValue;
    this.selectedRange = this.parseRangeInput(newRangeValue);
  }

  // Parse a string like "A1:C5" into a range object
  parseRangeInput(rangeStr: string) {
    rangeStr = rangeStr.trim();
    if (!rangeStr) return null;
    const parts = rangeStr.split(':');
    if (parts.length === 1) {
      const single = this.refToRowCol(parts[0]);
      if (!single) return null;
      return { start: single, end: single };
    } else if (parts.length === 2) {
      const start = this.refToRowCol(parts[0]);
      const end = this.refToRowCol(parts[1]);
      if (!start || !end) return null;
      const rowStart = Math.min(start.row, end.row);
      const rowEnd = Math.max(start.row, end.row);
      const colStart = Math.min(start.col, end.col);
      const colEnd = Math.max(start.col, end.col);
      return { start: { row: rowStart, col: colStart }, end: { row: rowEnd, col: colEnd } };
    }
    return null;
  }

  // Convert a reference like "A1" into numeric coordinates { row:0, col:0 }
  refToRowCol(cellRef: string): { row: number; col: number } | null {
    const colMatch = cellRef.match(/[A-Z]+/i);
    const rowMatch = cellRef.match(/\d+/);
    if (!colMatch || !rowMatch) return null;
    let colStr = colMatch[0].toUpperCase();
    let colIndex = 0;
    for (let i = 0; i < colStr.length; i++) {
      colIndex = colIndex * 26 + (colStr.charCodeAt(i) - 65 + 1);
    }
    colIndex -= 1;
    let rowIndex = parseInt(rowMatch[0], 10) - 1;
    if (rowIndex < 0 || colIndex < 0) return null;
    return { row: rowIndex, col: colIndex };
  }

  // Returns true if cell (r,c) lies within the selected range
  isCellInRange(r: number, c: number): boolean {
    if (!this.selectedRange) return false;
    const { start, end } = this.selectedRange;
    return r >= start.row && r <= end.row && c >= start.col && c <= end.col;
  }

  // ----------------------------
  // Data Type (Validation) Logic
  // ----------------------------
  onDataTypeChange(newType: string): void {
    if (!this.selectedRange) return;
    const { start, end } = this.selectedRange;
    for (let r = start.row; r <= end.row; r++) {
      for (let c = start.col; c <= end.col; c++) {
        this.spreadsheetService.data[r][c].dataType = newType;
      }
    }
  }

  // ----------------------------
  // Drag-to-Select Mouse Event Handlers
  // ----------------------------
  onMouseDown(event: MouseEvent, row: number, col: number): void {
    if (event.button === 0) {
      this.isSelecting = true;
      this.dragStart = { row, col };
      this.selectedRange = { start: { row, col }, end: { row, col } };
    }
  }

  onMouseMove(event: MouseEvent, row: number, col: number): void {
    if (this.isSelecting && this.dragStart) {
      const rStart = Math.min(this.dragStart.row, row);
      const rEnd = Math.max(this.dragStart.row, row);
      const cStart = Math.min(this.dragStart.col, col);
      const cEnd = Math.max(this.dragStart.col, col);
      this.selectedRange = { start: { row: rStart, col: cStart }, end: { row: rEnd, col: cEnd } };
      // Optionally, update the range input display in real time:
      const startRef = this.cellRefToString({ row: rStart, col: cStart });
      const endRef = this.cellRefToString({ row: rEnd, col: cEnd });
      this.rangeInput = startRef === endRef ? startRef : `${startRef}:${endRef}`;
    }
  }

  onMouseUp(event: MouseEvent): void {
    if (this.isSelecting) {
      this.isSelecting = false;
      this.dragStart = null;
      // Final rangeInput is already updated by onMouseMove
    }
  }

  // Helper: Convert a cell coordinate to an A1-style reference (e.g., {0,0} => "A1")
  cellRefToString(cell: { row: number; col: number }): string {
    let colNum = cell.col + 1;
    let colStr = '';
    while (colNum > 0) {
      const rem = (colNum - 1) % 26;
      colStr = String.fromCharCode(65 + rem) + colStr;
      colNum = Math.floor((colNum - 1) / 26);
    }
    return colStr + (cell.row + 1);
  }

  downloadCSV(): void {
    if (!this.isBrowser) return;
    
    let csvContent = '';
    
    // Iterate through each row of your spreadsheet data
    for (let r = 0; r < this.spreadsheetService.data.length; r++) {
      // Map each cell's computedValue into a CSV-friendly string
      const row = this.spreadsheetService.data[r].map(cell => {
        // Escape any double quotes by replacing " with ""
        const cellText = cell.computedValue.replace(/"/g, '""');
        return `"${cellText}"`;
      }).join(',');
      csvContent += row + '\n';
    }
  
    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
  
    // Create a temporary link element and trigger the download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'spreadsheet.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Add a method to handle file selection
  onFileSelected(event: any): void {
    if (!this.isBrowser) return;
    
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvText = e.target?.result as string;
        this.loadCSVData(csvText);
      };
      reader.readAsText(file);
    }
  }

  // Parse CSV text and update the spreadsheet data
  loadCSVData(csvText: string): void {
    // Split by newlines to get rows; adjust for different newline formats if necessary.
    const lines = csvText.split(/\r\n|\n/);
    const newData: any[] = [];

    lines.forEach(line => {
      // Skip empty lines
      if (!line.trim()) {
        return;
      }
      // Split the line by commas. This is a simple split.
      // For more robust CSV parsing (handling quoted commas, etc.), consider a library.
      const cells = line.split(',');
      // Optionally, remove surrounding quotes from each cell.
      const cleanedCells = cells.map(cell => cell.trim().replace(/^"|"$/g, ''));
      newData.push(cleanedCells);
    });

    // Update the SpreadsheetService data with the new CSV data.
    // For this example, we'll assume each cell's rawValue and computedValue are set to the CSV cell text.
    // You might need to adjust grid dimensions accordingly.
    // Here, we'll clear the current grid and create a new one.
    this.spreadsheetService.data = newData.map((row: string[]) =>
      row.map((cellText: string) => ({
        rawValue: cellText,
        computedValue: cellText
      }))
    );

    // Optionally, update rows/cols arrays if you want the grid size to match the CSV.
    this.rows = Array.from({ length: newData.length });
    this.cols = Array.from({ length: newData[0]?.length || 0 });

    // Recalculate if you have formulas that need evaluation.
    this.recalculateSheet();
  }

  // --------------------------
  // Formatting (Cell Styling) Methods
  // --------------------------
  // Toggle Bold for the selected cell
  toggleBold(): void {
    if (this.selectedCell) {
      const { row, col } = this.selectedCell;
      const cell = this.spreadsheetService.data[row][col];
      cell.bold = !cell.bold;
      this.recalculateSheet();
    }
  }

  // Toggle Italic for the selected cell
  toggleItalic(): void {
    if (this.selectedCell) {
      const { row, col } = this.selectedCell;
      const cell = this.spreadsheetService.data[row][col];
      cell.italic = !cell.italic;
      this.recalculateSheet();
    }
  }

  // Change font size for the selected cell
  onFontSizeChange(newSize: string): void {
    if (this.selectedCell) {
      const size = parseInt(newSize, 10);
      if (!isNaN(size)) {
        const { row, col } = this.selectedCell;
        this.spreadsheetService.data[row][col].fontSize = size;
        this.recalculateSheet();
      }
    }
  }

  // Change text color for the selected cell
  onColorChange(newColor: string): void {
    if (this.selectedCell) {
      const { row, col } = this.selectedCell;
      this.spreadsheetService.data[row][col].color = newColor;
      this.recalculateSheet();
    }
  }
}