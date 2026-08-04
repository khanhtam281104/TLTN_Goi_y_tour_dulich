package com.tltn.tour.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "tour_bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TourBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "tour_id", nullable = false)
    private Long tourId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(name = "departure_date", nullable = false)
    private String departureDate;

    @Column(name = "number_of_guests", nullable = false)
    private int numberOfGuests;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "booking_date")
    private LocalDateTime bookingDate;

    private String status = "PENDING"; // PENDING, CONFIRMED, CANCELLED
}
