package com.cactusshop.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record OrderRequestDTO(
        @NotBlank(message = "Numele clientului este obligatoriu.") String customerName,
        @NotBlank(message = "Adresa de email este obligatorie.")
        @Email(message = "Adresa de email nu este validă.") String email,
        @NotBlank(message = "Adresa de livrare este obligatorie.") String address,
        @NotEmpty(message = "Coșul este gol.") List<Long> cactusIds
) {}