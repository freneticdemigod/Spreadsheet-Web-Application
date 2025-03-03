import { Injectable } from '@angular/core';
import { Cell } from '../models/cell.model';

@Injectable({
  providedIn: 'root'
})
export class SpreadsheetService {
  public data: Cell[][] = [];

  constructor() {
    // Initialize a 10 (rows) x 26 (columns) sheet
    for (let r = 0; r < 30; r++) {
      this.data[r] = [];
      for (let c = 0; c < 26; c++) {
        this.data[r][c] = { rawValue: '', computedValue: '' };
      }
    }
  }

  evaluateCell(row: number, col: number): string {
    const cell = this.data[row][col];
    const raw = cell.rawValue.trim();

    // If not starting with "=" then it's just a literal value
    if (!raw.startsWith('=')) {
      return raw;
    }

    // Remove '=' and convert everything to uppercase
    // (Be aware this also uppercases text arguments!)
    const formulaBody = raw.slice(1).toUpperCase();

    try {
      if (formulaBody.startsWith('SUM(')) {
        const rangeRef = this.extractRange(formulaBody, 'SUM(');
        return this.sum(rangeRef).toString();

      } else if (formulaBody.startsWith('AVERAGE(')) {
        const rangeRef = this.extractRange(formulaBody, 'AVERAGE(');
        return this.average(rangeRef).toString();

      } else if (formulaBody.startsWith('MIN(')) {
        const rangeRef = this.extractRange(formulaBody, 'MIN(');
        return this.min(rangeRef).toString();

      } else if (formulaBody.startsWith('MAX(')) {
        const rangeRef = this.extractRange(formulaBody, 'MAX(');
        return this.max(rangeRef).toString();

      } else if (formulaBody.startsWith('COUNT(')) {
        const rangeRef = this.extractRange(formulaBody, 'COUNT(');
        return this.count(rangeRef).toString();

      } else if (formulaBody.startsWith('TRIM(')) {
        const ref = this.extractRange(formulaBody, 'TRIM(');
        return this.trimValue(ref);

      } else if (formulaBody.startsWith('UPPER(')) {
        const ref = this.extractRange(formulaBody, 'UPPER(');
        return this.upperValue(ref);

      } else if (formulaBody.startsWith('LOWER(')) {
        const ref = this.extractRange(formulaBody, 'LOWER(');
        return this.lowerValue(ref);

      } else if (formulaBody.startsWith('FIND_AND_REPLACE(')) {
        // e.g. =FIND_AND_REPLACE(A1:A5, "hello", "world")
        return this.handleFindReplace(formulaBody);

      } else if (formulaBody.startsWith('REMOVE_DUPLICATES(')) {
        // e.g. =REMOVE_DUPLICATES(A1:C5)
        // which will remove any duplicate rows in that row range
        const rangeRef = this.extractRange(formulaBody, 'REMOVE_DUPLICATES(');
        return this.removeDuplicates(rangeRef);
      }

      return '#ERROR'; // unrecognized formula

    } catch {
      return '#ERROR';
    }
  }

  // ===================
  //      FORMULAS
  // ===================

  private extractRange(formula: string, fnNameWithParen: string): string {
    const closeParenIndex = formula.indexOf(')');
    return formula.substring(fnNameWithParen.length, closeParenIndex);
    // e.g. "SUM(A1:A5)" => "A1:A5"
  }

  private sum(rangeRef: string): number {
    const values = this.getValuesFromRange(rangeRef);
    return values.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  }

  private average(rangeRef: string): number {
    const values = this.getValuesFromRange(rangeRef);
    if (!values.length) return 0;
    const total = values.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
    return total / values.length;
  }

  private min(rangeRef: string): number {
    const values = this.getValuesFromRange(rangeRef);
    if (!values.length) return 0;
    return Math.min(...values.map(v => parseFloat(v) || 0));
  }

  private max(rangeRef: string): number {
    const values = this.getValuesFromRange(rangeRef);
    if (!values.length) return 0;
    return Math.max(...values.map(v => parseFloat(v) || 0));
  }

  private count(rangeRef: string): number {
    const values = this.getValuesFromRange(rangeRef);
    // Count numeric only
    return values.filter(v => !isNaN(parseFloat(v))).length;
  }

  private upperValue(cellRef: string): string {
    const { row, col } = this.refToRowCol(cellRef);
    return this.data[row][col].computedValue.toUpperCase();
  }

  private lowerValue(cellRef: string): string {
    const { row, col } = this.refToRowCol(cellRef);
    return this.data[row][col].computedValue.toLowerCase();
  }

  private trimValue(cellRef: string): string {
    const { row, col } = this.refToRowCol(cellRef);
    const original = this.data[row][col].computedValue;
    return original.trim();
  }

  // ============================
  // FIND_AND_REPLACE LOGIC
  // ============================
  private handleFindReplace(formulaBody: string): string {
    // Example formulaBody: FIND_AND_REPLACE(A1:A10, "hello", "world")
    // after uppercase: FIND_AND_REPLACE(A1:A10, "HELLO", "WORLD")

    const inner = formulaBody.slice('FIND_AND_REPLACE('.length);
    // e.g. "A1:A10, "HELLO","WORLD")"

    const closeParen = inner.lastIndexOf(')');
    const argumentsString = inner.substring(0, closeParen).trim();
    // => A1:A10, "HELLO","WORLD"

    // We expect 3 arguments: <range>, "<find>", "<replace>"
    const argRegex = /^([^,]+)\s*,\s*"(.*?)"\s*,\s*"(.*?)"$/;
    const match = argRegex.exec(argumentsString);
    if (!match) {
      return '#ERROR: FIND_AND_REPLACE syntax';
    }
    const rangeRef = match[1].trim();   // e.g. A1:A10
    const findStr = match[2];          // e.g. HELLO (uppercase due to formulaBody)
    const replaceStr = match[3];       // e.g. WORLD (uppercase)

    return this.findAndReplace(rangeRef, findStr, replaceStr);
  }

  private findAndReplace(rangeRef: string, findStr: string, replaceStr: string): string {
    const [startRef, endRef] = rangeRef.split(':');
    const start = this.refToRowCol(startRef);
    const end = this.refToRowCol(endRef);

    let replacements = 0;

    for (let r = start.row; r <= end.row; r++) {
      for (let c = start.col; c <= end.col; c++) {
        // We'll do a simple replacement on rawValue
        const oldVal = this.data[r][c].rawValue;
        if (oldVal.includes(findStr)) {
          const newVal = oldVal.split(findStr).join(replaceStr);
          this.data[r][c].rawValue = newVal;
          replacements++;
        }
      }
    }

    return `Replaced ${replacements} occurrence(s) of "${findStr}"`;
  }

  // ============================
  // REMOVE_DUPLICATES LOGIC
  // ============================
  private removeDuplicates(rangeRef: string): string {
    // e.g. "A1:C5" means from row A1's row to row C5's row
    const [startRef, endRef] = rangeRef.split(':');
    const start = this.refToRowCol(startRef);
    const end = this.refToRowCol(endRef);

    let rowSignatures = new Set<string>();
    let rowsToRemove: number[] = [];

    // Step 1: identify duplicates
    for (let r = start.row; r <= end.row; r++) {
      // build a "signature" of columns in the chosen range
      let rowValues: string[] = [];
      for (let c = start.col; c <= end.col; c++) {
        rowValues.push(this.data[r][c].computedValue);
      }
      const signature = JSON.stringify(rowValues);
      if (rowSignatures.has(signature)) {
        // mark this row for removal
        rowsToRemove.push(r);
      } else {
        rowSignatures.add(signature);
      }
    }

    const removedCount = rowsToRemove.length;

    // Step 2: remove those rows from data, from bottom to top so index shifting doesn't break
    rowsToRemove.sort((a, b) => b - a);
    for (const rowIndex of rowsToRemove) {
      // remove row
      this.data.splice(rowIndex, 1);
      // optionally re-insert a blank row at the bottom to keep the sheet size consistent
      let newRow: Cell[] = [];
      for (let c = 0; c < 26; c++) {
        newRow.push({ rawValue: '', computedValue: '' });
      }
      this.data.push(newRow);
    }

    return `Removed ${removedCount} duplicates`;
  }

  // ============================
  // RANGES & CELL REF
  // ============================
  // Convert e.g. "A1:A5" into actual data
  private getValuesFromRange(rangeRef: string): string[] {
    const [startRef, endRef] = rangeRef.split(':');
    const start = this.refToRowCol(startRef);
    const end = this.refToRowCol(endRef);

    const extracted: string[] = [];
    for (let r = start.row; r <= end.row; r++) {
      for (let c = start.col; c <= end.col; c++) {
        extracted.push(this.data[r][c].computedValue);
      }
    }
    return extracted;
  }

  private refToRowCol(cellRef: string): { row: number, col: number } {
    // e.g. "A1" => row=0, col=0; "B2" => row=1, col=1
    // If no match, fallback to {0,0}
    const colMatch = cellRef.match(/[A-Z]+/);
    const rowMatch = cellRef.match(/\d+/);

    if (!colMatch || !rowMatch) {
      return { row: 0, col: 0 };
    }

    // Convert letters to 0-based column
    let col = colMatch[0].charCodeAt(0) - 65; // 'A'->0, 'B'->1, ...
    // Convert row string to 0-based index
    let row = parseInt(rowMatch[0], 10) - 1;
    return { row, col };
  }
}
