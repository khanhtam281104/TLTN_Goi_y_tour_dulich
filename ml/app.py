import os
import re
import pickle
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app) # Enable CORS for React frontend requests

# Resolve absolute paths relative to app.py location
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
csv_path = os.path.join(base_dir, "tours.csv")
vectorizer_path = os.path.join(base_dir, "ml", "models", "tfidf_vectorizer.pkl")
classifier_path = os.path.join(base_dir, "ml", "models", "intent_classifier.pkl")

# Global variables for models and data
vectorizer = None
classifier = None
df_tours = None
tours_tfidf = None

def remove_accents(input_str):
    if not isinstance(input_str, str):
        return ""
    s1 = u'ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠạẢảẤấẦầẨẩẪẫẬậẮắẰằẲẳẴẵẬậẸẹẺẻẼẽẾếỀềỂểỄễỆệỈỉỊịỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợỤụỦủỨứỪừỬửỮữỰựỲỳỴỵỶỷỸỹ'
    s0 = u'AAAAEEEIIOOOOUUYaaaaeeeiihooouuyAaDdIiUuOoUuAaAaAaAaAaAaAaAaAaAaAaAaEeEeEeEeEeEeEeEeIiIiOoOoOoOoOoOoOoOoOoOoOoOoUuUuUuUuUuUuUuYyYyYyYy'
    s = ""
    for c in input_str:
        if c in s1:
            s += s0[s1.index(c)]
        else:
            s += c
    return s

def parse_duration_days(duration_str):
    if not isinstance(duration_str, str) or pd.isna(duration_str) or not duration_str.strip():
        return 0
    clean_str = duration_str.lower()
    
    # Check pattern: X ngày
    match = re.search(r'(\d+)\s*ngày', clean_str)
    if match:
        return int(match.group(1))
        
    # Check pattern: Xn (e.g. 3n2đ)
    match_short = re.search(r'(\d+)\s*n', clean_str)
    if match_short:
        return int(match_short.group(1))
        
    if 'trong ngày' in clean_str or '1 ngày' in clean_str:
        return 1
        
    # Check for any digits
    match_num = re.search(r'\d+', clean_str)
    if match_num:
        return int(match_num.group(0))
        
    return 3  # default fallback

def categorize_price(price):
    if pd.isna(price) or price <= 0:
        return 'Giá rẻ'
    if price <= 4000000:
        return 'Giá rẻ'
    elif price <= 15000000:
        return 'Giá trung bình'
    else:
        return 'Giá cao'

def load_models_and_data():
    global vectorizer, classifier, df_tours, tours_tfidf
    
    print("--- Loading ML Classifier and Tours Database ---")
    if not os.path.exists(vectorizer_path) or not os.path.exists(classifier_path):
        raise FileNotFoundError("Classifier assets not found! Please run train.py first to train the model.")

    with open(vectorizer_path, "rb") as f:
        vectorizer = pickle.load(f)
    with open(classifier_path, "rb") as f:
        classifier = pickle.load(f)

    # Load tours CSV
    df_tours = pd.read_csv(csv_path, encoding="utf-8")
    
    # Map CSV tours to their actual database IDs by matching tour_url
    try:
        import mysql.connector
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="113004",
            database="tour_db"
        )
        cursor = conn.cursor()
        cursor.execute("SELECT id, tour_url FROM tours")
        db_mappings = {url.strip(): db_id for db_id, url in cursor.fetchall() if url}
        conn.close()
        
        mapped_ids = []
        unmapped_count = 0
        for idx, row in df_tours.iterrows():
            url = str(row.get("tour_url", "")).strip()
            if url in db_mappings:
                mapped_ids.append(db_mappings[url])
            else:
                mapped_ids.append(1000000 + idx)
                unmapped_count += 1
                
        df_tours["id"] = mapped_ids
        print(f"Mapped {len(df_tours) - unmapped_count} tour IDs from MySQL database! ({unmapped_count} fallbacks)")
    except Exception as e:
        print(f"Warning: Could not connect to MySQL to load real IDs ({e}). Using sequential indices.")
        df_tours["id"] = df_tours.index + 1
    
    # Fill NaN values in columns
    df_tours["title"] = df_tours["title"].fillna("")
    df_tours["description"] = df_tours["description"].fillna("")
    df_tours["location"] = df_tours["location"].fillna("")
    df_tours["category"] = df_tours["category"].fillna("")
    df_tours["tags"] = df_tours["tags"].fillna("")

    # Apply Feature Engineering
    df_tours["price_category"] = df_tours["price"].apply(categorize_price)
    df_tours["duration_days"] = df_tours["duration"].apply(parse_duration_days)

    # Combine text fields for semantic TF-IDF matching
    df_tours["combined"] = (
        df_tours["title"] + " " +
        df_tours["description"] + " " +
        df_tours["location"] + " " +
        df_tours["category"] + " " +
        df_tours["tags"]
    )

    # Pre-calculate TF-IDF vectors for all tours
    tours_tfidf = vectorizer.transform(df_tours["combined"])
    print(f"Loaded {len(df_tours)} tours, performed Feature Engineering, and pre-computed TF-IDF embeddings.")

def parse_filters_from_message(message):
    price_category = None
    max_duration = None
    
    clean_msg = message.lower()
    
    # 1. Parse price category
    if "giá rẻ" in clean_msg or "tiết kiệm" in clean_msg or "dưới 4 triệu" in clean_msg or "dưới 3 triệu" in clean_msg or "dưới 2 triệu" in clean_msg:
        price_category = "Giá rẻ"
    elif "giá trung bình" in clean_msg or "bình dân" in clean_msg or "tầm trung" in clean_msg or "dưới 15 triệu" in clean_msg or "dưới 10 triệu" in clean_msg:
        price_category = "Giá trung bình"
    elif "giá cao" in clean_msg or "sang chảnh" in clean_msg or "cao cấp" in clean_msg or "luxury" in clean_msg or "trên 15 triệu" in clean_msg:
        price_category = "Giá cao"
        
    # 2. Parse duration days (e.g. 3 ngày, 3n, 5 ngày, 5n)
    duration_match = re.search(r'(\d+)\s*(ngày|n\b)', clean_msg)
    if duration_match:
        max_duration = int(duration_match.group(1))
    elif "ngắn ngày" in clean_msg:
        max_duration = 3
    elif "dài ngày" in clean_msg:
        max_duration = 15
        
    return price_category, max_duration

def parse_budget_and_people(message):
    clean_msg = message.lower()
    
    # 1. Parse number of people (e.g. 4 người, nhóm 5 người, đoàn 10 khách)
    num_people = 1
    people_match = re.search(r'(\d+)\s*(người|khách|pax|thành viên|khac\b)', clean_msg)
    if people_match:
        num_people = int(people_match.group(1))
        
    # 2. Parse total budget
    total_budget = None
    
    # Match pattern: 5.5 triệu, 5 triệu, 5tr, 5 tr
    trieu_match = re.search(r'(\d+[\.,]\d+|\d+)\s*(triệu|tr\b)', clean_msg)
    if trieu_match:
        val_str = trieu_match.group(1).replace(',', '.')
        total_budget = float(val_str) * 1000000
    else:
        # Match pattern: 500k, 1500k
        k_match = re.search(r'(\d+)\s*k\b', clean_msg)
        if k_match:
            total_budget = float(k_match.group(1)) * 1000
        else:
            # Match pattern: raw numbers like 5000000 or 5.000.000
            raw_match = re.search(r'(\d+[\.,\d]*\d+)', clean_msg)
            if raw_match:
                cleaned_num = re.sub(r'[\.,]', '', raw_match.group(1))
                val = float(cleaned_num)
                # Reasonable minimum for tour budget in VND is 100k
                if val >= 100000:
                    total_budget = val
                    
    budget_per_person = None
    if total_budget:
        budget_per_person = total_budget / num_people
        
    return total_budget, num_people, budget_per_person

def recommend(query, price_category=None, max_duration=None, location=None, category=None, 
              budget_per_person=None, num_people=1, limit=4):
    global vectorizer, classifier, df_tours, tours_tfidf
    
    if vectorizer is None:
        load_models_and_data()

    # Start with all tours
    filtered_df = df_tours.copy()
    
    # Clean query text of numeric budget expressions before similarity checking
    semantic_query = ""
    if query and query.strip():
        semantic_query = query.lower()
        # Remove patterns like "5 triệu", "5tr", "500k", "4 người", etc.
        semantic_query = re.sub(r'\d+\s*(triệu|tr\b|k\b|người|khách|pax|thành viên)', '', semantic_query)
        # Remove connecting patterns like "có ...", "dưới ..."
        semantic_query = re.sub(r'\b(có|dưới|cho|tầm|khoảng)\s*$', '', semantic_query)
        semantic_query = semantic_query.strip()

    # Rank using similarities if semantic query is present
    predicted_intent = "Khác"
    if semantic_query and len(semantic_query) > 2:
        query_vec = vectorizer.transform([semantic_query])
        
        # Predict location intent using classifier
        predicted_intent = classifier.predict(query_vec)[0]
        
        # Cross-check if the query actually mentions the predicted location
        # If not, override predicted location to "Khác" to search globally.
        if predicted_intent != "Khác":
            query_flat = remove_accents(query.lower()).replace(" ", "")
            loc_flat = remove_accents(predicted_intent.lower()).replace(" ", "")
            
            # Special standardization check
            is_mentioned = False
            if loc_flat in query_flat:
                is_mentioned = True
            elif loc_flat == "sapa" and "sapa" in query_flat:
                is_mentioned = True
                
            if not is_mentioned:
                safe_pred = predicted_intent.encode('ascii', errors='ignore').decode()
                safe_q = query.encode('ascii', errors='ignore').decode()
                print(f"Override predicted intent '{safe_pred}' to 'Khác' (location name not found in query '{safe_q}')")
                predicted_intent = "Khác"
        
        # Calculate cosine similarity with all precomputed tour TF-IDFs
        similarities = cosine_similarity(query_vec, tours_tfidf)[0]
        filtered_df["similarity"] = similarities
        
        # Filter by predicted location if it matches a location in our dataset
        if predicted_intent != "Khác" and predicted_intent in df_tours["location"].unique():
            filtered_df = filtered_df[filtered_df["location"] == predicted_intent]
    else:
        filtered_df["similarity"] = 1.0

    # Apply explicit filters (which can override predicted location)
    if location:
        filtered_df = filtered_df[filtered_df["location"].str.lower() == location.lower()]

    if category:
        filtered_df = filtered_df[filtered_df["category"].str.lower() == category.lower()]

    # Remember filtered state before applying price/budget and duration (for relaxation fallback)
    fallback_df = filtered_df.copy()

    # Apply budget filter if specified (price per person <= budget_per_person)
    if budget_per_person is not None:
        # Include positive priced tours within the budget
        budget_filtered = filtered_df[(filtered_df["price"] > 0) & (filtered_df["price"] <= budget_per_person)]
        if not budget_filtered.empty:
            filtered_df = budget_filtered
        else:
            # Revert to fallback but sort by cheapest
            print(f"Warning: No tours under budget {budget_per_person}. Sorting by price ascending.")
            filtered_df = filtered_df[filtered_df["price"] > 0].sort_values(by="price", ascending=True)

    # Apply price category filter (if budget_per_person was not specified, to avoid overriding)
    if price_category and budget_per_person is None:
        filtered_df = filtered_df[filtered_df["price_category"] == price_category]

    # Apply duration filter
    if max_duration is not None:
        try:
            max_days = int(max_duration)
            filtered_df = filtered_df[filtered_df["duration_days"] <= max_days]
        except ValueError:
            pass

    # Fallback relaxation if no matching tours remain
    if filtered_df.empty:
        print("Warning: Strict filters returned 0 tours. Relaxing price/duration criteria.")
        filtered_df = fallback_df

    # Sort by similarity descending, then by price descending (recommends premium affordables if no keywords matched)
    filtered_df = filtered_df.sort_values(by=["similarity", "price"], ascending=[False, False])

    # Format recommendations
    top_k = min(limit, len(filtered_df))
    recommended_tours = []
    
    for idx in range(top_k):
        row = filtered_df.iloc[idx]
        recommended_tours.append({
            "id": int(row["id"]),
            "title": str(row["title"]),
            "price": int(row["price"]),
            "priceCategory": str(row["price_category"]),
            "duration": str(row["duration"]),
            "durationDays": int(row["duration_days"]),
            "location": str(row["location"]),
            "category": str(row["category"]),
            "imageUrl": str(row["image_url"]),
            "tourUrl": str(row["tour_url"]),
            "similarity": float(row["similarity"])
        })

    return recommended_tours, predicted_intent

@app.route("/api/chat", methods=["POST"])
def chat():
    global vectorizer
    
    # Lazy load if not initialized
    if vectorizer is None:
        try:
            load_models_and_data()
        except Exception as e:
            return jsonify({"response": f"Lỗi hệ thống khởi tạo model: {str(e)}", "tours": []}), 500

    data = request.json
    user_message = data.get("message", "").strip()
    
    if not user_message:
        return jsonify({"response": "Hãy nhập tin nhắn câu hỏi của bạn.", "tours": []})

    try:
        # Parse query-based filters dynamically from natural language
        parsed_price_cat, parsed_duration = parse_filters_from_message(user_message)
        total_budget, num_people, budget_per_person = parse_budget_and_people(user_message)
        
        # Get recommendations
        recommended_tours, pred_label = recommend(
            query=user_message,
            price_category=parsed_price_cat,
            max_duration=parsed_duration,
            budget_per_person=budget_per_person,
            num_people=num_people,
            limit=4
        )

        # Print safely to console to avoid charmap codec exceptions on Windows terminals
        safe_msg = user_message.encode('ascii', errors='ignore').decode()
        safe_label = pred_label.encode('ascii', errors='ignore').decode()
        safe_price = str(parsed_price_cat).encode('ascii', errors='ignore').decode()
        safe_budget = str(budget_per_person).encode('ascii', errors='ignore').decode()
        print(f"Chat: '{safe_msg}' -> Intent: '{safe_label}' (Filters: price={safe_price}, budget={safe_budget}, duration={parsed_duration})")

        # Formulate Response text
        filter_notices = []
        if budget_per_person:
            if num_people > 1:
                filter_notices.append(f"ngân sách {budget_per_person:,.0f}đ/người (tổng {total_budget:,.0f}đ cho {num_people} người)")
            else:
                filter_notices.append(f"ngân sách dưới {budget_per_person:,.0f}đ")
        elif parsed_price_cat:
            filter_notices.append(f"khoảng giá: {parsed_price_cat.lower()}")
            
        if parsed_duration:
            filter_notices.append(f"thời lượng tối đa: {parsed_duration} ngày")
            
        filter_desc = " + ".join(filter_notices)
        filter_suffix = ""

        if pred_label == "Khác":
            if budget_per_person:
                response_text = f"Dựa trên mức ngân sách của bạn{filter_suffix}, tôi xin đề xuất các tour du lịch có mức giá tốt nhất và phù hợp nhất dành cho bạn:"
            else:
                response_text = f"Tôi đã tìm kiếm các hành trình du lịch phù hợp nhất với mô tả của bạn{filter_suffix}. Hãy tham khảo các gợi ý tour dưới đây:"
        else:
            response_text = f"Tôi nhận thấy bạn đang muốn tìm hiểu du lịch tại **{pred_label}**{filter_suffix}. Dưới đây là danh sách {len(recommended_tours)} tour nổi bật hàng đầu phù hợp với bạn:"

        return jsonify({
            "response": response_text,
            "intent": pred_label,
            "tours": recommended_tours
        })

    except Exception as e:
        print(f"Error handling chat recommendation: {e}")
        return jsonify({"response": f"Xin lỗi, đã xảy ra lỗi trong quá trình xử lý: {str(e)}", "tours": []}), 500

@app.route("/api/recommend", methods=["POST"])
def recommend_endpoint():
    global vectorizer
    
    # Lazy load if not initialized
    if vectorizer is None:
        try:
            load_models_and_data()
        except Exception as e:
            return jsonify({"error": f"Lỗi hệ thống: {str(e)}"}), 500

    data = request.json or {}
    query = data.get("query", "").strip()
    price_category = data.get("price_category") # 'Giá rẻ', 'Giá trung bình', 'Giá cao'
    max_duration = data.get("max_duration") # integer or None
    location = data.get("location")
    category = data.get("category") # 'Trong nước', 'Nước ngoài'
    budget_per_person = data.get("budget_per_person") # float/int or None
    num_people = data.get("num_people", 1)
    limit = data.get("limit", 4)

    try:
        recommended_tours, pred_label = recommend(
            query=query,
            price_category=price_category,
            max_duration=max_duration,
            location=location,
            category=category,
            budget_per_person=budget_per_person,
            num_people=num_people,
            limit=limit
        )
        return jsonify({
            "query": query,
            "predicted_intent": pred_label,
            "tours": recommended_tours
        })
    except Exception as e:
        print(f"Error handling recommendation endpoint: {e}")
        return jsonify({"error": f"Lỗi xử lý gợi ý: {str(e)}"}), 500

# Templates for generating AI itineraries based on popular destinations
ITINERARY_TEMPLATES = {
    "phu quoc": [
        "Ngày 1: Di chuyển đến Phú Quốc, check-in resort nghỉ ngơi. Chiều check-in Địa Trung Hải, Sunset Town. Tối dạo Chợ đêm Vui Phết và xem pháo hoa.",
        "Ngày 2: Cano đi tour 4 đảo Nam Đảo (Hòn Thơm, Hòn Mây Rút, Hòn Móng Tay). Trải nghiệm cáp treo Hòn Thơm và lặn ngắm san hô.",
        "Ngày 3: Khám phá Bắc Đảo: Tham quan Vinpearl Safari (vườn thú bán hoang dã) và Grand World - Thành phố không ngủ.",
        "Ngày 4: Tham quan di tích Nhà tù Phú Quốc, Nhà thùng nước mắm truyền thống, tắm biển tại Bãi Sao.",
        "Ngày 5: Thưởng thức bữa sáng, mua sắm tiêu Phú Quốc, ngọc trai làm quà, dạo Dinh Cậu rồi ra sân bay check-out."
    ],
    "da lat": [
        "Ngày 1: Check-in homestay Đà Lạt. Chiều ghé Quảng trường Lâm Viên ngắm hồ Xuân Hương. Tối thưởng thức sữa đậu nành, bánh tráng nướng chợ đêm.",
        "Ngày 2: Săn mây sớm tại Đồi chè Cầu Đất. Trưa check-in Chùa Linh Phước. Chiều ghé Ga Đà Lạt và Vườn hoa thành phố.",
        "Ngày 3: Vui chơi máng trượt tại Thác Datanla. Ghé hồ Tuyền Lâm, Thiền Viện Trúc Lâm và ngắm hoàng hôn đồi cỏ hồng.",
        "Ngày 4: Chinh phục đỉnh núi Langbiang huyền thoại. Chiều tham quan Thung lũng Tình Yêu hoặc KDL Thung Lũng Vàng.",
        "Ngày 5: Ghé Dinh Bảo Đại, check-in nhà thờ Domaine de Marie, mua sắm hồng treo gió tại chợ Đà Lạt rồi ra về."
    ],
    "sapa": [
        "Ngày 1: Đến thị trấn Sapa. Đi bộ xuống tham quan Bản Cát Cát, tìm hiểu văn hóa H'Mông. Tối ghé chợ tình Sapa.",
        "Ngày 2: Chinh phục đỉnh Fansipan bằng hệ thống cáp treo 3 dây hiện đại, viếng chùa trên mây cực kỳ linh thiêng.",
        "Ngày 3: Khám phá KDL núi Hàm Rồng, chụp hình vườn lan, ngắm toàn cảnh Sapa từ Sân Mây. Chiều check-in Nhà thờ đá.",
        "Ngày 4: Đi đèo Ô Quy Hồ săn mây hoàng hôn, tham quan Thác Bạc và Cổng Trời Sapa hùng vĩ.",
        "Ngày 5: Trekking thung lũng Mường Hoa, ngắm ruộng bậc thang bản Tả Van. Mua sắm thổ cẩm, tắm lá thuốc Dao Đỏ."
    ],
    "ha long": [
        "Ngày 1: Check-in bến tàu Hạ Long, lên du thuyền thưởng thức nước chào mừng. Chiều chèo kayak quanh hang Luồn.",
        "Ngày 2: Ngủ đêm trên vịnh, tập Tai Chi đón bình minh. Khám phá Động Sửng Sốt và tắm biển đảo Ti Tốp.",
        "Ngày 3: Tham quan đảo Tuần Châu. Vui chơi tại công viên rồng Sun World Dragon Park buổi chiều.",
        "Ngày 4: Đi cáp treo Nữ Hoàng ngắm toàn cảnh Vịnh, vui chơi đồi Mặt Trời và khu vườn Nhật.",
        "Ngày 5: Mua chả mực giã tay tại chợ Hạ Long, đi dạo bãi tắm Bãi Cháy, check-out du thuyền trở về."
    ],
    "ha giang": [
        "Ngày 1: Xuất phát đi Hà Giang, chụp ảnh cột mốc số 0. Chiều vượt dốc Bắc Sum, ngắm núi đôi Quản Bạ.",
        "Ngày 2: Đi dốc Thẩm Mã. Tham quan làng văn hóa Lũng Cẩm (Nhà của Pao) và Dinh thự Vua Mèo Vương Chính Đức.",
        "Ngày 3: Check-in Cột cờ Lũng Cú cực Bắc. Chiều chinh phục đèo Mã Pí Lèng, đi thuyền trên sông Nho Quế.",
        "Ngày 4: Khám phá kiến trúc cổ phố cổ Đồng Văn, ghé chợ phiên. Nghỉ ngơi thưởng thức rượu ngô bản địa.",
        "Ngày 5: Di chuyển về Hà Giang. Đi qua con đường chữ M tuyệt đẹp, mua trà cổ thụ Shan Tuyết làm quà rồi về."
    ],
    "nha trang": [
        "Ngày 1: Check-in Nha Trang. Chiều tắm biển bãi dài Trần Phú. Tối dạo chợ đêm Nha Trang ăn hải sản tươi sống.",
        "Ngày 2: Tham quan Tháp Bà Ponagar, tắm bùn khoáng nóng phục hồi sức khỏe. Chiều ghé hòn Chồng.",
        "Ngày 3: Đi cano tour 3 đảo (Hòn Tằm tắm bùn hoặc Bãi Tranh chơi phao nổi, Hòn Mun lặn ngắm san hô).",
        "Ngày 4: Vui chơi trọn ngày tại VinWonders Nha Trang (trải nghiệm cáp treo, các trò chơi cảm giác mạnh).",
        "Ngày 5: Ghé thăm Viện Hải dương học Nha Trang, mua sắm mực rim me chợ Đầm và check-out."
    ],
    "da nang": [
        "Ngày 1: Đến Đà Nẵng, check-in khách sạn. Chiều đi Bán đảo Sơn Trà (chùa Linh Ứng). Tối xem cầu Rồng phun lửa.",
        "Ngày 2: Khám phá Bà Nà Hills, đi cáp treo đạt kỷ lục thế giới, check-in Cầu Vàng nổi tiếng toàn cầu.",
        "Ngày 3: Tour Hội An - ghé Ngũ Hành Sơn buổi chiều, tối dạo phố cổ Hội An thả đèn hoa đăng lung linh.",
        "Ngày 4: Vui chơi tại công viên suối khoáng nóng Núi Thần Tài, tắm bùn, ngâm chân khoáng ấm nóng.",
        "Ngày 5: Tự do tắm biển Mỹ Khê, mua sắm đặc sản chả bò Đà Nẵng tại chợ Hàn rồi lên máy bay về."
    ],
    "mien tay": [
        "Ngày 1: Đi Bến Tre, tham quan KDL Cồn Phụng, đi xe lôi ngắm vườn dừa, nghe đờn ca tài tử Nam Bộ.",
        "Ngày 2: Đi Cần Thơ. Sáng sớm đi chợ nổi Cái Răng trải nghiệm ẩm thực sông nước. Chiều dạo bến Ninh Kiều.",
        "Ngày 3: Tham quan nhà cổ Bình Thủy. Khám phá khu du lịch sinh thái Mỹ Khánh, thưởng thức trái cây miệt vườn.",
        "Ngày 4: Đi An Giang viếng Miếu Bà Chúa Xứ Núi Sam Châu Đốc, đi xuồng ba lá len lỏi rừng tràm Trà Sư.",
        "Ngày 5: Mua đặc sản nem Lai Vung, bánh pía, kẹo dừa rồi di chuyển trở về kết thúc hành trình."
    ]
}

@app.route("/api/generate-itinerary", methods=["POST"])
def generate_itinerary():
    data = request.json or {}
    destination = data.get("destination", "").strip()
    days = data.get("days", 3)
    
    if not destination:
        return jsonify({"error": "Vui lòng cung cấp điểm đến."}), 400
        
    try:
        days = int(days)
        if days <= 0:
            days = 3
    except ValueError:
        days = 3
        
    # Standardize destination matching
    dest_flat = remove_accents(destination.lower()).replace(" ", "")
    matched_key = None
    
    for key in ITINERARY_TEMPLATES.keys():
        key_flat = remove_accents(key).replace(" ", "")
        if key_flat in dest_flat or dest_flat in key_flat:
            matched_key = key
            break
            
    itinerary = []
    if matched_key:
        template = ITINERARY_TEMPLATES[matched_key]
        for i in range(days):
            if i < len(template):
                itinerary.append(template[i])
            else:
                # Pad if days requested is greater than template size
                day_num = i + 1
                itinerary.append(f"Ngày {day_num}: Tự do khám phá thêm các điểm danh thắng ẩn tại {destination}, dạo phố và thưởng thức ẩm thực đường phố.")
    else:
        # Generate generic itinerary if destination is not in pre-defined templates
        for i in range(days):
            day_num = i + 1
            if day_num == 1:
                itinerary.append(f"Ngày 1: Di chuyển đến {destination}, check-in khách sạn, tự do nghỉ ngơi và dạo chơi ngắm cảnh hoàng hôn tại địa điểm trung tâm.")
            elif day_num == days:
                itinerary.append(f"Ngày {day_num}: Thưởng thức điểm tâm sáng, mua sắm đồ lưu niệm đặc sản làm quà tại chợ địa phương và chuẩn bị check-out hành trình.")
            else:
                itinerary.append(f"Ngày {day_num}: Khám phá danh lam thắng cảnh tiêu biểu nhất tại {destination}. Tham gia tour trải nghiệm văn hóa ẩm thực và chụp hình lưu niệm.")
                
    return jsonify({
        "destination": destination,
        "days": days,
        "itinerary": itinerary
    })

if __name__ == "__main__":
    # Perform startup load validation
    try:
        load_models_and_data()
    except Exception as e:
        print(f"Startup warning: Models not trained yet or CSV missing. {e}")
        
    print("Starting Flask Chatbot AI recommendations server on port 5000...")
    app.run(host="0.0.0.0", port=5000, debug=False)
