# TLTN_Goi_y_tour_dulich (Tour Recommendation System)

Đây là dự án tốt nghiệp tích hợp Backend Spring Boot và Frontend ReactJS (Vite + TypeScript).

---

## 📂 Cấu trúc thư mục (Directory Structure)

```text
TLTN_Goi_y_tour_dulich/
├── backend/               # Spring Boot Application (Maven)
│   ├── src/               # Mã nguồn Java (Controllers, Services, Repositories, Entities)
│   ├── pom.xml            # Quản lý thư viện Maven
│   └── ...
├── frontend/              # ReactJS Application (Vite + TypeScript)
│   ├── src/               # React components, views, assets
│   ├── package.json       # Quản lý thư viện NPM
│   └── ...
└── README.md              # Tài liệu hướng dẫn này
```

---

## 🛠️ Yêu cầu hệ thống (Prerequisites)

- **Java Development Kit (JDK)**: Phiên bản 17.
- **Apache Maven**: Phiên bản 3.9+ (hoặc dùng Maven wrapper `./mvnw` đi kèm).
- **Node.js**: Phiên bản 18+ và **npm** 9+.
- **Database**: MySQL Server.

---

## 🚀 Hướng dẫn Chạy Dự Án (How to Run)

### 1. Cấu hình Cơ sở dữ liệu (Database Setup)
1. Tạo một cơ sở dữ liệu mới trong MySQL:
   ```sql
   CREATE DATABASE tour_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Cập nhật thông tin kết nối (username, password) trong file cấu hình backend:
   - File: [backend/src/main/resources/application.properties](file:///c:/Users/User/IdeaProjects/TLTN_Goi_y_tour_dulich/backend/src/main/resources/application.properties)

---

### 2. Khởi chạy Backend (Spring Boot)
Di chuyển vào thư mục `backend` và chạy lệnh:
```bash
cd backend
# Dành cho Windows:
.\mvnw.cmd spring-boot:run

# Dành cho Linux/macOS:
chmod +x mvnw
./mvnw spring-boot:run
```
Backend sẽ khởi chạy tại cổng: `http://localhost:8080`

---

### 3. Khởi chạy Frontend (ReactJS + Vite)
Di chuyển vào thư mục `frontend`, cài đặt thư viện và khởi chạy:
```bash
cd frontend
npm install
npm run dev
```
Frontend sẽ chạy tại địa chỉ được hiển thị ở terminal (thường là `http://localhost:5173`).

---

## 📦 Các thư viện chính được cấu hình sẵn

### Backend (Spring Boot)
- **Spring Web**: Tạo các RESTful APIs.
- **Spring Data JPA**: Giao tiếp cơ sở dữ liệu qua Hibernate.
- **MySQL Driver**: Trình điều khiển kết nối MySQL.
- **Lombok**: Giảm thiểu code getter/setter dư thừa.

### Frontend (ReactJS)
- **Vite**: Bộ công cụ build siêu nhanh.
- **TypeScript**: Giúp viết code an toàn và dễ debug.