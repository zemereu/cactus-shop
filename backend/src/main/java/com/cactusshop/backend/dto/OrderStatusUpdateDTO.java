package com.cactusshop.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class OrderStatusUpdateDTO {

    @NotBlank(message = "Statusul este obligatoriu.")
    private String status;

    public OrderStatusUpdateDTO() {}

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}