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
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String mainCategory,
            @RequestParam(required = false, defaultValue = "Toți") String category,
            @RequestParam(required = false, defaultValue = "") String search) {

        // Fără tip produs SAU fără categorie principală -> căutare generală (compatibilitate)
        if (productType == null || productType.isBlank() || mainCategory == null || mainCategory.isBlank()) {
            return cactusRepository.findByNameContainingIgnoreCase(search);
        }

        // "Toți" -> toate genurile din acea combinație tip produs + categorie principală
        if (category.equals("Toți")) {
            return cactusRepository.findByProductTypeAndMainCategoryAndNameContainingIgnoreCase(
                    productType, mainCategory, search);
        }

        // Filtrare completă pe gen specific
        return cactusRepository.findByProductTypeAndMainCategoryAndCategoryAndNameContainingIgnoreCase(
                productType, mainCategory, category, search);
    }

    @PostMapping
    public ResponseEntity<?> addCactus(@Valid @RequestBody CactusRequestDTO request) {

        Cactus cactus = new Cactus();
        cactus.setName(request.getName().trim());
        cactus.setPrice(request.getPrice());
        cactus.setProductType(request.getProductType().trim());
        cactus.setMainCategory(request.getMainCategory().trim());
        cactus.setCategory(request.getCategory().trim());
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