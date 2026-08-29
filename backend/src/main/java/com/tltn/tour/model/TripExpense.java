package com.tltn.tour.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDate;

@Entity
@Table(name = "trip_expenses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TripExpense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trip_plan_id", nullable = false)
    private Long tripPlanId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_plan_id", insertable = false, updatable = false)
    @JsonIgnore
    private TripPlan tripPlan;

    private String title;

    private Long amount;

    private String category; // Ăn uống, Di chuyển, Lưu trú, Vui chơi, Khác

    private LocalDate date;
}
