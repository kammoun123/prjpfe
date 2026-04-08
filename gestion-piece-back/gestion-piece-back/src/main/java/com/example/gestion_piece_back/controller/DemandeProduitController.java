package com.example.gestion_piece_back.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import com.example.gestion_piece_back.service.DemandeProduitService;
import com.example.gestion_piece_back.model.DemandeProduit;

@RestController
@RequestMapping("/api/demandes")
@CrossOrigin("*")
public class DemandeProduitController {

    @Autowired
    private DemandeProduitService demandeProduitService;

    @GetMapping
    public List<DemandeProduit> getDemandes() {
        return demandeProduitService.getAllDemandes();
    }

    @PostMapping
    public DemandeProduit createDemande(@RequestBody DemandeProduit demande) {
        return demandeProduitService.createDemande(demande);
    }

    @DeleteMapping("/{id}")
    public void deleteDemande(@PathVariable Long id) {
        demandeProduitService.deleteDemande(id);
    }

    @PatchMapping("/{id}/statut")
    public DemandeProduit updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statut = body.get("statut");
        return demandeProduitService.updateStatus(id, statut);
    }
}