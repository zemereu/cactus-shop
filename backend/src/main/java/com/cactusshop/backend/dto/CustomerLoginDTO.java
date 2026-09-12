package com.cactusshop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CustomerLoginDTO(
        @NotBlank(message = "Emailul este obligatoriu.") String email,
        @NotBlank(message = "Parola este obligatorie.") String password
) {}