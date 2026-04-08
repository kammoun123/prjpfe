package com.example.gestion_piece_back.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

import com.example.gestion_piece_back.repository.ProduitRepository;
import com.example.gestion_piece_back.model.Produit;

@Service
public class ProduitService {

    @Autowired
    private ProduitRepository produitRepository;

    private final String uploadDir = "uploads/produits/";

    public List<Produit> getAllProduits() {
        produitRepository.resetNegativeStocks();
        return produitRepository.findAll();
    }

    public Produit getProduitById(Long id) {
        return produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));
    }

    public Produit createProduit(Produit produit) {
        return produitRepository.save(produit);
    }

    public Produit updateProduit(Long id, Produit details) {
        Produit produit = getProduitById(id);
        produit.setReference(details.getReference());
        produit.setDesignation(details.getDesignation());
        if (details.getFicheTechniqueUrl() != null) {
            produit.setFicheTechniqueUrl(details.getFicheTechniqueUrl());
        }
        if (details.getQuantiteStock() != null && details.getQuantiteStock() < 0) {
            throw new RuntimeException("La quantité en stock ne peut pas être négative");
        }
        produit.setQuantiteStock(details.getQuantiteStock());
        produit.setSeuilAlerte(details.getSeuilAlerte());
        produit.setIdCategorie(details.getIdCategorie());
        if (details.getPhotoUrl() != null) {
            produit.setPhotoUrl(details.getPhotoUrl());
        }
        return produitRepository.save(produit);
    }

    public void deleteProduit(Long id) {
        produitRepository.deleteById(id);
    }

    public String savePhoto(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename().replace(" ", "_") : "photo";
        String filename = UUID.randomUUID() + "_" + originalFilename;
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return "/uploads/produits/" + filename;
    }

    public String saveFicheTechnique(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get("uploads/fiches/");
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename().replace(" ", "_") : "document.pdf";
        String filename = UUID.randomUUID() + "_" + originalFilename;
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return "/uploads/fiches/" + filename;
    }
}
