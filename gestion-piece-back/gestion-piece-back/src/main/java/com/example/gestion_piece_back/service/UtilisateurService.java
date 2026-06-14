package com.example.gestion_piece_back.service;

import com.example.gestion_piece_back.model.Utilisateur;
import com.example.gestion_piece_back.model.Notification;
import com.example.gestion_piece_back.model.DemandeInscription;
import com.example.gestion_piece_back.repository.UtilisateurRepository;
import com.example.gestion_piece_back.repository.DemandeInscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UtilisateurService {
    private final UtilisateurRepository utilisateurRepository;
    private final DemandeInscriptionRepository demandeInscriptionRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public DemandeInscription register(Utilisateur utilisateur) {
        if (utilisateur.getMotDePasse() == null || utilisateur.getMotDePasse().isBlank()) {
            throw new RuntimeException("Le mot de passe est obligatoire pour l'inscription");
        }

        // Vérifier si une demande en attente existe déjà pour cet email
        if (demandeInscriptionRepository.findByEmail(utilisateur.getEmail()).isPresent()) {
            throw new RuntimeException("Une demande d'inscription est déjà en attente pour cet email. Veuillez patienter.");
        }

        // Vérifier si un compte actif existe déjà pour cet email
        if (utilisateurRepository.findByEmail(utilisateur.getEmail()).isPresent()) {
            throw new RuntimeException("Un compte existe déjà avec cet email.");
        }

        DemandeInscription demande = new DemandeInscription();
        demande.setNom(utilisateur.getNom());
        demande.setPrenom(utilisateur.getPrenom());
        demande.setEmail(utilisateur.getEmail());
        demande.setRole(utilisateur.getRole());
        demande.setMotDePasse(passwordEncoder.encode(utilisateur.getMotDePasse()));

        DemandeInscription savedDemande = demandeInscriptionRepository.save(demande);

        // Créer une notification pour l'administrateur et envoyer un email
        try {
            // Notification interne
            Notification notification = new Notification();
            notification.setTitre("Nouvelle Inscription");
            notification.setMessage("Un nouvel utilisateur [" + savedDemande.getPrenom() + " " + savedDemande.getNom()
                    + "] vient de s'inscrire et attend votre validation.");
            notification.setTypeNotification("USER_REGISTRATION");
            notification.setRoleCible("ADMIN");
            notification.setStatut("NON_LUE");
            notificationService.saveNotification(notification);

            // Notification par email à tous les admins
            List<Utilisateur> admins = utilisateurRepository.findByRole("ADMIN");
            for (Utilisateur admin : admins) {
                if (admin.getEmail() != null && !admin.getEmail().isBlank()) {
                    emailService.sendNewUserRegistrationEmailToAdmin(admin.getEmail(), utilisateur);
                }
            }
        } catch (Exception e) {
            System.err.println("Erreur lors de la notification d'inscription : " + e.getMessage());
        }

        return savedDemande;
    }

    public List<DemandeInscription> findAllDemandes() {
        return demandeInscriptionRepository.findAll();
    }

    @Transactional
    public Utilisateur accepterDemande(Long idDemande) {
        DemandeInscription demande = demandeInscriptionRepository.findById(idDemande)
                .orElseThrow(() -> new RuntimeException("Demande d'inscription non trouvée"));

        Utilisateur user = new Utilisateur();
        user.setNom(demande.getNom());
        user.setPrenom(demande.getPrenom());
        user.setEmail(demande.getEmail());
        user.setRole(demande.getRole());
        user.setMotDePasse(demande.getMotDePasse()); // Déjà encodé
        user.setStatut("ACTIVE");

        Utilisateur savedUser = utilisateurRepository.save(user);
        demandeInscriptionRepository.delete(demande);

        // Envoyer email d'acceptation
        try {
            emailService.sendUserAcceptedEmail(user.getEmail(), user.getPrenom());
        } catch (Exception e) {
            System.err.println("Erreur envoi email acceptation : " + e.getMessage());
        }

        return savedUser;
    }

    @Transactional
    public void refuserDemande(Long idDemande) {
        DemandeInscription demande = demandeInscriptionRepository.findById(idDemande)
                .orElseThrow(() -> new RuntimeException("Demande d'inscription non trouvée"));

        // Envoyer email de refus
        try {
            emailService.sendUserRefusedEmail(demande.getEmail(), demande.getPrenom());
        } catch (Exception e) {
            System.err.println("Erreur envoi email refus : " + e.getMessage());
        }

        demandeInscriptionRepository.delete(demande);
    }

    public List<Utilisateur> findAll() {
        return utilisateurRepository.findAll();
    }

    public Optional<Utilisateur> findById(Long id) {
        return utilisateurRepository.findById(id);
    }

    public Utilisateur updateStatus(Long id, String status) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        user.setStatut(status);
        Utilisateur updatedUser = utilisateurRepository.save(user);

        // Envoyer un email en fonction du nouveau statut
        try {
            if ("ACTIVE".equalsIgnoreCase(status)) {
                emailService.sendUserAcceptedEmail(user.getEmail(), user.getPrenom());
            } else if ("INACTIVE".equalsIgnoreCase(status) || "REFUSED".equalsIgnoreCase(status)) {
                emailService.sendUserRefusedEmail(user.getEmail(), user.getPrenom());
            }
        } catch (Exception e) {
            System.err.println("Erreur lors de l'envoi de l'email : " + e.getMessage());
            // On ne bloque pas la transaction si l'email échoue
        }

        return updatedUser;
    }

    public Utilisateur updateUtilisateur(Long id, Utilisateur userDetails) {
        System.out.println("Updating user ID: " + id);
        System.out.println("Payload: ville=" + userDetails.getVille() + ", gouvernorat=" + userDetails.getGouvernorat()
                + ", telephone=" + userDetails.getTelephone());

        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        user.setNom(userDetails.getNom());
        user.setPrenom(userDetails.getPrenom());
        user.setEmail(userDetails.getEmail());
        user.setRole(userDetails.getRole());
        user.setVille(userDetails.getVille());
        user.setGouvernorat(userDetails.getGouvernorat());
        user.setTelephone(userDetails.getTelephone());

        if (userDetails.getMotDePasse() != null && !userDetails.getMotDePasse().isBlank()) {
            user.setMotDePasse(passwordEncoder.encode(userDetails.getMotDePasse()));
        }
        return utilisateurRepository.save(user);
    }

    public void delete(Long id) {
        utilisateurRepository.deleteById(id);
    }

    public Optional<Utilisateur> findByEmail(String email) {
        return utilisateurRepository.findByEmail(email);
    }

    public void initiatePasswordReset(String email) {
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Aucun utilisateur trouvé avec cet email"));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatut())) {
            throw new RuntimeException("Votre compte n'est pas encore activé. Veuillez contacter l'administrateur.");
        }

        String token = java.util.UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiration(java.time.LocalDateTime.now().plusHours(1));
        utilisateurRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    public void completePasswordReset(String token, String newPassword) {
        Utilisateur user = utilisateurRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Jeton de réinitialisation invalide"));

        if (user.getResetTokenExpiration().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Le jeton de réinitialisation a expiré");
        }

        user.setMotDePasse(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiration(null);
        utilisateurRepository.save(user);
    }
}
