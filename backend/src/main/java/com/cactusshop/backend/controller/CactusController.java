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
            @RequestParam(required = false, defaultValue = "Toți") String category,
            @RequestParam(required = false, defaultValue = "") String search) {

        if (category.equals("Toți")) {
            return cactusRepository.findByNameContainingIgnoreCase(search);
        } else {
            return cactusRepository.findByCategoryAndNameContainingIgnoreCase(category, search);
        }
    }

    @PostMapping
    public ResponseEntity<?> addCactus(@Valid @RequestBody CactusRequestDTO request) {

        Cactus cactus = new Cactus();
        cactus.setName(request.getName().trim());
        cactus.setPrice(request.getPrice());
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