package com.tltn.tour.service;

import com.tltn.tour.model.Tour;
import com.tltn.tour.model.User;
import com.tltn.tour.model.SystemLog;
import com.tltn.tour.repository.SystemLogRepository;
import com.tltn.tour.repository.TourRepository;
import com.tltn.tour.repository.UserRepository;
import com.tltn.tour.repository.UserSessionRepository;
import com.tltn.tour.repository.FavoriteTourRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;


@Service
public class TourServiceImpl implements TourService {

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Autowired
    private SystemLogRepository systemLogRepository;

    @Autowired
    private FavoriteTourRepository favoriteTourRepository;

    @Override
    public List<Tour> getAllTours(String keyword, String category, String location, Long maxPrice) {
        return tourRepository.findToursFiltered(keyword, category, location, maxPrice);
    }

    @Override
    public List<String> getUniqueLocations() {
        return tourRepository.findUniqueLocations();
    }

    @Override
    public List<Tour> getRecommendations(int limit) {
        List<Tour> allTours = tourRepository.findAll();
        if (allTours.isEmpty()) {
            return new ArrayList<>();
        }
        // Mock recommendation: Shuffle and return a subset of tours
        List<Tour> shuffled = new ArrayList<>(allTours);
        Collections.shuffle(shuffled);
        return shuffled.subList(0, Math.min(limit, shuffled.size()));
    }

    @Override
    public List<Tour> getPersonalizedRecommendations(String authorizationHeader, int limit) {
        User user = null;
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            try {
                String token = authorizationHeader.substring(7);
                var sessionOpt = userSessionRepository.findByToken(token);
                if (sessionOpt.isPresent()) {
                    var session = sessionOpt.get();
                    if (session.getExpiryDate().isAfter(LocalDateTime.now())) {
                        user = userRepository.findById(session.getUserId()).orElse(null);
                    }
                }
            } catch (Exception e) {
                // Ignore session error for recommendations, fall back to default
            }
        }

        List<Tour> allTours = tourRepository.findAll();
        if (allTours.isEmpty()) {
            return new ArrayList<>();
        }

        if (user == null || 
            ((user.getFavoriteCategory() == null || user.getFavoriteCategory().isEmpty()) && 
             (user.getFavoriteLocation() == null || user.getFavoriteLocation().isEmpty()))) {
            // Default random recommendation
            List<Tour> shuffled = new ArrayList<>(allTours);
            Collections.shuffle(shuffled);
            return shuffled.subList(0, Math.min(limit, shuffled.size()));
        }

        // We have a user with preferences! Filter tours matching preferences.
        String favCat = user.getFavoriteCategory();
        String favLoc = user.getFavoriteLocation();

        List<Tour> matchedTours = new ArrayList<>();
        List<Tour> otherTours = new ArrayList<>();

        for (Tour tour : allTours) {
            boolean matchesCategory = favCat != null && !favCat.isEmpty() && tour.getCategory() != null && tour.getCategory().equalsIgnoreCase(favCat);
            boolean matchesLocation = favLoc != null && !favLoc.isEmpty() && tour.getLocation() != null && tour.getLocation().equalsIgnoreCase(favLoc);
            
            if (matchesCategory || matchesLocation) {
                matchedTours.add(tour);
            } else {
                otherTours.add(tour);
            }
        }

        // Shuffle both lists for variety
        Collections.shuffle(matchedTours);
        Collections.shuffle(otherTours);

        List<Tour> result = new ArrayList<>();
        // Add matched tours first
        result.addAll(matchedTours);
        // Fill the rest of the limit with other tours
        if (result.size() < limit) {
            int needed = limit - result.size();
            result.addAll(otherTours.subList(0, Math.min(needed, otherTours.size())));
        }

        return result.subList(0, Math.min(limit, result.size()));
    }

    @Override
    public void seedDatabase() {
        // Detect and clear corrupted database entries (mojibake)
        boolean hasCorrupted = tourRepository.findAll().stream()
                .anyMatch(t -> t.getTitle().contains("Ã") || t.getTitle().contains("á»") || t.getTitle().contains("Ä"));
        
        // Detect if database was seeded with mismatched columns (e.g. departureDates contains tags)
        boolean hasMismatchedColumns = false;
        if (!hasCorrupted && tourRepository.count() > 0) {
            hasMismatchedColumns = tourRepository.findAll().stream().limit(30)
                    .anyMatch(t -> t.getDepartureDates() != null && 
                                  (t.getDepartureDates().contains("nuoc ngoai") || 
                                   t.getDepartureDates().contains("trong nuoc") || 
                                   t.getDepartureDates().contains("le hoi") ||
                                   t.getDepartureDates().contains("bien") ||
                                   t.getDepartureDates().contains("dao")));
        }

        if (hasCorrupted || hasMismatchedColumns) {
            System.out.println("⚠️ Detected corrupted database encoding or mismatched columns. Clearing all tours to re-seed...");
            favoriteTourRepository.deleteAll();
            tourRepository.deleteAll();
        }

        if (tourRepository.count() > 0) {
            System.out.println("Database already has " + tourRepository.count() + " tours. Skipping seeding.");
            return;
        }

        // Try to locate CSV file from multiple typical paths
        String[] paths = {
            "../scraper/tours_backup.csv",
            "../scraper/tours.csv",
            "scraper/tours_backup.csv",
            "scraper/tours.csv",
            "./tours_backup.csv",
            "./tours.csv"
        };

        File csvFile = null;
        for (String path : paths) {
            File f = new File(path);
            if (f.exists() && f.isFile()) {
                csvFile = f;
                break;
            }
        }

        if (csvFile == null) {
            System.out.println("❌ WARNING: Could not find tours_backup.csv or tours.csv. Database was not seeded.");
            return;
        }

        System.out.println("🌱 Seeding database from CSV file: " + csvFile.getAbsolutePath());

        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(csvFile), StandardCharsets.UTF_8))) {
            String line;
            boolean isHeader = true;
            int count = 0;

            while ((line = br.readLine()) != null) {
                if (isHeader) {
                    isHeader = false;
                    continue; // Skip CSV headers
                }

                if (line.trim().isEmpty()) {
                    continue;
                }

                List<String> parts = parseCsvLine(line);
                if (parts.size() >= 7) {
                    try {
                        Tour tour = new Tour();
                        tour.setTitle(cleanField(parts.get(0)));
                        tour.setPrice(Long.parseLong(cleanField(parts.get(1))));
                        tour.setDuration(cleanField(parts.get(2)));
                        tour.setLocation(cleanField(parts.get(3)));
                        tour.setCategory(cleanField(parts.get(4)));
                        tour.setImageUrl(cleanField(parts.get(5)));
                        tour.setTourUrl(cleanField(parts.get(6)));

                        if (parts.size() >= 8) {
                            tour.setDescription(cleanField(parts.get(7)));
                        }
                        if (parts.size() >= 9) {
                            tour.setDepartureDates(cleanField(parts.get(8)));
                        }
                        if (parts.size() >= 10) {
                            tour.setTags(cleanField(parts.get(9)));
                        }

                        tourRepository.save(tour);
                        count++;
                    } catch (Exception e) {
                        System.out.println("Skipping invalid CSV line: " + line.substring(0, Math.min(line.length(), 60)) + "... (Error: " + e.getMessage() + ")");
                    }
                }
            }
            System.out.println("✅ Database successfully seeded with " + count + " tours.");
        } catch (IOException e) {
            System.out.println("❌ ERROR: Failed to read CSV file: " + e.getMessage());
        }
    }

    private List<String> parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder currentField = new StringBuilder();
        boolean inQuotes = false;
        
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    currentField.append('"');
                    i++; // skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                result.add(currentField.toString());
                currentField.setLength(0);
            } else {
                currentField.append(c);
            }
        }
        result.add(currentField.toString());
        return result;
    }

    private String cleanField(String val) {
        if (val == null) return "";
        val = val.trim();
        // Remove surrounding double quotes
        if (val.startsWith("\"") && val.endsWith("\"")) {
            val = val.substring(1, val.length() - 1);
        }
        return val.replace("\"\"", "\"").replace("\\n", "\n"); // Unescape double quotes and newlines
    }


    @Override
    public Map<String, Object> syncTours(List<Tour> tours) {
        int created = 0;
        int updated = 0;
        
        for (Tour tour : tours) {
            if (tour.getTourUrl() == null || tour.getTourUrl().trim().isEmpty()) {
                continue;
            }
            
            Optional<Tour> existingOpt = tourRepository.findByTourUrl(tour.getTourUrl());
            if (existingOpt.isPresent()) {
                Tour existing = existingOpt.get();
                existing.setTitle(tour.getTitle());
                existing.setPrice(tour.getPrice());
                existing.setDuration(tour.getDuration());
                existing.setLocation(tour.getLocation());
                existing.setCategory(tour.getCategory());
                existing.setImageUrl(tour.getImageUrl());
                existing.setDescription(tour.getDescription());
                existing.setTags(tour.getTags());
                existing.setDepartureDates(tour.getDepartureDates());
                
                tourRepository.save(existing);
                updated++;
            } else {
                tourRepository.save(tour);
                created++;
            }
        }
        
        // Log sync activity
        try {
            SystemLog log = new SystemLog();
            log.setAction("CRAWL_AUTO");
            log.setDetails("Tự động đồng bộ từ Python crawler thành công: thêm mới " + created + " tour, cập nhật " + updated + " tour.");
            log.setUsername("SYSTEM_PYTHON");
            log.setTimestamp(LocalDateTime.now());
            systemLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Failed to log crawl activity: " + e.getMessage());
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("created", created);
        result.put("updated", updated);
        result.put("message", "Đồng bộ thành công!");
        return result;
    }

    @Override
    public Tour getTourById(Long id) {
        Tour tour = tourRepository.findById(id).orElse(null);
        if (tour != null) {
            return tour;
        }

        // Fallback: If not found, the ID might be a 1-based CSV index (row number) from the Python AI recommendations server.
        // Let's resolve the actual database record by matching the unique tourUrl from the CSV row at this index.
        try {
            String[] paths = {
                "../scraper/tours_backup.csv",
                "../scraper/tours.csv",
                "scraper/tours_backup.csv",
                "scraper/tours.csv",
                "./tours_backup.csv",
                "./tours.csv"
            };

            File csvFile = null;
            for (String path : paths) {
                File f = new File(path);
                if (f.exists() && f.isFile()) {
                    csvFile = f;
                    break;
                }
            }

            if (csvFile != null && id > 0) {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(csvFile), StandardCharsets.UTF_8))) {
                    String line;
                    boolean isHeader = true;
                    int currentIndex = 0;
                    long targetIndex = id - 1; // Convert 1-based ID to 0-based CSV index

                    while ((line = br.readLine()) != null) {
                        if (isHeader) {
                            isHeader = false;
                            continue;
                        }
                        if (line.trim().isEmpty()) {
                            continue;
                        }
                        
                        if (currentIndex == targetIndex) {
                            List<String> parts = parseCsvLine(line);
                            if (parts.size() >= 7) {
                                String tourUrl = cleanField(parts.get(6));
                                if (tourUrl != null && !tourUrl.trim().isEmpty()) {
                                    Optional<Tour> dbTour = tourRepository.findByTourUrl(tourUrl);
                                    if (dbTour.isPresent()) {
                                        System.out.println("🔄 Resolved CSV ID " + id + " to DB ID " + dbTour.get().getId() + " via tourUrl match.");
                                        return dbTour.get();
                                    }
                                }
                            }
                            break;
                        }
                        currentIndex++;
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to resolve tour ID via CSV fallback: " + e.getMessage());
        }

        return null;
    }
}
