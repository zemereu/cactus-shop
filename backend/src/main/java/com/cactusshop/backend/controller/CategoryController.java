package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.CategoryRequestDTO;
import com.cactusshop.backend.model.Category;
import com.cactusshop.backend.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @GetMapping
    public List<Category> getCategories(@RequestParam(required = false) String mainCategory) {
        return categoryService.getCategories(mainCategory);
    }

    @PostMapping
    public ResponseEntity<Category> addCategory(@Valid @RequestBody CategoryRequestDTO request) {
        return ResponseEntity.ok(categoryService.addCategory(request));
    }

    @DeleteMapping("/{id}")
    public void deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
    }
}