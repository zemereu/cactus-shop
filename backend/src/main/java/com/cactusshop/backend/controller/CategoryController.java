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
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

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
        category.setName(request.name().trim());
        category.setMainCategory(request.mainCategory().trim());

        Category saved = categoryRepository.save(category);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public void deleteCategory(@PathVariable Long id) {
        categoryRepository.deleteById(id);
    }
}