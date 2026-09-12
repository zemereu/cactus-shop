package com.cactusshop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record OrderStatusUpdateDTO(@NotBlank(message = "Statusul este obligatoriu.") String status) {}