package com.raft.backend.raft.util;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class AdaptiveTimeoutLogger {
    private static final String FILE_NAME = "timeout_calculations.log";
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    static {
        // Clear the file on application start
        try {
            File file = new File(FILE_NAME);
            if (file.exists()) {
                file.delete();
            }
            file.createNewFile();
            logSystemEvent("Adaptive Election Timeout logger initialized. Fresh session started.");
        } catch (IOException e) {
            System.err.println("Failed to initialize adaptive timeout log file: " + e.getMessage());
        }
    }

    public static synchronized void logSystemEvent(String message) {
        writeLine("[SYSTEM] " + message);
    }

    public static synchronized void logHeartbeat(String nodeId, long interval, double avgInterval, double jitter) {
        String message = String.format("[%s] HEARTBEAT_ARRIVED | interval=%dms, avgInterval=%.2fms, jitter=%.2fms",
                nodeId, interval, avgInterval, jitter);
        writeLine(message);
    }

    public static synchronized void logTimeoutReset(String nodeId, long base, long electionTimeout) {
        String message = String.format("[%s] TIMEOUT_RESET     | baseTimeout=%dms, actualTimeout=%dms",
                nodeId, base, electionTimeout);
        writeLine(message);
    }

    private static void writeLine(String message) {
        String timestamp = LocalDateTime.now().format(formatter);
        try (FileWriter fw = new FileWriter(FILE_NAME, true);
             PrintWriter pw = new PrintWriter(fw)) {
            pw.println("[" + timestamp + "] " + message);
        } catch (IOException e) {
            System.err.println("Error writing to adaptive timeout log file: " + e.getMessage());
        }
    }
}
