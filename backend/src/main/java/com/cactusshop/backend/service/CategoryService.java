package com.cactusshop.backend.service;

import com.cactusshop.backend.dto.CategoryRequestDTO;
import com.cactusshop.backend.model.Category;
import com.cactusshop.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public List<Category> getCategories(String mainCategory) {
        if (mainCategory == null || mainCategory.isBlank()) {
            return categoryRepository.findAll();
        }
        return categoryRepository.findByMainCategory(mainCategory);
    }

    public Category addCategory(CategoryRequestDTO request) {
        Category category = new Category();
        category.setName(request.name().trim());
        category.setMainCategory(request.mainCategory().trim());
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
}