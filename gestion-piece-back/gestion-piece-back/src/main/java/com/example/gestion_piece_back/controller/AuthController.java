package com.example.gestion_piece_back.controller;

import com.example.gestion_piece_back.model.Utilisateur;
import com.example.gestion_piece_back.service.UtilisateurService;
import com.example.gestion_piece_back.config.JwtUtils;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UtilisateurService utilisateurService;
    private final UserDetailsService userDetailsService;
    private final JwtUtils jwtUtils;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid Utilisateur utilisateur) {
        if (utilisateurService.findByEmail(utilisateur.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email déjà utilisé");
        }
        Utilisateur savedUser = utilisateurService.register(utilisateur);
        
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("message", "Inscription réussie ! Votre compte est en attente de validation par l'administrateur.");
        response.put("id", savedUser.getIdUtilisateur());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getMotDePasse()));
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body("Email ou mot de passe incorrect");
        } catch (org.springframework.security.authentication.DisabledException e) {
            Utilisateur user = utilisateurService.findByEmail(request.getEmail()).orElse(null);
            if (user != null && "PENDING".equals(user.getStatut())) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                        .body("Votre compte est en attente de validation par l'administrateur.");
            }
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body("Votre compte est désactivé. Veuillez contacter l'administrateur.");
        } catch (Exception e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body("Échec de l'authentification");
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        final String jwt = jwtUtils.generateToken(userDetails);

        Utilisateur user = utilisateurService.findByEmail(request.getEmail()).get();
        return ResponseEntity.ok(new AuthResponse(jwt, user));
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    static class LoginRequest {
        private String email;
        private String motDePasse;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            utilisateurService.initiatePasswordReset(request.getEmail());
            return ResponseEntity.ok().body("{\"message\": \"Email de réinitialisation envoyé\"}");
        } catch (RuntimeException e) {
            if ("Votre compte n'est pas encore activé. Veuillez contacter l'administrateur.".equals(e.getMessage())) {
                return ResponseEntity.status(403).body("{\"message\": \"" + e.getMessage() + "\"}");
            }
            // For security reasons, don't confirm if email exists for other errors
            return ResponseEntity.ok().body("{\"message\": \"Si l'email existe, un lien a été envoyé\"}");
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            utilisateurService.completePasswordReset(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok().body("{\"message\": \"Mot de passe mis à jour avec succès\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Data
    static class ForgotPasswordRequest {
        private String email;
    }

    @Data
    static class ResetPasswordRequest {
        private String token;
        private String newPassword;
    }

    @Data
    @AllArgsConstructor
    static class AuthResponse {
        private String token;
        private Utilisateur user;
    }
}
