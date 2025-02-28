import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { SpreadsheetComponent } from './spreadsheet/spreadsheet.component';
import { CellComponent } from './spreadsheet/cell/cell.component';
import { FormulaBarComponent } from './spreadsheet/formula-bar/formula-bar.component';

@NgModule({
  imports: [
    AppComponent,
    SpreadsheetComponent,
    CellComponent,
    FormulaBarComponent,
    BrowserModule,
    FormsModule  // Needed for [(ngModel)] in <input>
  ],
  providers: [],
  bootstrap: []
})
export class AppModule { }
export { AppComponent };

