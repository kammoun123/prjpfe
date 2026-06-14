package com.example.gestion_piece_back.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import com.example.gestion_piece_back.repository.FournisseurRepository;
import com.example.gestion_piece_back.model.Fournisseur;

@Service
public class FournisseurService {

    @Autowired
    private FournisseurRepository fournisseurRepository;

    public List<Fournisseur> getAllFournisseurs() {
        return fournisseurRepository.findAll();
    }

    public Fournisseur getFournisseurById(Long id) {
        return fournisseurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fournisseur non trouvé"));
    }

    public Fournisseur createFournisseur(Fournisseur fournisseur) {
        if (fournisseur.getStatut() == null) {
            fournisseur.setStatut("ACTIF");
        }
        return fournisseurRepository.save(fournisseur);
    }

    public Fournisseur updateFournisseur(Long id, Fournisseur details) {
        Fournisseur fournisseur = getFournisseurById(id);
        fournisseur.setNom(details.getNom());
        fournisseur.setEmail(details.getEmail());
        fournisseur.setTelephone(details.getTelephone());
        fournisseur.setAdresse(details.getAdresse());
        fournisseur.setStatut(details.getStatut());
        return fournisseurRepository.save(fournisseur);
    }

    public void deleteFournisseur(Long id) {
        fournisseurRepository.deleteById(id);
    }
}
