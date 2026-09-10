package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.CategoryRequestDTO;
import com.cactusshop.backend.model.Category;
import com.cactusshop.backend.repository.CategoryRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "https://cactshop.netlify.app")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    // Fără parametru -> toate subcategoriile.
    // Cu ?mainCategory=Cactuși -> doar subcategoriile din acea categorie principală.
    @GetMapping
    public List<Category> getCategories(
            @RequestParam(required = false) String mainCategory) {
        if (mainCategory == null || mainCategory.isBlank()) {
            return categoryRepository.findAll();
        }
        return categoryRepository.findByMainCategory(mainCategory);
    }

    @PostMapping
    public ResponseEntity<?> addCategory(@Valid @RequestBody CategoryRequestDTO request) {
        Category category = new Category();
        category.setName(request.getName().trim());
        category.setMainCategory(request.getMainCategory().trim());

        Category saved = categoryRepository.save(category);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public void deleteCategory(@PathVariable Long id) {
        categoryRepository.deleteById(id);
    }
}