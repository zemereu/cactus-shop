package com.cactusshop.backend.dto;

// Recenzia așa cum e afișată public — fără emailul autorului.
public record ReviewResponseDTO(
        Long id,
        String customerName,
        int rating,
        String comment,
        String createdAt
) {}