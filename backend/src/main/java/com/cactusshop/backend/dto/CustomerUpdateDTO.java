package com.cactusshop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CustomerUpdateDTO(@NotBlank(message = "Adresa este obligatorie.") String address) {}