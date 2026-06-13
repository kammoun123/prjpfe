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
import com.example.gestion_piece_back.model.DemandePieceLigne;
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

        if (demande.getLignes() != null) {
            for (DemandePieceLigne ligne : demande.getLignes()) {
                ligne.setDemande(demande);
                if (ligne.getProduitId() != null) {
                    Produit p = produitRepository.findById(ligne.getProduitId()).orElse(null);
                    ligne.setProduit(p);
                }
            }
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
        // Get technician info
        String demandeurNom = "Inconnu";
        String demandeurRole = "";
        if (demande.getTechnicienId() != null) {
            Utilisateur user = utilisateurRepository.findById(demande.getTechnicienId()).orElse(null);
            if (user != null) {
                demandeurNom = user.getNom() + " " + user.getPrenom();
                demandeurRole = " (" + user.getRole() + ")";
            }
        }

        // Get first produit from lignes for notification
        Long produitId = null;
        int totalQte = 0;
        StringBuilder produitList = new StringBuilder();

        if (demande.getLignes() != null && !demande.getLignes().isEmpty()) {
            for (DemandePieceLigne ligne : demande.getLignes()) {
                totalQte += ligne.getQuantite() != null ? ligne.getQuantite() : 0;
                if (produitId == null && ligne.getProduitId() != null) {
                    produitId = ligne.getProduitId();
                }
                if (ligne.getProduitId() != null) {
                    Produit produit = produitRepository.findById(ligne.getProduitId()).orElse(null);
                    if (produit != null) {
                        if (produitList.length() > 0)
                            produitList.append(", ");
                        produitList.append(produit.getDesignation());
                    }
                }
            }
        }

        Notification notificationAdmin = new Notification();
        notificationAdmin.setTitre("Nouvelle demande");
        notificationAdmin.setProduitId(produitId);
        notificationAdmin.setMessage("Nouvelle demande pour " + produitList.toString() +
                " (Qté totale: " + totalQte + ") par " + demandeurNom + demandeurRole);
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

        // Si la demande est validée, on donne ce qui est en stock et transfère le reste
        // à l'admin
        if ("VALIDATED".equals(statut) && !statut.equalsIgnoreCase(oldStatus)) {
            // Resolve technician name
            String technicienNom = "Technicien #" + id;
            if (demande.getTechnicienId() != null) {
                Utilisateur tech = utilisateurRepository.findById(demande.getTechnicienId()).orElse(null);
                if (tech != null) {
                    technicienNom = tech.getPrenom() + " " + tech.getNom();
                }
            }

            DemandeProduit demandeReste = null;

            if (demande.getLignes() != null) {
                for (DemandePieceLigne ligne : demande.getLignes()) {
                    int requestedQty = ligne.getQuantite() != null ? ligne.getQuantite() : 0;
                    if (requestedQty <= 0)
                        continue;

                    int currentStock = 0;
                    Produit produit = null;
                    if (ligne.getProduitId() != null) {
                        produit = produitRepository.findById(ligne.getProduitId()).orElse(null);
                        if (produit != null && produit.getQuantiteStock() != null) {
                            currentStock = produit.getQuantiteStock();
                        }
                    }

                    int qtyToValidate = Math.min(requestedQty, currentStock);
                    int qtyMissing = requestedQty - qtyToValidate;

                    // 1. Give whatever is in stock (even if 0, it means we don't dispatch anything
                    // physically)
                    if (qtyToValidate > 0) {
                        MouvementStock mouvement = new MouvementStock();
                        mouvement.setProduit(produit);
                        mouvement.setQuantite(qtyToValidate);
                        mouvement.setTypeMouvement("SORTIE");
                        mouvement.setMotif("Validation Demande - " + technicienNom + " (#" + id + ")");
                        mouvementStockService.createMouvement(mouvement);
                    }

                    // 2. The rest automatically transferred to Admin
                    if (qtyMissing > 0) {
                        if (demandeReste == null) {
                            demandeReste = new DemandeProduit();
                            demandeReste.setTechnicienId(demande.getTechnicienId());
                            demandeReste.setDateDemande(LocalDateTime.now());
                            demandeReste.setStatut("TRANSFÉRÉ_ADMIN");
                            demandeReste.setObservation("Reliquat auto-transféré de la demande #" + id
                                    + (demande.getObservation() != null ? " - " + demande.getObservation() : ""));
                            demandeReste.setLignes(new java.util.ArrayList<>());
                        }

                        DemandePieceLigne ligneReste = new DemandePieceLigne();
                        ligneReste.setProduitId(ligne.getProduitId());
                        ligneReste.setQuantite(qtyMissing);
                        ligneReste.setMotif(ligne.getMotif());
                        ligneReste.setStatut("TRANSFÉRÉ_ADMIN");
                        ligneReste.setDemande(demandeReste);
                        ligneReste.setProduit(produit);
                        demandeReste.getLignes().add(ligneReste);
                    }

                    // Update the original request to reflect the effectively given quantity
                    ligne.setQuantite(qtyToValidate);
                }
            }

            // Save remainder request and trigger alert for admin + magasinier
            if (demandeReste != null && !demandeReste.getLignes().isEmpty()) {
                DemandeProduit savedReste = demandeProduitRepository.save(demandeReste);

                // Build message about the transferred pieces
                StringBuilder transferMsg = new StringBuilder();
                for (DemandePieceLigne lr : savedReste.getLignes()) {
                    String pName = lr.getProduit() != null ? lr.getProduit().getDesignation()
                            : "Pièce #" + lr.getProduitId();
                    if (transferMsg.length() > 0)
                        transferMsg.append(", ");
                    transferMsg.append(pName).append(" (").append(lr.getQuantite()).append(" manquant)");
                }

                // Notify Admin
                try {
                    createAdminNotification(savedReste);
                } catch (Exception e) {
                    System.err.println("Erreur notification admin pour reliquat: " + e.getMessage());
                }

                // Notify MAGASINIER: stock alert
                Notification notifMagasinier = new Notification();
                notifMagasinier.setProduitId(savedReste.getLignes().get(0).getProduitId());
                notifMagasinier.setTitre("Alerte stock insuffisant");
                notifMagasinier.setMessage(
                        "⚠️ Stock insuffisant pour honorer la demande. Pièces transférées à l'Admin pour commande : "
                                + transferMsg.toString());
                notifMagasinier.setTypeNotification("ALERTE_STOCK");
                notifMagasinier.setRoleCible("MAGASINIER");
                notifMagasinier.setStatut("NON_LUE");
                notifMagasinier.setDateCreation(LocalDateTime.now());
                notificationRepository.save(notifMagasinier);

                // Notify TECHNICIEN: partial fulfillment
                Notification notifTechnicien = new Notification();
                notifTechnicien.setProduitId(savedReste.getLignes().get(0).getProduitId());
                notifTechnicien.setTitre("Demande partiellement validée");
                notifTechnicien.setMessage(
                        "📦 Votr demande a été partiellement validée. Les pièces disponibles ont été délivrées. Le reste est en cours de commande : "
                                + transferMsg.toString());
                notifTechnicien.setTypeNotification("warning");
                notifTechnicien.setRoleCible("TECHNICIEN");
                notifTechnicien.setStatut("NON_LUE");
                notifTechnicien.setDateCreation(LocalDateTime.now());
                notificationRepository.save(notifTechnicien);
            }
        } else if ("REFUSED".equals(statut) && !statut.equalsIgnoreCase(oldStatus)) {
            // Notify MAGASINIER that Admin refused the order
            Notification notifRefus = new Notification();
            if (demande.getLignes() != null && !demande.getLignes().isEmpty()) {
                notifRefus.setProduitId(demande.getLignes().get(0).getProduitId());
            }
            notifRefus.setTitre("Demande refusée par l'Admin");
            notifRefus.setMessage("L'Admin a refusé la commande pour la demande #" + id + ".");
            notifRefus.setTypeNotification("error");
            notifRefus.setRoleCible("MAGASINIER");
            notifRefus.setStatut("NON_LUE");
            notifRefus.setDateCreation(LocalDateTime.now());
            notificationRepository.save(notifRefus);

            // Optionally notify Technicien
            if (demande.getTechnicienId() != null) {
                Notification notifTechRefus = new Notification();
                if (demande.getLignes() != null && !demande.getLignes().isEmpty()) {
                    notifTechRefus.setProduitId(demande.getLignes().get(0).getProduitId());
                }
                notifTechRefus.setTitre("Demande refusée");
                notifTechRefus.setMessage("⚠️ Votre demande #" + id + " a été refusée et annulée.");
                notifTechRefus.setTypeNotification("error");
                notifTechRefus.setRoleCible("TECHNICIEN");
                notifTechRefus.setStatut("NON_LUE");
                notifTechRefus.setDateCreation(LocalDateTime.now());
                notificationRepository.save(notifTechRefus);
            }
        }
        return saved;
    }

    public DemandeProduit transferToAdmin(Long id) {
        DemandeProduit demande = demandeProduitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        demande.setStatut("EN_ATTENTE_COMMANDE");
        return demandeProduitRepository.save(demande);
    }

    public DemandeProduit commanderChezFournisseur(Long idDemande, Long idFournisseur,
            java.time.LocalDate dateLivraison) {
        DemandeProduit demande = demandeProduitRepository.findById(idDemande)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        Fournisseur fournisseur = fournisseurRepository.findById(idFournisseur)
                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé"));

        // Build list of products for email
        StringBuilder produitList = new StringBuilder();
        int totalQte = 0;
        if (demande.getLignes() != null) {
            for (DemandePieceLigne ligne : demande.getLignes()) {
                totalQte += ligne.getQuantite() != null ? ligne.getQuantite() : 0;
                if (ligne.getProduitId() != null) {
                    Produit produit = produitRepository.findById(ligne.getProduitId()).orElse(null);
                    if (produit != null) {
                        if (produitList.length() > 0)
                            produitList.append(", ");
                        produitList.append(produit.getDesignation()).append(" (Réf: ").append(produit.getReference())
                                .append(")");
                    }
                }
            }
        }

        // Save delivery date
        if (dateLivraison != null) {
            demande.setDateLivraisonPrevue(dateLivraison);
        }

        // Send email with all products
        String motifStr = demande.getLignes() != null && !demande.getLignes().isEmpty()
                ? (demande.getLignes().get(0).getMotif() != null ? demande.getLignes().get(0).getMotif() : "")
                : "";

        emailService.sendOrderEmail(
                fournisseur.getEmail(),
                fournisseur.getNom(),
                produitList.toString(),
                totalQte,
                motifStr,
                dateLivraison);

        demande.setStatut("COMMANDE");
        return demandeProduitRepository.save(demande);
    }
}