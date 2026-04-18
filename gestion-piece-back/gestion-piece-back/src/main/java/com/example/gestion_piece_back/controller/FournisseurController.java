package com.example.gestion_piece_back.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.example.gestion_piece_back.service.FournisseurService;
import com.example.gestion_piece_back.model.Fournisseur;

@RestController
@RequestMapping("/api/fournisseurs")
@CrossOrigin(origins = "*")
public class FournisseurController {

    @Autowired
    private FournisseurService fournisseurService;

    @GetMapping
    public List<Fournisseur> getAll() {
        return fournisseurService.getAllFournisseurs();
    }

    @GetMapping("/{id}")
    public Fournisseur getById(@PathVariable Long id) {
        return fournisseurService.getFournisseurById(id);
    }

    @PostMapping
    public Fournisseur create(@RequestBody Fournisseur fournisseur) {
        return fournisseurService.createFournisseur(fournisseur);
    }

    @PutMapping("/{id}")
    public Fournisseur update(@PathVariable Long id, @RequestBody Fournisseur details) {
        return fournisseurService.updateFournisseur(id, details);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        fournisseurService.deleteFournisseur(id);
    }
}
