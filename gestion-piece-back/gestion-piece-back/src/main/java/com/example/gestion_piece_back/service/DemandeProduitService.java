package com.example.gestion_piece_back.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.time.LocalDateTime;
import com.example.gestion_piece_back.repository.DemandeProduitRepository;
import com.example.gestion_piece_back.repository.NotificationRepository;
import com.example.gestion_piece_back.repository.UtilisateurRepository;
import com.example.gestion_piece_back.repository.ProduitRepository;
import com.example.gestion_piece_back.model.DemandeProduit;
import com.example.gestion_piece_back.model.Notification;
import com.example.gestion_piece_back.model.Utilisateur;
import com.example.gestion_piece_back.model.Produit;
import com.example.gestion_piece_back.model.MouvementStock;
import com.example.gestion_piece_back.service.MouvementStockService;
import com.example.gestion_piece_back.repository.FournisseurRepository;
import com.example.gestion_piece_back.model.Fournisseur;

@Service
public class DemandeProduitService {

    @Autowired
    private DemandeProduitRepository demandeProduitRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private ProduitRepository produitRepository;

    @Autowired
    private MouvementStockService mouvementStockService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private FournisseurRepository fournisseurRepository;
    
    public List<DemandeProduit> getAllDemandes() {
        return demandeProduitRepository.findAll();
    }

    public DemandeProduit createDemande(DemandeProduit demande) {
        if (demande.getDateDemande() == null) {
            demande.setDateDemande(LocalDateTime.now());
        }
        if (demande.getStatut() == null) {
            demande.setStatut("EN_ATTENTE");
        }

        DemandeProduit saved = demandeProduitRepository.save(demande);

        // Créer une notification pour l'admin
        try {
            createAdminNotification(saved);
        } catch (Exception e) {
            System.err.println("Erreur creation notification demande: " + e.getMessage());
        }

        return saved;
    }

    private void createAdminNotification(DemandeProduit demande) {
        String produitDesignation = "Inconnu";
        if (demande.getProduitId() != null) {
            Produit produit = produitRepository.findById(demande.getProduitId()).orElse(null);
            if (produit != null) {
                produitDesignation = produit.getDesignation();
            }
        }

        String demandeurNom = "Inconnu";
        String demandeurRole = "";
        if (demande.getTechnicienId() != null) {
            Utilisateur user = utilisateurRepository.findById(demande.getTechnicienId()).orElse(null);
            if (user != null) {
                demandeurNom = user.getNom() + " " + user.getPrenom();
                demandeurRole = " (" + user.getRole() + ")";
            }
        }

        Notification notificationAdmin = new Notification();
        notificationAdmin.setTitre("Nouvelle demande");
        notificationAdmin.setProduitId(demande.getProduitId());
        notificationAdmin.setMessage("Nouvelle demande pour " + produitDesignation +
                " (Qté: " + demande.getQuantite() + ") par " + demandeurNom + demandeurRole);
        notificationAdmin.setTypeNotification("DEMANDE_PRODUIT");
        notificationAdmin.setRoleCible("ADMIN");
        notificationAdmin.setStatut("NON_LUE");
        notificationRepository.save(notificationAdmin);
    }

    public void deleteDemande(Long id) {
        demandeProduitRepository.deleteById(id);
    }

    public DemandeProduit updateStatus(Long id, String statut) {
        DemandeProduit demande = demandeProduitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        String oldStatus = demande.getStatut();
        demande.setStatut(statut);
        DemandeProduit saved = demandeProduitRepository.save(demande);

        // Si la demande est validée, on enregistre automatiquement un mouvement de sortie
        if ("VALIDATED".equals(statut) && !statut.equalsIgnoreCase(oldStatus)) {
            MouvementStock mouvement = new MouvementStock();
            mouvement.setProduitId(demande.getProduitId());
            mouvement.setQuantite(demande.getQuantite());
            mouvement.setTypeMouvement("SORTIE");
            mouvement.setMotif("Validation Demande Technicien #" + id);
            
            mouvementStockService.createMouvement(mouvement);
        }
        return saved;
    }

    public DemandeProduit commanderChezFournisseur(Long idDemande, Long idFournisseur, java.time.LocalDate dateLivraison) {
        DemandeProduit demande = demandeProduitRepository.findById(idDemande)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        Fournisseur fournisseur = fournisseurRepository.findById(idFournisseur)
                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé"));

        String produitDesignation = "Inconnu";
        if (demande.getProduitId() != null) {
            Produit produit = produitRepository.findById(demande.getProduitId()).orElse(null);
            if (produit != null) {
                produitDesignation = produit.getDesignation() + " (Réf: " + produit.getReference() + ")";
            }
        }

        // Save delivery date
        if(dateLivraison != null) {
            demande.setDateLivraisonPrevue(dateLivraison);
        }

        emailService.sendOrderEmail(
            fournisseur.getEmail(), 
            fournisseur.getNom(), 
            produitDesignation, 
            demande.getQuantite(), 
            demande.getMotif(),
            dateLivraison
        );

        demande.setStatut("COMMANDE");
        return demandeProduitRepository.save(demande);
    }
}