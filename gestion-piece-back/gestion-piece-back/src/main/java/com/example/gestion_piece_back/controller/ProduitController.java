package com.example.gestion_piece_back.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import com.example.gestion_piece_back.service.ProduitService;
import com.example.gestion_piece_back.model.Produit;

@RestController
@RequestMapping("/api/produits")
public class ProduitController {

    @Autowired
    private ProduitService produitService;

    @GetMapping
    public List<Produit> getProduits() {
        return produitService.getAllProduits();
    }

    @GetMapping("/{id}")
    public Produit getProduit(@PathVariable Long id) {
        return produitService.getProduitById(id);
    }

    @PostMapping
    public Produit createProduit(@RequestBody Produit produit) {
        return produitService.createProduit(produit);
    }

    @PutMapping("/{id}")
    public Produit updateProduit(@PathVariable Long id, @RequestBody Produit produit) {
        return produitService.updateProduit(id, produit);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduit(@PathVariable Long id) {
        produitService.deleteProduit(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/photo")
    public ResponseEntity<?> uploadPhoto(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            String photoUrl = produitService.savePhoto(file);
            Produit produit = produitService.getProduitById(id);
            produit.setPhotoUrl(photoUrl);
            produitService.createProduit(produit); // save updated photo
            return ResponseEntity.ok(Map.of("photoUrl", photoUrl));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Erreur upload: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/fiche")
    public ResponseEntity<?> uploadFicheTechnique(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            String ficheUrl = produitService.saveFicheTechnique(file);
            Produit produit = produitService.getProduitById(id);
            produit.setFicheTechniqueUrl(ficheUrl);
            produitService.createProduit(produit); // save updated fiche
            return ResponseEntity.ok(Map.of("ficheTechniqueUrl", ficheUrl));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Erreur upload fiche: " + e.getMessage());
        }
    }
}
