package com.example.demo.web;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/info")
@CrossOrigin(origins = "*")
public class InfoController {

    @GetMapping
    public Map<String, Object> getInfo() {
        return Map.of(
                "service", "baseline-to-hardened",
                "javaVersion", System.getProperty("java.version"),
                "timestamp", Instant.now().toString());
    }
}
