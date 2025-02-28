import { Component } from '@angular/core';
import { SpreadsheetComponent } from './spreadsheet/spreadsheet.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [SpreadsheetComponent,CommonModule,FormsModule]
})
export class AppComponent {}