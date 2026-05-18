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
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import java.io.ByteArrayOutputStream;
import java.util.Base64;

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
        String qrContent = "REF: " + produit.getReference() + " | NOM: " + produit.getDesignation() + " | STOCK: " + produit.getQuantiteStock();
        produit.setQrCode(generateQRCodeBase64(qrContent));
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

        // Régénérer le QR code si les infos changent
        String qrContent = "REF: " + produit.getReference() + " | NOM: " + produit.getDesignation() + " | STOCK: " + produit.getQuantiteStock();
        produit.setQrCode(generateQRCodeBase64(qrContent));

        return produitRepository.save(produit);
    }

    private String generateQRCodeBase64(String text) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, 250, 250);
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            byte[] pngData = pngOutputStream.toByteArray();
            return Base64.getEncoder().encodeToString(pngData);
        } catch (Exception e) {
            System.err.println("QR Code Generation Error: " + e.getMessage());
            return null;
        }
    }

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public void deleteProduit(Long id) {
        try {
            jdbcTemplate.update("DELETE FROM mouvements_stock WHERE produit_id = ?", id);
            jdbcTemplate.update("DELETE FROM notifications WHERE produit_id = ?", id);
            try {
                jdbcTemplate.update("DELETE FROM lignes_inventaire WHERE produit_id = ?", id);
            } catch (Exception e) {} // Ignorer si la table n'existe pas ou autre nom
            try {
                jdbcTemplate.update("DELETE FROM ligne_inventaire WHERE produit_id = ?", id);
            } catch (Exception e) {}

            jdbcTemplate.update("UPDATE demandes SET produit_id = NULL WHERE produit_id = ?", id);
        } catch (Exception e) {
            System.err.println("Database cleanup error before product deletion: " + e.getMessage());
        }
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
