package com.example.gestion_piece_back.controller;

import com.example.gestion_piece_back.model.DemandeInscription;
import com.example.gestion_piece_back.model.Utilisateur;
import com.example.gestion_piece_back.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/demandes-inscription")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DemandeInscriptionController {

    private final UtilisateurService utilisateurService;

    @GetMapping
    public List<DemandeInscription> getAll() {
        return utilisateurService.findAllDemandes();
    }

    @PostMapping("/{id}/accepter")
    public ResponseEntity<Utilisateur> accepter(@PathVariable Long id) {
        return ResponseEntity.ok(utilisateurService.accepterDemande(id));
    }

    @PostMapping("/{id}/refuser")
    public ResponseEntity<Void> refuser(@PathVariable Long id) {
        utilisateurService.refuserDemande(id);
        return ResponseEntity.noContent().build();
    }
}
