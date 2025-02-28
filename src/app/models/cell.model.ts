export interface Cell {
    rawValue: string;           
    computedValue: string;      
    bold?: boolean;             
    italic?: boolean;
    color?: string;
    fontSize?: number;
    dataType?: string;
    validationError?: string;
  }
  