package com.example.gestion_piece_back;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import com.example.gestion_piece_back.model.*;
import com.example.gestion_piece_back.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.LocalDateTime;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class GestionProduitBackApplication {

	public static void main(String[] args) {
		SpringApplication.run(GestionProduitBackApplication.class, args);
	}

	@Bean
	CommandLineRunner initDatabase(CategorieRepository categorieRepository, ProduitRepository produitRepository,
			DemandeProduitRepository demandeProduitRepository, UtilisateurRepository utilisateurRepository,
			PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
		return args -> {
			// Manually drop the column if it still exists (Hibernate update doesn't delete
			// it)
			try {
				jdbcTemplate.execute("ALTER TABLE produits DROP COLUMN prix_unitaire");
				System.out.println("Column prix_unitaire dropped successfully!");
			} catch (Exception e) {
				System.out.println("Column prix_unitaire already dropped or error: " + e.getMessage());
			}

			// (Code de nettoyage supprimé car il effaçait les produits à chaque redémarrage !)

			// Only insert sample data if the database is empty
			if (categorieRepository.count() == 0) {
				// Sample categories
				Categorie cat1 = new Categorie();
				cat1.setNomCategorie("Mécanique");
				cat1.setDescription("Pièces mécaniques");
				categorieRepository.save(cat1);

				Categorie cat2 = new Categorie();
				cat2.setNomCategorie("Électronique");
				cat2.setDescription("Pièces électroniques");
				categorieRepository.save(cat2);

				// Sample produits
				Produit p1 = new Produit();
				p1.setReference("REF001");
				p1.setDesignation("Roue dentée");
				p1.setQuantiteStock(100);
				p1.setSeuilAlerte(10);
				p1.setIdCategorie(cat1.getIdCategorie());
				produitRepository.save(p1);

				Produit p2 = new Produit();
				p2.setReference("REF002");
				p2.setDesignation("Capteur de température");
				p2.setQuantiteStock(50);
				p2.setSeuilAlerte(5);
				p2.setIdCategorie(cat2.getIdCategorie());
				produitRepository.save(p2);

				// Sample demandes
				DemandeProduit demande1 = new DemandeProduit();
				demande1.setDateDemande(LocalDateTime.now());
				demande1.setStatut("En attente");
				demande1.setProduitId(p1.getIdProduit());
				demande1.setQuantite(5);
				demande1.setMotif("Réparation urgente");
				demande1.setTechnicienId(1L);
				demandeProduitRepository.save(demande1);

				System.out.println("Sample data inserted!");
			} else {
				System.out.println("Database already has data, skipping sample insert.");
			}

			// Activation de l'admin par défaut (toujours exécuté)
			utilisateurRepository.findByEmail("khalilkammoun10@gmail.com").ifPresentOrElse(user -> {
				user.setRole("ADMIN");
				user.setStatut("ACTIVE");
				user.setMotDePasse(passwordEncoder.encode("123456"));
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
			});

			// Ajout d'un compte Technicien de test (aa@gmail.com)
			if (utilisateurRepository.findByEmail("aa@gmail.com").isEmpty()) {
				Utilisateur tech = new Utilisateur();
				tech.setEmail("aa@gmail.com");
				tech.setNom("Test");
				tech.setPrenom("Technicien");
				tech.setRole("TECHNICIEN");
				tech.setStatut("ACTIVE");
				tech.setMotDePasse(passwordEncoder.encode("123456"));
				utilisateurRepository.save(tech);
				System.out.println("Test user aa@gmail.com created!");
			}

			// Ajout d'un compte Magasinier de test (magasinier@gmail.com)
			if (utilisateurRepository.findByEmail("magasinier@gmail.com").isEmpty()) {
				Utilisateur mag = new Utilisateur();
				mag.setEmail("magasinier@gmail.com");
				mag.setNom("Test");
				mag.setPrenom("Magasinier");
				mag.setRole("MAGASINIER");
				mag.setStatut("ACTIVE");
				mag.setMotDePasse(passwordEncoder.encode("123456"));
				utilisateurRepository.save(mag);
				System.out.println("Test user magasinier@gmail.com created!");
			}

			System.out.println("Users seeding complete!");
		};
	}
}
