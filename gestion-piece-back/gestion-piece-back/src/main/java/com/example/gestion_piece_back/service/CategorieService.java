package com.example.gestion_piece_back.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import com.example.gestion_piece_back.repository.CategorieRepository;
import com.example.gestion_piece_back.repository.ProduitRepository;
import com.example.gestion_piece_back.model.Categorie;

@Service
public class CategorieService {

    @Autowired
    private CategorieRepository categorieRepository;

    @Autowired
    private ProduitRepository produitRepository;

    public List<Categorie> getAllCategories() {
        return categorieRepository.findAll();
    }

    public Categorie createCategorie(Categorie categorie) {
        if (categorieRepository.findByNomCategorie(categorie.getNomCategorie()).isPresent()) {
            throw new RuntimeException("Cette catégorie existe déjà");
        }
        return categorieRepository.save(categorie);
    }

    public void deleteCategorie(Long id) {
        if (produitRepository.existsByIdCategorie(id)) {
            throw new RuntimeException("Impossible de supprimer cette catégorie");
        }
        categorieRepository.deleteById(id);
    }
}