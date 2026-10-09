package com.cactusshop.backend.controller;

import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
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

    private static final int MAX_WIDTH = 800;
    private static final int MAX_HEIGHT = 800;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadImage(
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Fisierul este gol.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest()
                    .body("Doar imagini sunt acceptate.");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest()
                    .body("Imaginea depaseste 5MB.");
        }

        BufferedImage image;

        try (var stream = file.getInputStream();
             var input = ImageIO.createImageInputStream(stream)) {

            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                return ResponseEntity.badRequest()
                        .body("Imagine invalidă sau format neacceptat.");
            }

            var reader = readers.next();

            try {
                reader.setInput(input, true, true);

                int width = reader.getWidth(0);
                int height = reader.getHeight(0);

                if (width < 1 || height < 1
                        || width > 10000 || height > 10000
                        || (long) width * height > 20000000) {
                    return ResponseEntity.badRequest().body(
                            "Imaginea depășește limita de 20 megapixeli / 10000 pixeli pe latură.");
                }

                // Decode only a subsampled image when the source is large.
                var parameters = reader.getDefaultReadParam();
                int sample = Math.max(1, Math.max(width, height) / 1600);
                parameters.setSourceSubsampling(sample, sample, 0, 0);

                image = reader.read(0, parameters);
            } finally {
                reader.dispose();
            }

            if (image == null) {
                return ResponseEntity.badRequest().body("Imagine invalidă.");
            }
        } catch (IOException | IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body("Imagine invalidă sau deteriorată.");
        }

        // JPEG has no transparency: composite onto a white background.
        BufferedImage rgb = new BufferedImage(
                image.getWidth(),
                image.getHeight(),
                BufferedImage.TYPE_INT_RGB
        );

        var graphics = rgb.createGraphics();
        try {
            graphics.setColor(java.awt.Color.WHITE);
            graphics.fillRect(0, 0, rgb.getWidth(), rgb.getHeight());
            graphics.drawImage(image, 0, 0, null);
        } finally {
            graphics.dispose();
        }

        image = rgb;

        try {
            Path uploadPath = Paths.get(uploadDir)
                    .normalize()
                    .toAbsolutePath();

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String fileName = UUID.randomUUID() + ".jpg";
            Path filePath = uploadPath.resolve(fileName).normalize();

            if (!filePath.startsWith(uploadPath)) {
                return ResponseEntity.badRequest().body("Path invalid.");
            }

            Thumbnails.of(image)
                    .size(MAX_WIDTH, MAX_HEIGHT)
                    .keepAspectRatio(true)
                    .outputFormat("jpg")
                    .outputQuality(0.85)
                    .toFile(filePath.toFile());

            return ResponseEntity.ok(
                    Map.of("imageUrl", "/api/images/" + fileName)
            );
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body("Eroare la salvarea imaginii.");
        }
    }

    @GetMapping("/{fileName}")
    public ResponseEntity<byte[]> getImage(@PathVariable String fileName) {
        try {
            if (fileName.contains("..")
                    || fileName.contains("/")
                    || fileName.contains("\\")) {
                return ResponseEntity.badRequest().build();
            }

            Path uploadPath = Paths.get(uploadDir)
                    .normalize()
                    .toAbsolutePath();

            Path filePath = uploadPath.resolve(fileName).normalize();

            if (!filePath.startsWith(uploadPath) || !Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            byte[] imageBytes = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);

            if (contentType == null) {
                contentType = "image/jpeg";
            }

            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .header("Cache-Control", "public, max-age=31536000")
                    .body(imageBytes);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}