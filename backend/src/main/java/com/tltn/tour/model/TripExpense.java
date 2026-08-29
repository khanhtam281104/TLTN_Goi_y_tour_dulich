package com.tltn.tour.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
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

    private String title;

    private Long amount;

    private String category; // Ăn uống, Di chuyển, Lưu trú, Vui chơi, Khác

    private LocalDate date;
}
