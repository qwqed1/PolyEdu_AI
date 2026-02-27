Add-Type -AssemblyName System.IO.Compression.FileSystem

$filePath = Get-ChildItem "c:\Users\Admin\Documents\ushi-it\*.docx" | Select-Object -First 1 -ExpandProperty FullName
Write-Host "File: $filePath"

$zip = [System.IO.Compression.ZipFile]::OpenRead($filePath)
$entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$content = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

# Extract all text content preserving some structure
$matches = [regex]::Matches($content, '<w:t[^>]*>([^<]*)</w:t>')
$allText = ""
foreach ($match in $matches) {
    $allText += $match.Groups[1].Value
}

# Also find table row boundaries for structure
$rowMatches = [regex]::Matches($content, '</w:tr>')
Write-Host "Total table rows found: $($rowMatches.Count)"

# Extract text per table row
$trPattern = '<w:tr[^>]*>(.*?)</w:tr>'
$trMatches = [regex]::Matches($content, $trPattern, 'Singleline')
Write-Host "Table rows with content: $($trMatches.Count)"

$rowNum = 0
foreach ($trMatch in $trMatches) {
    $rowNum++
    $cellTexts = [regex]::Matches($trMatch.Value, '<w:tc[^>]*>(.*?)</w:tc>', 'Singleline')
    $line = ""
    foreach ($cellMatch in $cellTexts) {
        $texts = [regex]::Matches($cellMatch.Value, '<w:t[^>]*>([^<]*)</w:t>')
        $cellText = ""
        foreach ($t in $texts) {
            $cellText += $t.Groups[1].Value
        }
        $line += $cellText + " | "
    }
    Write-Host "Row $rowNum`: $line"
}
