package com.example.demo.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class SimulatedDownstream {
    private final Random random = new Random();

    public record SimulationResult(String message, Integer index, boolean inWindow) {
    }

    // Track request counts per endpoint for deterministic fail-window
    private static final Map<String, AtomicInteger> counters = new ConcurrentHashMap<>();

    // Store result in thread-local so controllers can access it even after an
    // exception
    private static final ThreadLocal<SimulationResult> lastResult = new ThreadLocal<>();

    public SimulationResult call(String endpoint, String scenario) {
        lastResult.remove();

        // Mock latency
        if ("slow".equalsIgnoreCase(scenario)) {
            sleep(400);
        } else {
            sleep(30);
        }

        // Mock failure (random 30%)
        if ("fail".equalsIgnoreCase(scenario)) {
            if (random.nextInt(100) < 30) {
                throw new RuntimeException("Downstream dependency failed (simulated 30% failure rate)");
            }
        }

        Integer index = null;
        boolean inWindow = false;
        String message = "Success";

        // Deterministic failure window for demos and visual clarity.
        // Calls 1-5: success, 6-12: 100% failure, 13+: recovery
        if ("fail-window".equalsIgnoreCase(scenario)) {
            AtomicInteger counter = counters.computeIfAbsent(endpoint, k -> new AtomicInteger(0));
            index = counter.incrementAndGet();

            if (index >= 6 && index <= 12) {
                inWindow = true;
                message = "Deterministic fail-window: forced failure (6–12).";
                SimulationResult res = new SimulationResult(message, index, inWindow);
                lastResult.set(res);
                throw new RuntimeException(message);
            } else if (index <= 5) {
                message = "Fail-window warmup (1–5): normal.";
            } else {
                message = "Fail-window recovery (13+): normal.";
            }
        }

        SimulationResult res = new SimulationResult(message, index, inWindow);
        lastResult.set(res);
        return res;
    }

    public static SimulationResult getLastResult() {
        return lastResult.get();
    }

    public static void reset() {
        counters.clear();
        lastResult.remove();
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
