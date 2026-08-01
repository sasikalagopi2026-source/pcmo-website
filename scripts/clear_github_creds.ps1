# Delete Windows Credential Manager entries that reference GitHub
$lines = cmdkey /list
foreach ($line in $lines) {
  if ($line -match 'Target:\s*(.*)') {
    $t = $matches[1].Trim()
    if ($t -match '(?i)github') {
      Write-Output "Deleting: $t"
      cmdkey /delete:$t
    }
  }
}
