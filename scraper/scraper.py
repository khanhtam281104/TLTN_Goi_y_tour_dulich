import os
import re
import time
import json
import requests
import datetime
import argparse
import pandas as pd
from bs4 import BeautifulSoup

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
    'Referer': 'https://www.google.com/',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
}

def robust_get(url, headers=HEADERS, timeout=15):
    res = None
    for attempt in range(4):
        try:
            res = requests.get(url, headers=headers, timeout=timeout)
            if res.status_code == 200:
                return res
            elif res.status_code == 429:
                delay = 8 + attempt * 12
                print(f"\n[Rate Limit] Got 429 for {url}. Waiting {delay}s before retry...")
                time.sleep(delay)
            else:
                return res
        except Exception as e:
            if attempt == 3:
                raise e
            time.sleep(3)
    return res


def extract_duration(name):
    # Match patterns like "3N2Đ", "6N5Đ", "1N", "3 ngày 2 đêm", etc.
    match = re.search(r'(\d+N\d+Đ|\d+N|\d+\s*ngày\s*\d+\s*đêm|\d+\s*ngày)', name, re.IGNORECASE)
    if match:
        val = match.group(1).upper()
        return val
    return "N/A"

def extract_location(name):
    # Common tourist destinations in Vietnam
    locations = [
        "Phú Quốc", "Hạ Long", "Hà Giang", "Đà Nẵng", "Sapa", "Hà Nội", "Ninh Bình", 
        "Tây Ninh", "Miền Tây", "Đông Bắc", "Côn Đảo", "Đà Lạt", "Nha Trang", "Huế", 
        "Hội An", "Phú Yên", "Quy Nhơn", "Quảng Bình", "Mộc Châu", "Điện Biên", "Cà Mau",
        "Bến Tre", "Mỹ Tho", "Cần Thơ", "Sóc Trăng", "Bạc Liêu", "Châu Đốc"
    ]
    for loc in locations:
        if loc.lower() in name.lower():
            return loc
    # Fallback to general classification
    if "miền bắc" in name.lower() or "đông bắc" in name.lower() or "tây bắc" in name.lower():
        return "Miền Bắc"
    if "miền trung" in name.lower() or "tây nguyên" in name.lower():
        return "Miền Trung"
    if "miền nam" in name.lower() or "miền tây" in name.lower():
        return "Miền Nam"
    return "Khác"

def generate_tags(title, location, category):
    tags = []
    # Thêm tag danh mục
    if category:
        tags.append("trong nuoc" if category == "Trong nước" else "nuoc ngoai")
    
    # Thêm tag địa điểm
    if location and location != "Khác":
        loc_clean = location.lower()
        tags.append(loc_clean)
        
        # Phân loại vùng miền / đặc trưng địa hình để gắn tag tự động
        beach_dests = ["phú quốc", "nha trang", "đà nẵng", "quy nhơn", "phú yên", "vũng tàu", "mũi né", "côn đảo", "hạ long"]
        mountain_dests = ["sapa", "hà giang", "mộc châu", "điện biên", "đông bắc", "tây bắc", "đà lạt"]
        delta_dests = ["miền tây", "bến tre", "mỹ tho", "cần thơ", "sóc trăng", "bạc liêu", "châu đốc", "cà mau"]
        
        if any(bd in loc_clean for bd in beach_dests):
            tags.extend(["bien", "dao", "nghi duong", "hai san", "tam bien"])
        elif any(md in loc_clean for md in mountain_dests):
            tags.extend(["nui", "phuot", "phong canh", "kham pha", "van hoa", "tay bac"])
        elif any(dd in loc_clean for dd in delta_dests):
            tags.extend(["song nuoc", "mien tay", "sinh thai", "trai cay", "cho noi"])
            
    # Phân tích từ khóa từ tiêu đề tour
    keywords = {
        "resort": "nghi duong",
        "biển": "bien",
        "đảo": "dao",
        "du thuyền": "du thuyen",
        "hè": "mua he",
        "khuyến mãi": "khuyen mai",
        "giá rẻ": "gia re",
        "báy bay": "may bay",
        "máy bay": "may bay",
        "tết": "le hoi",
        "lễ": "le hoi",
        "trọn gói": "tron goi",
        "cao cấp": "luxury",
        "5 sao": "5sao",
        "4 sao": "4sao",
        "phượt": "phuot",
        "cáp treo": "kham pha",
        "hang động": "kham pha",
        "di sản": "van hoa",
    }
    for kw, tag in keywords.items():
        if kw in title.lower():
            if tag not in tags:
                tags.append(tag)
                
    # Loại bỏ trùng lặp và nối chuỗi
    unique_tags = []
    for t in tags:
        if t not in unique_tags:
            unique_tags.append(t)
            
    return ", ".join(unique_tags)

def fetch_tour_details(tour_url):
    details = {
        'description': '',
        'departure_dates': ''
    }
    if not tour_url:
        return details
    if tour_url.startswith('//'):
        tour_url = 'https:' + tour_url
    elif not tour_url.startswith('http'):
        tour_url = 'https://dulichviet.com.vn' + tour_url
        
    headers = HEADERS
    try:
        # Polite delay
        time.sleep(0.1)
        res = robust_get(tour_url, headers=headers, timeout=10)
        if not res or res.status_code != 200:
            print(f"\n[Warning] Failed to fetch details for {tour_url} (Status: {res.status_code if res else 'No Response'})")
            return details
        
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # 1. Lấy mô tả lịch trình chi tiết (ƯU TIÊN 1: cấu trúc titDay và contDay từ web)
        description = ""
        tit_days = soup.find_all(class_='titDay')
        if tit_days:
            itinerary = []
            for tit in tit_days:
                title_text = tit.text.strip()
                title_text = re.sub(r'\s+', ' ', title_text)
                
                sibling = tit.next_sibling
                content_text = ""
                while sibling:
                    if sibling.name == 'div' and 'contDay' in sibling.get('class', []):
                        content_text = sibling.text.strip()
                        break
                    if sibling.name == 'div' and 'titDay' in sibling.get('class', []):
                        break
                    sibling = sibling.next_sibling
                    
                content_text = re.sub(r'\s+', ' ', content_text).strip()
                if content_text:
                    itinerary.append(f"**{title_text}**\n{content_text}")
                else:
                    itinerary.append(f"**{title_text}**")
            
            description = "\n\n".join(itinerary)

        # ƯU TIÊN 2: Lấy từ JSON-LD nếu rỗng
        if not description:
            ld_scripts = soup.find_all('script', type='application/ld+json')
            for script in ld_scripts:
                if not script.string:
                    continue
                try:
                    data = json.loads(script.string)
                    if isinstance(data, dict):
                        types = data.get('@type')
                        is_tour_type = False
                        if isinstance(types, list):
                            is_tour_type = any(t in ['Product', 'Tour', 'Place', 'Trip'] for t in types)
                        elif isinstance(types, str):
                            is_tour_type = types in ['Product', 'Tour', 'Place', 'Trip']
                            
                        if is_tour_type and 'description' in data:
                            desc = data['description'].strip()
                            if desc and len(desc) > 30:
                                description = desc
                                break
                except Exception:
                    pass
                    
        # ƯU TIÊN 3: Dự phòng lấy từ thẻ meta nếu trống
        if not description:
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc and meta_desc.get('content'):
                description = meta_desc.get('content').strip()
            else:
                meta_og = soup.find('meta', attrs={'property': 'og:description'})
                if meta_og and meta_og.get('content'):
                    description = meta_og.get('content').strip()
                    
        # 2. Lấy danh sách ngày khởi hành
        # ƯU TIÊN 1: Trích xuất bảng ngày khởi hành chi tiết dưới dạng JSON
        schedule_list = []
        for table in soup.find_all('table'):
            if "Ngày khởi hành" in table.text:
                for row in table.find_all('tr'):
                    cells = [td.text.strip() for td in row.find_all('td')]
                    if len(cells) == 6:
                        schedule_list.append({
                            'date': cells[1],
                            'spec': re.sub(r'\s+', ' ', cells[2]),
                            'price': cells[3],
                            'seats': cells[4]
                        })
        
        if schedule_list:
            departure_dates = json.dumps(schedule_list, ensure_ascii=False)
        else:
            # ƯU TIÊN 2: Dự phòng lấy danh sách text dạng cũ
            departure_dates = ""
            for li in soup.find_all('li'):
                text = li.text.strip()
                if "Khởi hành:" in text:
                    dates = text.replace("Khởi hành:", "").strip()
                    departure_dates = re.sub(r'\s+', ' ', dates)
                    break
                
        details['description'] = description
        details['departure_dates'] = departure_dates
        
    except Exception as e:
        print(f"Error fetching tour details for {tour_url}: {e}")
        
    return details

def crawl_page(url, category):
    headers = HEADERS
    try:
        response = robust_get(url, headers=headers, timeout=15)
        if not response or response.status_code != 200:
            return []
        
        soup = BeautifulSoup(response.text, 'html.parser')
        scripts = soup.find_all('script', type='application/ld+json')
        
        tours = []
        for script in scripts:
            if not script.string:
                continue
            try:
                data = json.loads(script.string)
                if isinstance(data, dict):
                    # Handle ItemList which contains the tours
                    if data.get('@type') == 'ItemList' or 'itemListElement' in data:
                        elements = data.get('itemListElement', [])
                        for elem in elements:
                            item = elem.get('item', {})
                            if isinstance(item, dict) and item.get('@type') in ['Product', 'Tour', 'Place', 'Trip']:
                                name = item.get('name', '').strip()
                                tour_url = item.get('url', '').strip()
                                image = item.get('image', '').strip()
                                price = None
                                
                                offers = item.get('offers', {})
                                if isinstance(offers, dict):
                                    price = offers.get('price')
                                
                                duration = extract_duration(name)
                                location = extract_location(name)
                                
                                tours.append({
                                    'title': name,
                                    'price': int(price) if price else 0,
                                    'duration': duration,
                                    'location': location,
                                    'category': category,
                                    'image_url': image,
                                    'tour_url': tour_url
                                })
            except Exception as e:
                pass
        return tours
    except Exception as e:
        return []

def get_categories():
    homepage_url = 'https://dulichviet.com.vn/'
    headers = HEADERS
    print("Fetching homepage to extract destination categories...")
    try:
        response = robust_get(homepage_url, headers=headers, timeout=15)
        if not response or response.status_code != 200:
            print(f"Failed to fetch homepage (Status: {response.status_code if response else 'No Response'})")
            return {}
        
        soup = BeautifulSoup(response.text, 'html.parser')
        links = {}
        for a in soup.find_all('a', href=True):
            href = a.get('href').strip()
            if href.startswith('//'):
                href = 'https:' + href
            elif href.startswith('/'):
                href = 'https://dulichviet.com.vn' + href
                
            if 'dulichviet.com.vn/du-lich-' in href:
                # Filter out tour pages, news/articles, and specific types of content
                if '/tour-' not in href and '/tin-tuc' not in href and '/loai-hinh-du-lich' not in href:
                    href = href.split('?')[0].rstrip('/')
                    # Simple classification from URL path
                    # We classify categories as 'Nước ngoài' if they aren't common domestic names
                    domestic_keywords = ["trong-nuoc", "ha-noi", "sapa", "ha-long", "ha-giang", "phu-quoc", "nha-trang", "da-nang", "da-lat", "quy-nhon", "phu-yen", "mien-tay", "ca-mau", "ninh-binh", "hue", "hoi-an"]
                    category = "Trong nước"
                    if not any(kw in href.lower() for kw in domestic_keywords) or "nuoc-ngoai" in href.lower():
                        category = "Nước ngoài"
                        
                    links[href] = category
        return links
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return {}

def run_crawl_process():
    categories = get_categories()
    print(f"Found {len(categories)} unique categories to crawl.")
    
    all_tours = []
    count = 0
    total = len(categories)
    
    for url, cat_name in categories.items():
        count += 1
        ascii_cat = "Trong nuoc" if cat_name == "Trong nước" else "Nuoc ngoai"
        print(f"[{count}/{total}] Crawling: {url} ({ascii_cat})... ", end='', flush=True)
        tours = crawl_page(url, cat_name)
        all_tours.extend(tours)
        print(f" Found {len(tours)} tours.")
        # Be polite and sleep to avoid rate limiting
        time.sleep(0.3)
            
    print(f"\nSuccessfully crawled total {len(all_tours)} raw tour listings.")
    
    unique_tours = []
    if all_tours:
        df = pd.DataFrame(all_tours)
        # Drop duplicates based on URL first
        df = df.drop_duplicates(subset=['tour_url'])
        
        total_unique = len(df)
        print(f"\nFound {total_unique} unique tours. Fetching deep details...")
        
        descriptions = []
        departure_dates_list = []
        tags_list = []
        output_file = 'tours.csv'
        
        # Load existing tours from output_file if it exists to support Delta Crawling
        existing_tours = {}
        if os.path.exists(output_file):
            try:
                df_old = pd.read_csv(output_file, encoding='utf-8-sig')
                df_old = df_old.fillna("")
                for _, old_row in df_old.iterrows():
                    url = old_row.get('tour_url', '')
                    if url:
                        # Restore newlines that were escaped as \\n in CSV
                        existing_tours[url] = {
                            'description': str(old_row.get('description', '')).replace('\\n', '\n'),
                            'departure_dates': str(old_row.get('departure_dates', '')).replace('\\n', '\n'),
                            'tags': str(old_row.get('tags', ''))
                        }
                print(f"Loaded {len(existing_tours)} existing tours from local cache.")
            except Exception as old_err:
                print(f"Warning: Could not parse existing '{output_file}': {old_err}")
        
        for idx, (df_idx, row) in enumerate(df.iterrows()):
            tour_url = row['tour_url']
            title = row['title']
            location = row['location']
            category = row['category']
            
            # Delta matching logic
            if tour_url in existing_tours:
                print(f"[{idx+1}/{total_unique}] Using cached details (No request) for: {title[:45]}... ", end='', flush=True)
                desc = existing_tours[tour_url]['description']
                dep_dates = existing_tours[tour_url]['departure_dates']
                tags = existing_tours[tour_url]['tags']
                
                # Regenerate tags if empty
                if not tags or tags.strip() == "":
                    tags = generate_tags(title, location, category)
                
                descriptions.append(desc)
                departure_dates_list.append(dep_dates)
                tags_list.append(tags)
                print("Done (Cached).")
            else:
                print(f"[{idx+1}/{total_unique}] Fetching details (New Tour) for: {title[:45]}... ", end='', flush=True)
                detail_info = fetch_tour_details(tour_url)
                
                desc = detail_info['description']
                # Clean HTML tags if any
                desc = re.sub(r'<[^>]*>', '', desc)
                desc = desc.replace('\r', '')
                
                dep_dates = detail_info['departure_dates']
                tags = generate_tags(title, location, category)
                
                descriptions.append(desc)
                departure_dates_list.append(dep_dates)
                tags_list.append(tags)
                print("Done (Fetched).")
                
                # Polite sleep only for new fetched tours
                time.sleep(0.3)
            
            # Incremental save & sync every 10 tours, or on the last tour
            if (idx + 1) % 10 == 0 or (idx + 1) == total_unique:
                # Update current processed slice of dataframe
                df_temp = df.head(idx + 1).copy()
                df_temp['description'] = descriptions
                df_temp['departure_dates'] = departure_dates_list
                df_temp['tags'] = tags_list
                
                # Format for CSV output (escaping newlines)
                df_csv = df_temp.copy()
                df_csv['description'] = df_csv['description'].apply(lambda x: str(x).replace('\n', '\\n') if x else '')
                df_csv['departure_dates'] = df_csv['departure_dates'].apply(lambda x: str(x).replace('\n', '\\n') if x else '')
                
                # Save to CSV
                try:
                    df_csv.to_csv(output_file, index=False, encoding='utf-8-sig')
                    # Copy to project root
                    import shutil
                    shutil.copy(output_file, '../tours.csv')
                except Exception:
                    pass
                
                # Incremental sync to Spring Boot REST API
                try:
                    temp_records = df_temp.to_dict(orient='records')
                    sync_to_backend(temp_records)
                except Exception as sync_err:
                    print(f" (Sync update error: {sync_err})", end='', flush=True)
            
            # Polite sleep between detail fetches
            time.sleep(0.3)
            
        df['description'] = descriptions
        df['departure_dates'] = departure_dates_list
        df['tags'] = tags_list
        
        # Final save to CSV (escaping newlines as \\n so Java line reader doesn't split)
        df_csv = df.copy()
        df_csv['description'] = df_csv['description'].apply(lambda x: str(x).replace('\n', '\\n') if x else '')
        df_csv['departure_dates'] = df_csv['departure_dates'].apply(lambda x: str(x).replace('\n', '\\n') if x else '')
        
        try:
            df_csv.to_csv(output_file, index=False, encoding='utf-8-sig')
            print(f"\nCleaned unique data saved to '{output_file}' (UTF-8 with BOM for Excel compatibility)")
        except PermissionError:
            backup_file = 'tours_backup.csv'
            df_csv.to_csv(backup_file, index=False, encoding='utf-8-sig')
            print(f"\n[Warning] '{output_file}' is currently locked. Saved data to backup file: '{backup_file}'")
            
        # Copy to project root if possible
        try:
            import shutil
            shutil.copy(output_file, '../tours.csv')
            print("Successfully copied tours.csv to project root.")
        except Exception as e:
            print(f"Note: Could not copy tours.csv to project root: {e}")
        
        print(f"Total unique tours saved: {len(df)}")
        # Convert df back to list of dicts to return
        unique_tours = df.to_dict(orient='records')
    else:
        print("No tours were found. Please verify network connection.")
        
    return unique_tours

def sync_to_backend(all_tours):
    print("\n[Sync] Sending crawled tours to Spring Boot backend...")
    sync_url = "http://localhost:8080/api/tours/sync"
    try:
        headers = {'Content-Type': 'application/json'}
        # Map fields from python crawler keys to java entity properties
        java_payload = []
        for tour in all_tours:
            java_payload.append({
                'title': tour.get('title'),
                'price': int(tour.get('price', 0)) if tour.get('price') else 0,
                'duration': tour.get('duration'),
                'location': tour.get('location'),
                'category': tour.get('category'),
                'imageUrl': tour.get('image_url'),
                'tourUrl': tour.get('tour_url'),
                'description': tour.get('description'),
                'tags': tour.get('tags'),
                'departureDates': tour.get('departure_dates')
            })

        response = requests.post(sync_url, json=java_payload, headers=headers, timeout=60)
        if response.status_code == 200:
            result = response.json()
            print(f"[Sync] Success! Created: {result.get('created', 0)}, Updated: {result.get('updated', 0)}")
        else:
            print(f"[Sync] Failed. Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        print(f"[Sync] Error communicating with Spring Boot backend: {e}")

def run_schedule(interval_minutes=0):
    print("====================================================")
    if interval_minutes > 0:
        print("📅 PERIODIC CRAWLER SCHEDULER STARTED")
        print(f"Script will run every {interval_minutes} minutes.")
    else:
        print("📅 DAILY CRAWLER SCHEDULER STARTED")
        print("Script will run daily at 06:00 AM.")
    print("Press Ctrl+C to terminate.")
    print("====================================================")
    
    while True:
        now = datetime.datetime.now()
        if interval_minutes > 0:
            next_run = now + datetime.timedelta(minutes=interval_minutes)
        else:
            # Next run is today at 6:00 AM
            next_run = now.replace(hour=6, minute=0, second=0, microsecond=0)
            # If it's already past 6:00 AM today, schedule for tomorrow
            if now >= next_run:
                next_run += datetime.timedelta(days=1)
            
        sleep_seconds = (next_run - now).total_seconds()
        print(f"[Scheduler] Next run at: {next_run.strftime('%Y-%m-%d %H:%M:%S')}")
        if interval_minutes > 0:
            print(f"[Scheduler] Sleeping for {sleep_seconds:.1f} seconds (~{interval_minutes} minutes)...")
        else:
            print(f"[Scheduler] Sleeping for {sleep_seconds:.1f} seconds (~{sleep_seconds/3600:.2f} hours)...")
        
        try:
            time.sleep(sleep_seconds)
        except KeyboardInterrupt:
            print("\n[Scheduler] Terminated by user.")
            break
            
        print(f"\n[Scheduler] Triggering scheduled crawl at {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}...")
        try:
            crawled_tours = run_crawl_process()
            if crawled_tours:
                sync_to_backend(crawled_tours)
        except Exception as e:
            print(f"[Scheduler] Error during execution: {e}")

def main():
    import sys
    # Reconfigure stdout/stderr to use UTF-8 to prevent encoding errors on Windows
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')

    parser = argparse.ArgumentParser(description="Tour Suggestion AI Crawler & Scheduler")
    parser.add_argument('--schedule', action='store_true', help="Run in scheduler mode")
    parser.add_argument('--interval', type=int, default=0, help="Scheduler interval in minutes. If 0, runs daily at 6:00 AM.")
    args = parser.parse_args()

    
    if args.schedule:
        run_schedule(args.interval)
    else:
        print("Running single crawl and synchronization...")
        crawled_tours = run_crawl_process()
        if crawled_tours:
            sync_to_backend(crawled_tours)

if __name__ == '__main__':
    main()
