package com.cactusshop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class CategoryRequestDTO {

    @NotBlank(message = "Numele categoriei este obligatoriu.")
    private String name;

    public CategoryRequestDTO() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}