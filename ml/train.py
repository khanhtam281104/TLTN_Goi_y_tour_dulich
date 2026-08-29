import os
import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

# Ensure directories exist
os.makedirs("ml/metrics", exist_ok=True)
os.makedirs("ml/models", exist_ok=True)

print("--- [1] Loading dataset & Generating Labeled Queries ---")
# Try loading tours database to extract locations
try:
    df_tours = pd.read_csv("tours.csv", encoding="utf-8")
    locations = df_tours["location"].dropna().unique().tolist()
    print(f"Found {len(locations)} unique locations in database: {[loc.encode('ascii', 'ignore').decode() for loc in locations]}")
except Exception as e:
    print(f"Error loading tours.csv: {e}")
    locations = ["Phú Quốc", "Đà Lạt", "Sapa", "Nha Trang", "Hạ Long", "Hà Giang", "Hà Nội", "Miền Tây", "Nước ngoài"]

# Predefined templates to generate query dataset matching classes
intent_templates = {
    "Phú Quốc": [
        "tôi muốn đi du lịch phú quốc", "tìm tour phú quốc 3 ngày 2 đêm", "tour phú quốc hè 2026 giá rẻ", 
        "đi đảo ngọc phú quốc ngắm san hô", "nghỉ dưỡng phú quốc grand world", "đặt tour đi phú quốc trọn gói",
        "phượt phú quốc tự túc", "giá vé đi phú quốc khứ hồi", "tour phú quốc từ sài gòn", "tour phú quốc khởi hành từ hà nội",
        "địa điểm check in phú quốc đẹp", "du lịch phú quốc vinwonders", "du lịch nam đảo phú quốc"
    ],
    "Đà Lạt": [
        "muốn đi đà lạt tránh nóng", "tour du lịch đà lạt 3 ngày 2 đêm", "homestay đà lạt view đồi thông",
        "đi ngắm hoa dã quỳ đà lạt", "tour thành phố ngàn hoa đà lạt", "check in hồ xuân hương đà lạt",
        "đi du lịch đà lạt giá tốt cho gia đình", "đà lạt 4 ngày 3 đêm", "phượt đà lạt lâm đồng bằng xe máy",
        "đặt tour đà lạt khởi hành ngày mai", "chụp hình sống ảo đà lạt", "tour cắm trại đèo gió đà lạt"
    ],
    "Sapa": [
        "tìm tour đi sapa lào cai", "du lịch sapa ngắm ruộng bậc thang mùa lúa chín", "chinh phục đỉnh fansipan sapa",
        "săn mây sapa tự túc", "tour sapa cát cát giá rẻ", "đi sapa bằng xe giường nằm", "sapa mùa đông có tuyết rơi không",
        "du lịch sapa 3 ngày trọn gói", "giá vé cáp treo sapa fansipan", "khách sạn sapa gần nhà thờ đá",
        "tour sapa khởi hành từ hà nội", "đi sapa cuối tuần", "tour du lịch sa pa", "muốn đi chơi sa pa"
    ],
    "Nha Trang": [
        "tour du lịch biển nha trang khánh hòa", "đi tắm biển nha trang ăn hải sản", "vé vinwonders nha trang giá rẻ",
        "tour đảo bình ba nha trang", "đi nha trang hòn tre nghỉ dưỡng", "du lịch nha trang 4 ngày 3 đêm",
        "tour lặn ngắm san hô nha trang hòn mun", "thuê cano tham quan vịnh nha trang", "tour nha trang giá tốt",
        "đi nha trang xe phòng nằm", "khách sạn nha trang gần biển trần phú"
    ],
    "Hạ Long": [
        "đặt tour du thuyền vịnh hạ long quảng ninh", "du lịch hạ long ngủ đêm trên tàu", "tour vịnh hạ long 2 ngày 1 đêm",
        "đi thăm động sửng sốt hạ long", "tour đảo tuần châu hạ long giá rẻ", "tour du lịch hạ long trọn gói",
        "chèo thuyền kayak vịnh hạ long", "ngắm cảnh vịnh hạ long từ trực thăng", "giá vé đi tàu thăm vịnh hạ long",
        "tour hạ long cát bà du thuyền 5 sao"
    ],
    "Hà Giang": [
        "tour phượt hà giang đồng văn cột cờ lũng cú", "du lịch hà giang mùa hoa tam giác mạch", "đi đèo mã pí lèng hà giang",
        "thuê xe máy tự lái hà giang loop", "tour hà giang hoàng su phì ngắm lúa chín", "du lịch đông bắc hà giang 3 ngày",
        "sông nho quế hà giang đi thuyền hẻm tu sản", "tour hà giang từ tphcm bay hà nội", "đi hà giang ngắm mùa hoa cải"
    ],
    "Hà Nội": [
        "tour tham quan thủ đô hà nội 1 ngày", "du lịch hà nội viếng lăng bác hồ", "city tour hà nội ngắm hồ gươm",
        "tour xem múa rối nước hà nội", "du lịch khám phá ẩm thực hà nội cổ", "tour hà nội hoa sơn trà",
        "check in cầu thê húc hà nội", "tour hà nội lăng bác văn miếu"
    ],
    "Miền Tây": [
        "tour du lịch miền tây sông nước cần thơ bến tre", "đi chợ nổi cái răng cần thơ ngắm bình minh",
        "tour miền tây 2 ngày 1 đêm giá rẻ", "du lịch bến tre ăn trái cây miệt vườn", "tour du lịch lục tỉnh miền tây",
        "nghe đờn ca tài tử miền tây", "tour đi rừng tràm trà sư an giang", "đi du lịch cồn phụng bến tre"
    ],
    "Nước ngoài": [
        "tour du lịch nước ngoài giá tốt", "tour đi thái lan bangkok pattaya giá rẻ", "tour hàn quốc ngắm hoa anh đào",
        "tour nhật bản mùa lá đỏ", "du lịch châu âu pháp đức ý", "tour hành hương ấn độ nepal tứ động tâm",
        "du lịch singapore malaysia trọn gói", "tour du lịch dubai 6 ngày", "đi trung quốc vạn lý trường thành"
    ],
    "Khác": [
        "tư vấn cho tôi đi tour tâm linh", "tìm tour giá rẻ dã ngoại", "tour du lịch ngắn ngày nghỉ cuối tuần",
        "hướng dẫn đặt tour và thanh toán", "hệ thống gợi ý những tour nào tốt nhất", "muốn đi tour leo núi phiêu lưu",
        "công ty du lịch việt có ưu đãi gì", "muốn đặt tour đoàn công ty nghỉ mát", "tour teambuilding bãi biển"
    ]
}

# Programmatically generate templates for other unique locations found in the CSV
for loc in locations:
    if pd.isna(loc):
        continue
    # Standardize Sa Pa -> Sapa in list mapping check
    loc_key = "Sapa" if loc == "Sa Pa" else loc
    if loc_key not in intent_templates and loc_key != "Khác":
        intent_templates[loc_key] = [
            f"tôi muốn đi du lịch {loc_key.lower()}",
            f"tìm tour {loc_key.lower()} trọn gói",
            f"tour {loc_key.lower()} giá rẻ hè 2026",
            f"đặt tour đi {loc_key.lower()} giá tốt",
            f"du lịch {loc_key.lower()} tự túc",
            f"tư vấn đi {loc_key.lower()}",
            f"chuyến đi {loc_key.lower()} cùng gia đình",
            f"tour {loc_key.lower()} cuối tuần",
            f"đi tour {loc_key.lower()}"
        ]

# Generate query dataset
data = []
for label, queries in intent_templates.items():
    for q in queries:
        # Augment with basic variations
        data.append({"query": q, "label": label})
        data.append({"query": q.upper(), "label": label})
        data.append({"query": q.capitalize(), "label": label})
        # Add basic suffix words
        data.append({"query": f"{q} giá rẻ", "label": label})
        data.append({"query": f"{q} trọn gói", "label": label})
        data.append({"query": f"tư vấn {q}", "label": label})

df_synthetic = pd.DataFrame(data)

# Create a separate list of realistic test queries containing typos, no accents, and informal chats
realistic_test_queries = [
    # Phú Quốc
    ("di du lich phu quoc can chuẩn bị gi", "Phú Quốc"),
    ("tour phu quoc 3 ngay 2 dem gia re", "Phú Quốc"),
    ("dao ngoc phú quốc resort 5 sao", "Phú Quốc"),
    ("di ngam san ho o phu quoc", "Phú Quốc"),
    ("vinwonders phu quoc co gi choi", "Phú Quốc"),
    
    # Sapa
    ("tư vấn di sapa bang xe giuong nam", "Sapa"),
    ("muon di ngam tuyet roi sa pa", "Sapa"),
    ("chinh phục fansipan sapa 2 ngày 1 đêm", "Sapa"),
    ("di sapa mùa nao dep nhat", "Sapa"),
    
    # Hà Giang
    ("phuot ha giang bang xe may tu lai", "Hà Giang"),
    ("tour ha giang hoa tam giac mach", "Hà Giang"),
    ("di thuyen tren song nho que", "Hà Giang"),
    ("cot co lung cu ha giang", "Hà Giang"),
    
    # Đà Lạt
    ("di choi da lat voi nguoi yeu", "Đà Lạt"),
    ("homestay dalat view doi thong", "Đà Lạt"),
    ("tour da lat 3n2d gia tot", "Đà Lạt"),
    ("check in ho xuan huong dalat", "Đà Lạt"),
    
    # Nha Trang
    ("di tam bien nha trang khanh hoa", "Nha Trang"),
    ("tour dao binh ba nha trag an hai san", "Nha Trang"),
    ("ve vinpearlland nha trang gia re", "Nha Trang"),
    
    # Hạ Long
    ("dat tour du thuyen vinh ha long 2n1d", "Hạ Long"),
    ("cheo kayak ngu dem tren thuyen ha long", "Hạ Long"),
    ("tour dao tuan chau quang ninh", "Hạ Long"),
    
    # Đà Nẵng
    ("tour ba na hills da nang gia re", "Đà Nẵng"),
    ("du lich da nang hoi an 4n3d", "Đà Nẵng"),
    ("check in cau vang da nang", "Đà Nẵng"),
    
    # Quy Nhơn
    ("tour quy nhon eo gio ky co", "Quy Nhơn"),
    ("di du lich quy nhon tu tuc", "Quy Nhơn"),
    
    # Phú Yên
    ("tour phu yen ghenh da dia", "Phú Yên"),
    ("di du lich phú yên hoa vang tren co xanh", "Phú Yên"),
    
    # Hà Nội
    ("city tour ha noi xem mua roi nuoc", "Hà Nội"),
    ("vieng lang bac ho chu nhat", "Hà Nội"),
    ("di an uong pho co ha noi", "Hà Nội"),
    
    # Ninh Bình
    ("tour trang an bai dinh ninh binh", "Ninh Bình"),
    ("di thuyen hang mua ninh binh", "Ninh Bình"),
    
    # Miền Tây
    ("tour mien tay song nuoc an trai cay", "Miền Tây"),
    ("cho noi cai rang can tho di sang som", "Miền Tây"),
    ("tour mien tay 2 ngay 1 dem", "Miền Tây"),
    
    # Nước ngoài
    ("tour di thai lan 5 ngày 4 đêm", "Nước ngoài"),
    ("di du lich han quoc ngam hoa anh dao", "Nước ngoài"),
    ("du lich nhat ban mua la do", "Nước ngoài"),
    ("tour singapore malaysia tron goi", "Nước ngoài"),
    
    # Khác
    ("tu van dat tour va thanh toan momo", "Khác"),
    ("tour teambuilding bai bien cho cong ty", "Khác"),
    ("di leo nui trekking o dau dep", "Khác"),
    ("muon di nghi duong ngan ngay cuoi tuan", "Khác")
]
df_realistic = pd.DataFrame(realistic_test_queries, columns=["query", "label"])

# Split synthetic queries into training (85%) and testing fraction (15%)
df_train_fraction, df_test_fraction = train_test_split(df_synthetic, test_size=0.15, random_state=42, stratify=df_synthetic["label"])

# Combine the realistic test queries and the synthetic testing fraction to create df_test
df_train = df_train_fraction
df_test = pd.concat([df_realistic, df_test_fraction], ignore_index=True)

print(f"Generated {len(df_train)} training queries.")
print(f"Generated {len(df_test)} test queries (including {len(df_realistic)} realistic noisy queries).")

# Collect text representation of all tours in database to build a complete vocabulary
tours_texts = []
if 'df_tours' in locals():
    # Fill NaN values in columns
    df_tours["title"] = df_tours["title"].fillna("")
    df_tours["description"] = df_tours["description"].fillna("")
    df_tours["location"] = df_tours["location"].fillna("")
    df_tours["category"] = df_tours["category"].fillna("")
    df_tours["tags"] = df_tours["tags"].fillna("")

    df_tours["combined"] = (
        df_tours["title"] + " " +
        df_tours["description"] + " " +
        df_tours["location"] + " " +
        df_tours["category"] + " " +
        df_tours["tags"]
    )
    tours_texts = df_tours["combined"].tolist()
    print(f"Prepared {len(tours_texts)} tour text documents to enrich TF-IDF vocabulary.")

# Text Vectorization using TF-IDF
# Fit on the combined set of training queries AND all tour descriptions to learn a comprehensive vocabulary
vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=2)
all_texts_for_vocab = pd.concat([df_train["query"], pd.Series(tours_texts)], ignore_index=True)
vectorizer.fit(all_texts_for_vocab)

print(f"TF-IDF Vectorizer vocabulary size: {len(vectorizer.vocabulary_)} terms.")

# Transform training and testing queries to vectors
X_train = vectorizer.transform(df_train["query"])
y_train = df_train["label"]

X_test = vectorizer.transform(df_test["query"])
y_test = df_test["label"]

print("\n--- [2] Training MLP Classifier (Neural Network Model) ---")
model = MLPClassifier(
    hidden_layer_sizes=(128, 64),
    activation="relu",
    solver="adam",
    alpha=0.0001,
    learning_rate_init=0.01,
    max_iter=100,
    random_state=42,
    verbose=True
)

# Fit model
model.fit(X_train, y_train)

# Predict on realistic test set
y_pred = model.predict(X_test)

# Calculate Evaluation Metrics
accuracy = accuracy_score(y_test, y_pred)
report = classification_report(y_test, y_pred)

print("\n--- [3] Training Completed. Evaluation Metrics ---")
print(f"Accuracy: {accuracy * 100:.2f}%")
with open("ml/metrics/evaluation_report.txt", "w", encoding="utf-8") as f:
    f.write(f"Accuracy: {accuracy * 100:.2f}%\n\n")
    f.write("Classification Report:\n")
    f.write(report)
print("Saved classification report details to: ml/metrics/evaluation_report.txt")

# Plot Loss Curve
plt.figure(figsize=(8, 5))
plt.plot(model.loss_curve_, color="#c00d7f", lw=2, label="Training Loss")
plt.title("MLP Classifier - Loss Curve (Đường cong huấn luyện)", fontsize=12, fontweight="bold", pad=15)
plt.xlabel("Epochs / Iterations", fontsize=10)
plt.ylabel("Loss value", fontsize=10)
plt.grid(True, linestyle="--", alpha=0.6)
plt.legend()
plt.tight_layout()
plt.savefig("ml/metrics/training_curve.png", dpi=150)
plt.close()
print("Saved loss curve plot to: ml/metrics/training_curve.png")

# Plot Confusion Matrix
classes = np.unique(y_test)
cm = confusion_matrix(y_test, y_pred, labels=classes)

plt.figure(figsize=(12, 10))
plt.imshow(cm, interpolation='nearest', cmap=plt.cm.RdPu)
plt.title("Confusion Matrix (Ma trận nhầm lẫn)", fontsize=14, fontweight="bold", pad=15)
plt.colorbar()
tick_marks = np.arange(len(classes))
plt.xticks(tick_marks, classes, rotation=45, ha="right", fontsize=9)
plt.yticks(tick_marks, classes, fontsize=9)

# Print numbers in matrix squares
thresh = cm.max() / 2.
for i in range(cm.shape[0]):
    for j in range(cm.shape[1]):
        plt.text(j, i, format(cm[i, j], 'd'),
                 horizontalalignment="center",
                 color="white" if cm[i, j] > thresh else "black",
                 fontsize=9, fontweight="bold")

plt.ylabel('True labels (Thực tế)', fontsize=11, fontweight="bold")
plt.xlabel('Predicted labels (Dự đoán)', fontsize=11, fontweight="bold")
plt.tight_layout()
plt.savefig("ml/metrics/confusion_matrix.png", dpi=150)
plt.close()
print("Saved confusion matrix plot to: ml/metrics/confusion_matrix.png")

# Save TF-IDF Vectorizer and trained model parameters using pickle
with open("ml/models/tfidf_vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)
with open("ml/models/intent_classifier.pkl", "wb") as f:
    pickle.dump(model, f)

print("\nSaved trained model assets successfully under ml/models/")
print("Validation metrics generation process finished.")
