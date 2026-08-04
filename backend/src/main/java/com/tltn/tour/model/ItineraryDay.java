package com.tltn.tour.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "itinerary_days")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItineraryDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trip_plan_id")
    private Long tripPlanId;

    @Column(name = "day_number")
    private int dayNumber;

    @Column(columnDefinition = "TEXT")
    private String activities;
}
