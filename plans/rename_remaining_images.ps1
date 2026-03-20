# PowerShell Script to Rename Remaining Image Files
# Run this script from the project root directory

Write-Host "Starting image file renaming process..." -ForegroundColor Green

$sourceDir = "static\imgs\words"
$renamedCount = 0
$skippedCount = 0
$errorCount = 0

# Get all jpg files that start with SM (need renaming)
$files = Get-ChildItem -Path $sourceDir -Filter "SM*.jpg" -File

Write-Host "Found $($files.Count) files to process" -ForegroundColor Cyan

foreach ($file in $files) {
    $filename = $file.Name
    
    # Extract the word from the filename pattern: SM#_U#_W#_word_1.jpg
    # Pattern: SM##_U#_W##_word_1.jpg or SM#_U#_W#_word_1.jpg
    
    if ($filename -match '^SM\d+_U\d+_W\d+_(.+)_1\.jpg$') {
        $word = $matches[1]
        $newFilename = "$word.jpg"
        $newPath = Join-Path $sourceDir $newFilename
        
        # Check if target already exists
        if (Test-Path $newPath) {
            Write-Host "  SKIPPED (exists): $filename -> $newFilename" -ForegroundColor DarkYellow
            $skippedCount++
        } else {
            try {
                Rename-Item -Path $file.FullName -NewName $newFilename
                Write-Host "  RENAMED: $filename -> $newFilename" -ForegroundColor Green
                $renamedCount++
            } catch {
                Write-Host "  ERROR: Could not rename $filename : $_" -ForegroundColor Red
                $errorCount++
            }
        }
    } else {
        Write-Host "  SKIP (no match): $filename" -ForegroundColor Gray
    }
}

Write-Host "`n========================================" -ForegroundColor White
Write-Host "SUMMARY" -ForegroundColor White
Write-Host "========================================" -ForegroundColor White
Write-Host "  Renamed: $renamedCount" -ForegroundColor Green
Write-Host "  Skipped (already exist): $skippedCount" -ForegroundColor DarkYellow
Write-Host "  Errors: $errorCount" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor White
