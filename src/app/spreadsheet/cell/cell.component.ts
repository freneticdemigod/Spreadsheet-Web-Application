import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Cell } from '../../models/cell.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cell',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.css']
})
export class CellComponent {
  @Input() row!: number;
  @Input() col!: number;
  @Input() cellData!: Cell;
  @Input() isSelected!: boolean;
  @Input() isInRange: boolean = false;

  @Output() selectCell = new EventEmitter<void>();
  @Output() blurCell = new EventEmitter<{ row: number; col: number }>();

  editing = false;

  onCellClick(): void {
    this.selectCell.emit();
  }

  onCellDoubleClick(): void {
    console.log('Double-click detected!');
    this.editing = true;
  }

  onBlur(): void {
    this.editing = false;
    this.validateCell();
    this.blurCell.emit({ row: this.row, col: this.col });
  }

  validateCell(): void {
    const dt = this.cellData.dataType || 'text';
    const rawVal = this.cellData.rawValue;
    if (dt === 'number') {
      if (isNaN(+rawVal)) {
        this.cellData.validationError = 'Must be a numeric value';
      } else {
        this.cellData.validationError = '';
      }
    } else if (dt === 'date') {
      const dateVal = new Date(rawVal);
      if (isNaN(dateVal.getTime())) {
        this.cellData.validationError = 'Invalid date';
      } else {
        this.cellData.validationError = '';
      }
    } else {
      this.cellData.validationError = '';
    }
  }
}
