package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.CactusRequestDTO;
import com.cactusshop.backend.model.Cactus;
import com.cactusshop.backend.repository.CactusRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
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
            @RequestParam(required = false) String mainCategory,
            @RequestParam(required = false, defaultValue = "Toți") String category,
            @RequestParam(required = false, defaultValue = "") String search) {

        // Fără categorie principală specificată -> căutare generală (compatibilitate)
        if (mainCategory == null || mainCategory.isBlank()) {
            return cactusRepository.findByNameContainingIgnoreCase(search);
        }

        // Categorie principală + "Toți" -> toate genurile din acea categorie principală
        if (category.equals("Toți")) {
            return cactusRepository.findByMainCategoryAndNameContainingIgnoreCase(mainCategory, search);
        }

        // Categorie principală + gen specific
        return cactusRepository.findByMainCategoryAndCategoryAndNameContainingIgnoreCase(
                mainCategory, category, search);
    }

    @PostMapping
    public ResponseEntity<?> addCactus(@Valid @RequestBody CactusRequestDTO request) {

        Cactus cactus = new Cactus();
        cactus.setName(request.getName().trim());
        cactus.setPrice(request.getPrice());
        cactus.setCategory(request.getCategory().trim());
        cactus.setMainCategory(request.getMainCategory().trim());
        cactus.setDescription(request.getDescription() != null ? request.getDescription().trim() : "");
        cactus.setImageUrl(request.getImageUrl() != null ? request.getImageUrl().trim() : "");

        Cactus saved = cactusRepository.save(cactus);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public void deleteCactus(@PathVariable Long id) {
        cactusRepository.deleteById(id);
    }
}