package com.example.gestion_piece_back.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender javaMailSender;

    public void sendOrderEmail(String destinataire, String fournisseurNom, String produitRequis, Integer quantite, String motif, java.time.LocalDate dateLivraison) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(destinataire);
            helper.setSubject("NOUVELLE COMMANDE - G-PIÈCES");

            String dateLivraisonStr = (dateLivraison != null) ? dateLivraison.toString() : "Dès que possible";

            String htmlContent = "<html>"
                    + "<body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>"
                    + "<div style='max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0px 4px 10px rgba(0,0,0,0.1);'>"
                    + "<h2 style='color: #4f46e5; text-align: center;'>Bon de Commande G-PIÈCES</h2>"
                    + "<p>Bonjour <strong>" + fournisseurNom + "</strong>,</p>"
                    + "<p>Nous souhaitons passer une commande pour le produit suivant :</p>"
                    + "<table style='width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;'>"
                    + "<tr><th style='border: 1px solid #ddd; padding: 10px; background-color: #f8fafc; text-align: left;'>Produit</th>"
                    + "<td style='border: 1px solid #ddd; padding: 10px;'>" + produitRequis + "</td></tr>"
                    + "<tr><th style='border: 1px solid #ddd; padding: 10px; background-color: #f8fafc; text-align: left;'>Quantité</th>"
                    + "<td style='border: 1px solid #ddd; padding: 10px; font-weight: bold;'>" + quantite + "</td></tr>"
                    + "<tr><th style='border: 1px solid #ddd; padding: 10px; background-color: #f8fafc; text-align: left;'>Date de Livraison Prévue</th>"
                    + "<td style='border: 1px solid #ddd; padding: 10px; color: #d97706; font-weight: bold;'>" + dateLivraisonStr + "</td></tr>"
                    + "<tr><th style='border: 1px solid #ddd; padding: 10px; background-color: #f8fafc; text-align: left;'>Motif / Infos</th>"
                    + "<td style='border: 1px solid #ddd; padding: 10px;'>" + ((motif != null && !motif.isEmpty()) ? motif : "N/A") + "</td></tr>"
                    + "</table>"
                    + "<p>Merci de traiter cette commande dans les meilleurs délais.</p>"
                    + "<p style='margin-top: 30px; font-size: 12px; color: #888; text-align: center;'>Cet email est généré automatiquement par le système G-PIÈCES.</p>"
                    + "</div>"
                    + "</body>"
                    + "</html>";

            helper.setText(htmlContent, true);

            javaMailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Erreur lors de l'envoi de l'email à : " + destinataire);
            e.printStackTrace();
            throw new RuntimeException("Erreur serveur lors de l'envoi de l'email de commande.");
        }
    }

    public void sendLowStockAlertEmail(String toEmail, String produitDesignation, Integer quantiteActuelle, Integer seuilAlerte) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("ALERTE STOCK FAIBLE - G-PIÈCES");

            String htmlContent = "<html><body><h2 style='color: red;'>Alerte Stock Faible</h2>"
                    + "<p>Le produit <strong>" + produitDesignation + "</strong> a atteint un niveau critique.</p>"
                    + "<ul><li>Quantité Actuelle: " + quantiteActuelle + "</li>"
                    + "<li>Seuil d'alerte: " + seuilAlerte + "</li></ul>"
                    + "<p>Veuillez réapprovisionner l'inventaire.</p></body></html>";

            helper.setText(htmlContent, true);
            javaMailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Erreur lors de l'envoi de l'alerte stock: " + e.getMessage());
        }
    }

    public void sendUserAcceptedEmail(String toEmail, String prenom) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Compte Approuvé - G-PIÈCES");

            String htmlContent = "<html><body><h2 style='color: green;'>Félicitations " + prenom + " !</h2>"
                    + "<p>Votre compte sur l'application G-PIÈCES a été approuvé par un administrateur.</p>"
                    + "<p>Vous pouvez maintenant vous connecter et utiliser l'application.</p></body></html>";

            helper.setText(htmlContent, true);
            javaMailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Erreur email: " + e.getMessage());
        }
    }

    public void sendUserRefusedEmail(String toEmail, String prenom) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Statut du compte - G-PIÈCES");

            String htmlContent = "<html><body><h2 style='color: red;'>Bonjour " + prenom + ",</h2>"
                    + "<p>Nous sommes au regret de vous informer que votre compte G-PIÈCES a été désactivé ou refusé.</p>"
                    + "<p>Veuillez contacter un administrateur pour plus d'informations.</p></body></html>";

            helper.setText(htmlContent, true);
            javaMailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Erreur email: " + e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("RÉINITIALISATION DE MOT DE PASSE - G-PIÈCES");

            // Base URL should ideally be from a config file
            String resetUrl = "http://localhost:4200/reset-password?token=" + token;

            String htmlContent = "<html>"
                    + "<body style='font-family: \"Segoe UI\", Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; padding: 40px;'>"
                    + "<div style='max-width: 550px; margin: auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e1e4e8;'>"
                    + "<div style='text-align: center; margin-bottom: 30px;'>"
                    + "<div style='display: inline-block; background: #6366f1; color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 24px;'>G-P</div>"
                    + "</div>"
                    + "<h2 style='color: #1f2937; text-align: center; font-size: 24px; margin-bottom: 20px;'>Réinitialisation de mot de passe</h2>"
                    + "<p style='color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;'>"
                    + "Vous avez demandé la réinitialisation de votre mot de passe pour votre compte <strong>G-PIÈCES</strong>."
                    + "</p>"
                    + "<div style='text-align: center; margin: 35px 0;'>"
                    + "<a href='" + resetUrl + "' style='background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); transition: all 0.3s ease; display: inline-block;'>Réinitialiser mon mot de passe</a>"
                    + "</div>"
                    + "<p style='color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;'>"
                    + "Si vous n'avez pas effectué cette demande, vous pouvez ignorer cet email en toute sécurité. Ce lien expirera dans 1 heure."
                    + "</p>"
                    + "<hr style='border: 0; border-top: 1px solid #f3f4f6; margin: 30px 0;'>"
                    + "<p style='margin-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;'>"
                    + "Ceci est un message automatique, merci de ne pas y répondre.<br>&copy; 2026 G-PIÈCES Ecosystem"
                    + "</p>"
                    + "</div>"
                    + "</body>"
                    + "</html>";

            helper.setText(htmlContent, true);
            javaMailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Erreur lors de l'envoi de l'email de réinitialisation: " + e.getMessage());
            throw new RuntimeException("Échec de l'envoi de l'email de récupération.");
        }
    }

    public void sendNewUserRegistrationEmailToAdmin(String adminEmail, com.example.gestion_piece_back.model.Utilisateur newUser) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(adminEmail);
            helper.setSubject("NOUVELLE INSCRIPTION - ACTION REQUISE");

            String htmlContent = "<html>"
                    + "<body style='font-family: \"Segoe UI\", Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px;'>"
                    + "<div style='max-width: 600px; margin: auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;'>"
                    + "<div style='text-align: center; margin-bottom: 30px;'>"
                    + "<div style='display: inline-block; background: #4f46e5; color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 24px;'>G-P</div>"
                    + "</div>"
                    + "<h2 style='color: #1e293b; text-align: center; font-size: 22px; margin-bottom: 20px;'>Nouvelle Inscription Utilisateur</h2>"
                    + "<p style='color: #64748b; font-size: 16px; line-height: 1.6; text-align: center;'>"
                    + "Un nouvel utilisateur vient de s'inscrire sur la plateforme <strong>G-PIÈCES</strong> et attend votre validation."
                    + "</p>"
                    + "<div style='background-color: #f1f5f9; padding: 25px; border-radius: 12px; margin: 30px 0;'>"
                    + "<h3 style='margin-top: 0; color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;'>Détails de l'utilisateur</h3>"
                    + "<table style='width: 100%; border-collapse: collapse;'>"
                    + "<tr><td style='padding: 8px 0; color: #64748b; width: 40%;'>Nom complet :</td><td style='padding: 8px 0; color: #1e293b; font-weight: 600;'>" + newUser.getPrenom() + " " + newUser.getNom() + "</td></tr>"
                    + "<tr><td style='padding: 8px 0; color: #64748b;'>Email :</td><td style='padding: 8px 0; color: #1e293b; font-weight: 600;'>" + newUser.getEmail() + "</td></tr>"
                    + "<tr><td style='padding: 8px 0; color: #64748b;'>Rôle demandé :</td><td style='padding: 8px 0; color: #1e293b;'><span style='background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;'>" + newUser.getRole() + "</span></td></tr>"
                    + "<tr><td style='padding: 8px 0; color: #64748b;'>Téléphone :</td><td style='padding: 8px 0; color: #1e293b;'>" + (newUser.getTelephone() != null ? newUser.getTelephone() : "Non renseigné") + "</td></tr>"
                    + "<tr><td style='padding: 8px 0; color: #64748b;'>Localisation :</td><td style='padding: 8px 0; color: #1e293b;'>" + (newUser.getVille() != null ? newUser.getVille() : "-") + ", " + (newUser.getGouvernorat() != null ? newUser.getGouvernorat() : "-") + "</td></tr>"
                    + "</table>"
                    + "</div>"
                    + "<div style='text-align: center; margin-top: 30px;'>"
                    + "<a href='http://localhost:4200/admin/users' style='background: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;'>Accéder à la gestion des utilisateurs</a>"
                    + "</div>"
                    + "<p style='margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center;'>"
                    + "Ce message vous est envoyé car vous êtes administrateur du système G-PIÈCES.<br>&copy; 2026 G-PIÈCES"
                    + "</p>"
                    + "</div>"
                    + "</body>"
                    + "</html>";

            helper.setText(htmlContent, true);
            javaMailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Erreur lors de l'envoi de l'email de notification d'inscription à l'admin: " + e.getMessage());
        }
    }
}
