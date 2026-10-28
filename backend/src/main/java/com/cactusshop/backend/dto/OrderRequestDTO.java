package com.cactusshop.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import java.math.BigDecimal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record OrderRequestDTO(
        @NotBlank(message = "Numele clientului este obligatoriu.")
        @Size(max = 255) String customerName,
        @NotBlank(message = "Adresa de email este obligatorie.")
        @Email(message = "Adresa de email nu este validă.")
        @Size(max = 255) String email,
        @NotBlank(message = "Adresa de livrare este obligatorie.")
        @Size(max = 255) String address,
        @NotEmpty(message = "Coșul este gol.")
        @Size(max = 1000, message = "O comandă poate conține cel mult 1000 de exemplare.")
        List<@NotNull @Positive Long> cactusIds,
        @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal expectedTotal
) {}
