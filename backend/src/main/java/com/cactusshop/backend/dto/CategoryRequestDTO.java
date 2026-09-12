package com.cactusshop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequestDTO(
        @NotBlank(message = "Numele subcategoriei este obligatoriu.") String name,
        @NotBlank(message = "Categoria principală este obligatorie.") String mainCategory
) {}