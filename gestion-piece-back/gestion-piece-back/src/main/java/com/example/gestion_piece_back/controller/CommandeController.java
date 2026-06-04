package com.example.gestion_piece_back.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.example.gestion_piece_back.model.Commande;
import com.example.gestion_piece_back.service.CommandeService;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/commandes")
@CrossOrigin("*")
public class CommandeController {

    @Autowired
    private CommandeService commandeService;

    @GetMapping
    public List<Commande> getAllCommandes() {
        return commandeService.getAllCommandes();
    }

    @PostMapping
    public Commande creerCommande(@RequestBody Map<String, Object> payload) {
        Long idDemande = Long.valueOf(payload.get("idDemande").toString());
        Long idFournisseur = Long.valueOf(payload.get("idFournisseur").toString());
        String dateStr = (String) payload.get("dateReceptionPrevue");
        java.time.LocalDate datePrev = dateStr != null ? java.time.LocalDate.parse(dateStr) : null;
        String observation = (String) payload.get("observation");

        return commandeService.creerCommande(idDemande, idFournisseur, datePrev, observation);
    }

    @PostMapping("/directe")
    public Commande creerCommandeDirecte(@RequestBody Map<String, Object> payload) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) payload.get("items");
        Long idFournisseur = Long.valueOf(payload.get("idFournisseur").toString());
        String dateStr = (String) payload.get("dateReceptionPrevue");
        java.time.LocalDate datePrev = dateStr != null ? java.time.LocalDate.parse(dateStr) : null;
        String observation = (String) payload.get("observation");

        return commandeService.creerCommandeDirecte(items, idFournisseur, datePrev, observation);
    }

    @PutMapping("/{id}/receptionner")
    public Commande receptionner(@PathVariable Long id) {
        return commandeService.receptionnerCommande(id);
    }
}
