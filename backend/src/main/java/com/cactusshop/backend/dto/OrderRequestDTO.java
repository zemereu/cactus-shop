package com.cactusshop.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class OrderRequestDTO {

    @NotBlank(message = "Numele clientului este obligatoriu.")
    private String customerName;

    @NotBlank(message = "Adresa de email este obligatorie.")
    @Email(message = "Adresa de email nu este validă.")
    private String email;

    @NotBlank(message = "Adresa de livrare este obligatorie.")
    private String address;

    @NotEmpty(message = "Coșul este gol.")
    private List<Long> cactusIds;

    public OrderRequestDTO() {}

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public List<Long> getCactusIds() { return cactusIds; }
    public void setCactusIds(List<Long> cactusIds) { this.cactusIds = cactusIds; }
}