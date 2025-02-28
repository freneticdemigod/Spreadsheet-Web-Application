import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-formula-bar',
  standalone: true,  
  template: `
    <div class="formula-bar">
      <input
        type="text"
        [value]="formula"
        (input)="handleInputChange($event)"
        placeholder="Enter formula or value"
      />
    </div>
  `
})
export class FormulaBarComponent {
  @Input() selectedCell: { row: number; col: number } | null = null;
  @Input() formula: string = '';
  @Output() formulaChange = new EventEmitter<string>();

  handleInputChange(event: any) {
    this.formulaChange.emit(event.target.value);
  }
}
