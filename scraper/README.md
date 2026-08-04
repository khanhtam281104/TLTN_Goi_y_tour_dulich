# Tour Scraper (Python 3)

Công cụ cào dữ liệu từ trang **dulichviet.com.vn** để xuất ra file CSV phục vụ cho việc train mô hình AI gợi ý tour.

---

## 🛠️ Hướng dẫn cài đặt và chạy (Quick Start)

### 1. Chuẩn bị Môi trường ảo (Virtual Environment)
Mở terminal và di chuyển vào thư mục `scraper/`:
```bash
cd scraper
```

Tạo và kích hoạt môi trường ảo:
- **Windows (PowerShell)**:
  ```powershell
  python -m venv venv
  .\venv\Scripts\activate
  ```
- **Linux / macOS**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### 2. Cài đặt các thư viện phụ thuộc
Chạy lệnh sau để cài đặt các gói cần thiết:
```bash
pip install -r requirements.txt
```

### 3. Chạy công cụ cào dữ liệu
Chạy script chính để bắt đầu thu thập:
```bash
python scraper.py
```

Sau khi chạy xong, dữ liệu sẽ được lưu tại file **`tours.csv`** nằm cùng thư mục.

---

## 📊 Cấu trúc file đầu ra `tours.csv`

File kết quả sẽ có định dạng UTF-8 (với BOM để hiển thị đúng tiếng Việt trong Microsoft Excel) gồm các cột:
- `title`: Tên đầy đủ của tour du lịch.
- `price`: Giá tour (kiểu số nguyên VND).
- `duration`: Thời gian diễn ra tour (ví dụ: `3N2Đ`, `4N3Đ`).
- `location`: Địa điểm du lịch (ví dụ: `Phú Quốc`, `Sapa`, `Hạ Long`,...).
- `category`: Danh mục tour (`Trong nước` hoặc `Nước ngoài`).
- `image_url`: Link ảnh đại diện của tour.
- `tour_url`: Link chi tiết tour trên website.
