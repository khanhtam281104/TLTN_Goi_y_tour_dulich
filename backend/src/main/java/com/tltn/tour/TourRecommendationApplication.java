package com.tltn.tour;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import javax.sql.DataSource;
import java.sql.Connection;

@SpringBootApplication
public class TourRecommendationApplication {

	public static void main(String[] args) {
		SpringApplication.run(TourRecommendationApplication.class, args);
	}

	@Bean
	public CommandLineRunner testConnection(DataSource dataSource) {
		return args -> {
			try (Connection connection = dataSource.getConnection()) {
				System.out.println("==============================================");
				System.out.println("✅ KẾT NỐI DATABASE THÀNH CÔNG!");
				System.out.println("Database: " + connection.getMetaData().getDatabaseProductName());
				System.out.println("URL: " + connection.getMetaData().getURL());
				System.out.println("==============================================");
			} catch (Exception e) {
				System.out.println("==============================================");
				System.out.println("❌ KẾT NỐI DATABASE THẤT BẠI!");
				System.out.println("Lỗi: " + e.getMessage());
				System.out.println("==============================================");
			}
		};
	}

}
