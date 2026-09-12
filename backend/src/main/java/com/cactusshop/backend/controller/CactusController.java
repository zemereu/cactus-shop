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

        if (productType == null || productType.isBlank() || mainCategory == null || mainCategory.isBlank()) {
            return cactusRepository.findByNameContainingIgnoreCase(search);
        }

        if (category.equals("Toți")) {
            return cactusRepository.findByProductTypeAndMainCategoryAndNameContainingIgnoreCase(
                    productType, mainCategory, search);
        }

        return cactusRepository.findByProductTypeAndMainCategoryAndCategoryAndNameContainingIgnoreCase(
                productType, mainCategory, category, search);
    }

    @PostMapping
    public ResponseEntity<?> addCactus(@Valid @RequestBody CactusRequestDTO request) {

        Cactus cactus = new Cactus();
        cactus.setName(request.name().trim());
        cactus.setPrice(request.price());
        cactus.setProductType(request.productType().trim());
        cactus.setMainCategory(request.mainCategory().trim());
        cactus.setCategory(request.category().trim());
        cactus.setDescription(request.description() != null ? request.description().trim() : "");
        cactus.setImageUrl(request.imageUrl() != null ? request.imageUrl().trim() : "");

        Cactus saved = cactusRepository.save(cactus);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public void deleteCactus(@PathVariable Long id) {
        cactusRepository.deleteById(id);
    }
}