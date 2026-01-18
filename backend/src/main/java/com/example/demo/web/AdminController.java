package com.example.demo.web;

import com.example.demo.service.SimulatedDownstream;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final CircuitBreaker circuitBreaker;

    @GetMapping("/status")
    public Map<String, Object> getStatus() {
        return Map.of(
                "circuitBreakerState", circuitBreaker.getState().toString(),
                "failureRate", circuitBreaker.getMetrics().getFailureRate(),
                "bufferedCalls", circuitBreaker.getMetrics().getNumberOfBufferedCalls(),
                "failedCalls", circuitBreaker.getMetrics().getNumberOfFailedCalls());
    }

    @PostMapping("/reset")
    public Map<String, String> reset() {
        SimulatedDownstream.reset();
        circuitBreaker.reset();
        return Map.of("message", "Lab state reset successfully");
    }
}
