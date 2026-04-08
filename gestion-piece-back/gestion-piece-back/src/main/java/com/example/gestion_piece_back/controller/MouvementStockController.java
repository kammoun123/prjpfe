package com.example.gestion_piece_back.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.example.gestion_piece_back.model.MouvementStock;
import com.example.gestion_piece_back.service.MouvementStockService;

@RestController
@RequestMapping("/api/mouvements")
@CrossOrigin("*")
public class MouvementStockController {

    @Autowired
    private MouvementStockService mouvementStockService;

    @GetMapping
    public List<MouvementStock> getAllMouvements() {
        return mouvementStockService.getAllMouvements();
    }

    @GetMapping("/produit/{produitId}")
    public List<MouvementStock> getMouvementsByProduit(@PathVariable Long produitId) {
        return mouvementStockService.getMouvementsByProduit(produitId);
    }

    @PostMapping
    public MouvementStock createMouvement(@RequestBody MouvementStock mouvement) {
        return mouvementStockService.createMouvement(mouvement);
    }

    @DeleteMapping("/{id}")
    public void deleteMouvement(@PathVariable Long id) {
        mouvementStockService.deleteMouvement(id);
    }
}
