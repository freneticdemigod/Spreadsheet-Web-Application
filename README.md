# Angular Spreadsheet Application

This is a web-based spreadsheet application built with Angular that mimics core functionality of Google Sheets and Microsoft Excel. The application provides a familiar spreadsheet interface with features like cell editing, formula calculation, data validation, and CSV import/export capabilities.

![alt text](<Screenshot (448).png>)

## Features

- Excel-like grid interface with row (1, 2, 3...) and column (A, B, C...) headers
- Cell selection and range selection (via drag or direct input)
- Formula support with calculation engine
- Text formatting (bold, italic, color, font size)
- Data type validation (text, number, date)
- CSV import and export functionality
- File menu dropdown for spreadsheet operations

## Technology Stack

### Why Angular?

Angular was chosen for this project for several reasons:

1. **Component Architecture**: Angular's component-based architecture allows for clean separation of concerns, making the spreadsheet's complex UI elements easier to manage and test.

2. **Two-way Data Binding**: Angular's robust data binding simplifies synchronization between the UI and data model, essential for a spreadsheet application.

3. **Standalone Components**: Using Angular's standalone components reduces bundle size and simplifies the dependency management.

4. **TypeScript Support**: TypeScript provides strong typing, which helps catch errors early during development, critical for a calculation-intensive application.

5. **Reactive Programming**: Angular's integration with RxJS enables efficient handling of user interactions and data updates.

6. **Performance**: Angular's change detection strategy is well-suited for handling complex data grids with frequent updates.

## Usage Guide

### Basic Navigation

- Click on any cell to select it
- Double-click on a cell to enter edit mode
- Use the formula bar (top with "fx" prefix) to edit cell contents
- Drag to select multiple cells (creates a range)
- Enter a range manually in the "Range:" input (e.g., "A1:C5")

### Cell Formatting

- **B**: Toggle bold text for selected cell
- **I**: Toggle italic text for selected cell
- **Size**: Change font size for selected cell
- **Color picker**: Change text color for selected cell

### Data Validation

1. Select a cell or range of cells
2. Choose a data type from the dropdown (Text, Number, Date)
3. Enter data in the cell(s)
4. The application will validate your input against the selected data type

### Formulas

Start any formula with an equals sign (`=`). Supported functions include:

- `=SUM(A1:A5)` - Sum all values in the range A1 to A5
- `=AVERAGE(B1:B10)` - Calculate the average of values in range B1 to B10
- `=MIN(C1:C5)` - Find the minimum value in range C1 to C5
- `=MAX(D1:D5)` - Find the maximum value in range D1 to D5
- `=COUNT(E1:E5)` - Count the number of numeric values in range E1 to E5
- `=TRIM(A1)` - Remove leading and trailing whitespace from the value in A1
- `=UPPER(B1)` - Convert the text in B1 to uppercase
- `=LOWER(C1)` - Convert the text in C1 to lowercase
- `=FIND_AND_REPLACE(A1:A5, "hello", "world")` - Replace all instances of "hello" with "world" in the range A1 to A5
- `=REMOVE_DUPLICATES(A1:C5)` - Remove duplicate rows in the range A1 to C5

### File Operations

Click on "File" in the menu bar to access:

- **Download as CSV**: Export your spreadsheet data as a CSV file
- **Import CSV**: Upload a CSV file to populate the spreadsheet
- **Save**, **Save As**, and **Print** (currently non-functional placeholders)

### Non-functional Elements

Please note that the following menu options are non-functional and included only for UI completeness to mimic Google Sheets:
- View
- Insert
- Data
- Tools
- Format

## Development

### Project Structure

- **cell.model.ts**: Interface defining a cell structure
- **spreadsheet.service.ts**: Core logic for managing data and formula evaluation
- **spreadsheet.component.ts/html/css**: Main container component for the spreadsheet UI
- **cell.component.ts/html/css**: Individual cell component for display and editing
- **formula-bar.component.ts/html**: Component for the formula input bar

### How to Run

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `ng serve` to start the development server
4. Navigate to `http://localhost:4200/` in your browser

## Future Enhancements

- Add support for more complex formulas and functions
- Implement cell styles and conditional formatting
- Add chart generation capabilities
- Enable saving and loading spreadsheets from cloud storage
- Add collaboration features for multi-user editing

## License

[MIT License](LICENSE)

## Acknowledgements

This spreadsheet application was built as a demonstration of Angular capabilities for web-based productivity tools. It draws inspiration from Google Sheets and Microsoft Excel but is not affiliated with either product.