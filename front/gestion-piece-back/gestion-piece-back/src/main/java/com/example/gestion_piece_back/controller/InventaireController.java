package com.example.gestion_piece_back.controller;

import com.example.gestion_piece_back.model.Inventaire;
import com.example.gestion_piece_back.service.InventaireService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventaires")
public class InventaireController {

    @Autowired
    private InventaireService inventaireService;

    @GetMapping
    public List<Inventaire> getAllInventaires() {
        System.out.println("GET /api/inventaires - Request received");
        return inventaireService.getAllInventaires();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Inventaire> getInventaireById(@PathVariable Long id) {
        return ResponseEntity.ok(inventaireService.getInventaireById(id));
    }

    @PostMapping
    public ResponseEntity<Inventaire> createInventaire(@RequestBody Inventaire inventaire) {
        return ResponseEntity.ok(inventaireService.createInventaire(inventaire));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Inventaire> updateInventaire(@PathVariable Long id, @RequestBody Inventaire details) {
        return ResponseEntity.ok(inventaireService.updateInventaire(id, details));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInventaire(@PathVariable Long id) {
        inventaireService.deleteInventaire(id);
        return ResponseEntity.noContent().build();
    }
}
