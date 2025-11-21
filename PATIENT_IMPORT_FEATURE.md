# Patient CSV Import Feature

## Overview
The Patient CSV Import feature allows administrators to upload patient records from other facilities in bulk using CSV files.

## Features Implemented

### 1. Import Modal (`ImportPatientsModal.tsx`)
- **File Upload**: Drag-and-drop or click to select CSV files
- **CSV Parsing**: Robust parser handling quoted values and commas in fields
- **Data Preview**: Shows first 5 rows with all columns in a scrollable table
- **Validation**: 
  - Required fields: name, email
  - Date format validation (YYYY-MM-DD)
  - Row-by-row validation with detailed error reporting
- **Batch Processing**: Imports records one by one with progress tracking
- **Results Display**:
  - Success/failure counts
  - Detailed error table showing row number, field, and error message
- **Template Download**: One-click download of properly formatted CSV template

### 2. Supported CSV Columns
| Column | Required | Description |
|--------|----------|-------------|
| name | ✓ | Patient full name |
| email | ✓ | Patient email address |
| dateOfBirth | | Format: YYYY-MM-DD |
| phone | | Contact number with country code |
| address | | Street address |
| city | | City name |
| state | | State/Province |
| country | | Country name |
| postalCode | | ZIP/Postal code |
| gender | | Male/Female/Other |
| bloodType | | A+, A-, B+, B-, AB+, AB-, O+, O- |
| allergies | | Comma-separated list |
| chronicConditions | | Comma-separated list |
| emergencyContactName | | Emergency contact full name |
| emergencyContactPhone | | Emergency contact number |

### 3. User Interface
**Data Management Page** (`DataManagementView.tsx`):
- Clean import section with icon and description
- "Start Import" button opens the modal
- Success toast notification after import completion

### 4. Error Handling
- File type validation (CSV only)
- Empty file detection
- Missing required fields per row
- Invalid date formats
- Detailed error reporting in table format

## Usage Instructions

### For Administrators:
1. Navigate to Admin Dashboard → Data Management
2. In the "Import Patient Data" section, click "Start Import"
3. Options:
   - Click "Download Template" to get a properly formatted CSV
   - Drag and drop your CSV file, or click to browse
4. Preview the data (first 5 rows displayed)
5. Click "Import Patients" to begin
6. View import results:
   - Success count
   - Failure count with detailed error table
7. Click "Import Another File" to continue, or close the modal

### CSV Template
A sample CSV template is provided in `patient_import_sample.csv` with 5 example records showing:
- Proper formatting for all fields
- How to handle commas in fields (using quotes)
- Nigerian addresses and phone numbers
- Various blood types and medical conditions

## Technical Details

### Components Created:
- `pages/admin/ImportPatientsModal.tsx` (479 lines)
  - CSV parser: `parseCSVLine()` function
  - Data validator: `validatePatientData()` function
  - Batch processor with simulated API calls
  - Template generator: `downloadTemplate()` function

### Components Modified:
- `pages/admin/DataManagementView.tsx`
  - Removed old file dropzone UI
  - Added modal integration
  - Added success callback handler
  - Cleaned up unused state and functions

### Icons Used:
- UploadCloudIcon: Upload indicator
- CheckCircleIcon: Success states
- XCircleIcon: Error states
- AlertCircleIcon: Info banner
- ArrowDownIcon: Download template

## Future Enhancements

### Planned (Coming Soon):
1. **Excel Support** (.xlsx)
   - Library: xlsx or exceljs
   - Multi-sheet support
   - Format preservation

2. **PDF Support**
   - Text extraction from structured PDFs
   - Table detection and parsing
   - Multi-page support

3. **DOCS/DOCX Support**
   - Library: mammoth.js
   - Structured table extraction
   - Format preservation

### Backend Integration (Next Phase):
- API endpoint: `POST /api/patients/import`
- File upload handling
- Actual patient record creation in database
- Duplicate detection by email
- Organization ID association
- Import history tracking
- Audit logging

### Advanced Features:
- **Field Mapping UI**: Map non-standard CSV columns to system fields
- **Duplicate Detection**: Check for existing patients by email before import
- **Preview All**: Option to preview entire file before import
- **Large File Support**: Streaming for files with 1000+ records
- **Import History**: Log of all imports with rollback capability
- **Multi-Organization**: Import to specific organization (for enterprise admins)

## Testing

### Test Files Provided:
1. `patient_import_sample.csv` - 5 valid records with diverse data

### Manual Testing Steps:
1. **Valid Import**:
   - Use `patient_import_sample.csv`
   - Verify all 5 records import successfully
   - Check toast notification

2. **Invalid Data**:
   - Remove email from row 3
   - Verify error shows "Email is required" for row 3
   - Check error details table

3. **Template Download**:
   - Click "Download Template"
   - Open in Excel/Numbers/Google Sheets
   - Verify all 15 columns present with proper headers

4. **Large File** (optional):
   - Create CSV with 100+ records
   - Verify progress indicator works
   - Check performance

5. **Edge Cases**:
   - Empty CSV file
   - CSV with only headers
   - Invalid date format (test with "Jan 5, 1990")
   - Special characters in names (test with "O'Brien")

## Build Status
✅ Build successful (987.77 kB → 822.82 KiB optimized)
✅ No TypeScript errors
✅ 205 modules transformed
✅ PWA service worker generated

## Deployment Notes
- No database migrations required (feature uses existing Patient model)
- No environment variables needed
- No additional dependencies installed
- Feature is client-side only (ready for backend integration)

## Accounts for Testing
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@chihealth.com | password123 |
| Enterprise Admin | enterprise@chihealth.com | password123 |

Navigate to: Admin Dashboard → Data Management → Import Patient Data
