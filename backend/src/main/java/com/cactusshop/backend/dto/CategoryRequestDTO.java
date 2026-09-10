package com.cactusshop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class CategoryRequestDTO {

    @NotBlank(message = "Numele subcategoriei este obligatoriu.")
    private String name;

    @NotBlank(message = "Categoria principală este obligatorie.")
    private String mainCategory;

    public CategoryRequestDTO() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getMainCategory() { return mainCategory; }
    public void setMainCategory(String mainCategory) { this.mainCategory = mainCategory; }
}