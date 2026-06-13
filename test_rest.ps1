$json = @"
{
  "statut": "Validé",
  "description": "Script test",
  "lignes": [
     {
       "produit": { "idProduit": 6 },
       "quantiteTheorique": 15,
       "quantiteReelle": 20,
       "ecart": 5,
       "observation": "testscript"
     }
  ]
}
"@

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8883/api/inventaires" -Method Post -ContentType "application/json" -Body $json
$response | ConvertTo-Json -Depth 6
