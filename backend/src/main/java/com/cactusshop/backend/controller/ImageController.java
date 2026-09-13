package com.cactusshop.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    @Value("${UPLOAD_DIR:/tmp/uploads}")
    private String uploadDir;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Fisierul este gol.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body("Doar imagini sunt acceptate.");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().body("Imaginea depaseste 5MB.");
        }

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalName = file.getOriginalFilename();
            String extension = "";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID() + extension;

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);

            String imageUrl = "/api/images/" + fileName;
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Eroare la salvarea imaginii.");
        }
    }

    @GetMapping("/{fileName}")
    public ResponseEntity<byte[]> getImage(@PathVariable String fileName) {
        try {
            // Previne path traversal
            if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
                return ResponseEntity.badRequest().build();
            }

            Path filePath = Paths.get(uploadDir).resolve(fileName);
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            byte[] imageBytes = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "image/jpeg";

            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .body(imageBytes);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}