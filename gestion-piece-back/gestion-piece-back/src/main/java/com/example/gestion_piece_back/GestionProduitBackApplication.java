package com.example.gestion_piece_back;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import com.example.gestion_piece_back.model.Utilisateur;
import com.example.gestion_piece_back.repository.UtilisateurRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class GestionProduitBackApplication {

    public static void main(String[] args) {
        SpringApplication.run(GestionProduitBackApplication.class, args);
    }

    @Bean
    CommandLineRunner initDatabase(UtilisateurRepository utilisateurRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Activation de l'admin par défaut (toujours exécuté)
            utilisateurRepository.findByEmail("khalilkammoun10@gmail.com").ifPresentOrElse(user -> {
                user.setRole("ADMIN");
                user.setStatut("ACTIVE");
                // On met à jour le mot de passe seulement s'il faut (optionnel)
                // user.setMotDePasse(passwordEncoder.encode("123456"));
                utilisateurRepository.save(user);
            }, () -> {
                Utilisateur admin = new Utilisateur();
                admin.setEmail("khalilkammoun10@gmail.com");
                admin.setNom("KHALIL");
                admin.setPrenom("kammoun");
                admin.setRole("ADMIN");
                admin.setStatut("ACTIVE");
                admin.setMotDePasse(passwordEncoder.encode("123456"));
                utilisateurRepository.save(admin);
                System.out.println("Admin activated!");
            });
        };
    }
}
