package com.example.gestion_piece_back.controller;

import com.example.gestion_piece_back.model.Utilisateur;
import com.example.gestion_piece_back.service.UtilisateurService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    @GetMapping
    public List<Utilisateur> getAllUsers() {
        System.out.println("Fetching all users...");
        List<Utilisateur> users = utilisateurService.findAll();
        System.out.println("Found " + users.size() + " users.");
        return users;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Utilisateur> getUserById(@PathVariable Long id) {
        return utilisateurService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Utilisateur> updateUser(@PathVariable Long id, @Valid @RequestBody Utilisateur userDetails) {
        return ResponseEntity.ok(utilisateurService.updateUtilisateur(id, userDetails));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Utilisateur> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(utilisateurService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        utilisateurService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
