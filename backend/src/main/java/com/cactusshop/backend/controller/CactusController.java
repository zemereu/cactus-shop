package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.CactusRequestDTO;
import com.cactusshop.backend.model.Cactus;
import com.cactusshop.backend.repository.CactusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cacti")
@CrossOrigin(origins = "https://cactshop.netlify.app")
public class CactusController {

    @Autowired
    private CactusRepository cactusRepository;

    @GetMapping
    public List<Cactus> getCacti(
            @RequestParam(required = false, defaultValue = "Toți") String category,
            @RequestParam(required = false, defaultValue = "") String search) {

        // Dacă utilizatorul vrea toate categoriile, căutăm doar după text
        if (category.equals("Toți")) {
            return cactusRepository.findByNameContainingIgnoreCase(search);
        }
        // Altfel, căutăm și după categorie, și după text
        else {
            return cactusRepository.findByCategoryAndNameContainingIgnoreCase(category, search);
        }
    }

    @PostMapping
    public ResponseEntity<?> addCactus(@RequestBody CactusRequestDTO request) {

        // --- Validări de bază ---
        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Numele produsului este obligatoriu.");
        }
        if (request.getPrice() <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Prețul trebuie să fie mai mare decât 0.");
        }
        if (request.getCategory() == null || request.getCategory().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Categoria este obligatorie.");
        }

        // --- Construim entitatea NOUĂ — fără id, Spring/Hibernate îl alocă automat ---
        Cactus cactus = new Cactus();
        cactus.setName(request.getName().trim());
        cactus.setPrice(request.getPrice());
        cactus.setCategory(request.getCategory().trim());
        cactus.setDescription(request.getDescription() != null ? request.getDescription().trim() : "");
        cactus.setImageUrl(request.getImageUrl() != null ? request.getImageUrl().trim() : "");

        Cactus saved = cactusRepository.save(cactus);
        return ResponseEntity.ok(saved);
    }

    // NOU: Endpoint-ul pentru ștergere
    @DeleteMapping("/{id}")
    public void deleteCactus(@PathVariable Long id) {
        cactusRepository.deleteById(id);
    }
}